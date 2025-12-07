
import os
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_community.vectorstores import FAISS
from langchain_google_genai import ChatGoogleGenerativeAI
from datetime import datetime, timedelta
from ddgs import DDGS
# import streamlit as st


# Load environment variables
load_dotenv()


GEMINI_API_KEYS = [
    os.getenv("GEMINI_API_KEY_1"),
    os.getenv("GEMINI_API_KEY_2"),
    os.getenv("GEMINI_API_KEY_3"),
]

API_QUOTA_LIMIT = 10          # requests per 60s per project/model
API_QUOTA_WINDOW = 60         # seconds


class GeminiAPIManager:
    def __init__(self, api_keys):
        self.api_keys = [k for k in api_keys if k]
        if not self.api_keys:
            raise ValueError("No Gemini API keys provided")
        self.current_api_index = 0
        self.api_request_history = {i: [] for i in range(len(self.api_keys))}

    def get_current_api_key(self):
        return self.api_keys[self.current_api_index]

    def record_request(self, api_index):
        self.api_request_history[api_index].append(datetime.now())

    def get_quota_usage(self, api_index):
        now = datetime.now()
        cutoff_time = now - timedelta(seconds=API_QUOTA_WINDOW)
        return sum(1 for t in self.api_request_history[api_index] if t > cutoff_time)

    def is_quota_exceeded(self, api_index):
        return self.get_quota_usage(api_index) >= API_QUOTA_LIMIT

    def rotate_to_next_api(self):
        original_index = self.current_api_index
        for _ in range(len(self.api_keys)):
            next_index = (self.current_api_index + 1) % len(self.api_keys)
            self.current_api_index = next_index
            if not self.is_quota_exceeded(next_index):
                print(f"[FALLBACK] Switched from API {original_index} to API {next_index}")
                return True
        print("[WARNING] All Gemini APIs have exceeded quota")
        return False


class VanillaRAG:
    """Simple RAG system using OpenAI embeddings and GPT"""

    def __init__(self, docs_folder="docs", chunk_size=1000, chunk_overlap=200):
        """
        Initialize the RAG system

        Args:
            docs_folder: Path to folder containing PDF files
            chunk_size: Size of text chunks for splitting
            chunk_overlap: Overlap between chunks
        """
        self.docs_folder = docs_folder
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.vectorstore = None
        self.retriever = None

        # Get OpenAI API key from environment
        self.api_key = os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY not found in environment variables")

        # Initialize embeddings and (legacy) OpenAI LLM
        # Embeddings: OpenAI
        self.embeddings = OpenAIEmbeddings(
            api_key=self.api_key
        )
        # OpenAI chat is now unused but kept as you requested
        self.llm = ChatOpenAI(
            model="gpt-5-search-api",
            temperature=0.7,
            api_key=self.api_key
        )
        # Initialize Gemini multi-API manager
        self.gemini_manager = GeminiAPIManager(GEMINI_API_KEYS)

    def load_documents(self):
        """Load all PDF documents from the docs folder"""
        documents = []

        if not os.path.exists(self.docs_folder):
            raise FileNotFoundError(f"Docs folder '{self.docs_folder}' not found")

        pdf_files = [f for f in os.listdir(self.docs_folder) if f.endswith('.pdf')]

        if not pdf_files:
            raise FileNotFoundError(f"No PDF files found in '{self.docs_folder}'")

        print(f"Loading {len(pdf_files)} PDF file(s)...")

        for pdf_file in pdf_files:
            pdf_path = os.path.join(self.docs_folder, pdf_file)
            loader = PyPDFLoader(pdf_path)
            docs = loader.load()
            documents.extend(docs)
            print(f"  - Loaded: {pdf_file} ({len(docs)} pages)")

        return documents

    def split_documents(self, documents):
        """Split documents into chunks"""
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap,
            length_function=len
        )

        chunks = text_splitter.split_documents(documents)
        print(f"Split into {len(chunks)} chunks of size {self.chunk_size} with overlap {self.chunk_overlap}")
        return chunks

    def create_vectorstore(self, chunks):
        """Create FAISS vectorstore from document chunks"""
        print("Creating embeddings and vector store...")
        self.vectorstore = FAISS.from_documents(chunks, self.embeddings)
        print("Vector store created successfully!")
        return self.vectorstore

    def build_index(self, index_path="vectorstore"):
        """Build the complete RAG index from documents"""
        print("\n=== Building RAG Index ===")

        # If an index already exists on disk, load it instead of rebuilding
        if os.path.exists(index_path):
            print(f"Found existing vector store at '{index_path}', loading instead of rebuilding...")
            self.load_vectorstore(index_path)
            print("=== RAG Index Loaded ===\n")
            return

        # Load documents
        documents = self.load_documents()

        # Split into chunks
        chunks = self.split_documents(documents)

        # Create vector store
        self.create_vectorstore(chunks)

        # Create retriever
        self.retriever = self.vectorstore.as_retriever(search_kwargs={"k": 5})

        # Save to disk for future runs
        self.save_vectorstore(index_path)

        print("=== RAG Index Ready ===\n")

    def query(self, question):
        """
        Query the RAG system

        Args:
            question: User question

        Returns:
            Dictionary with answer and source documents
        """
        if self.vectorstore is None:
            raise ValueError("Vector store not initialized. Call build_index() first.")

        # Retrieve relevant documents
        if self.retriever is not None:
            docs = self.retriever.invoke(question)
        else:
            docs = self.vectorstore.similarity_search(question, k=5)

        # Build context string from retrieved documents
        context = "\n\n---\n\n".join(doc.page_content for doc in docs)

        prompt = (
            "Use the following pieces of context to answer the question at the end. "
            "the tone should be freindly and If you don't know the answer, just say that you don't know, don't try to make up an answer.\n\n"
            f"Context:\n{context}\n\nQuestion: {question}\n\nAnswer:"
        )

        messages = [
            (
                "system",
                "You are a helpful assistant that answers questions based on the provided context.",
            ),
            ("human", prompt),
        ]

        # USE GEMINI (multi-key) INSTEAD OF OPENAI HERE
        response = self._invoke_with_gemini(messages)

        try:
            answer = response.content
        except AttributeError:
            answer = str(response)

        return {
            "answer": answer,
            "source_documents": docs
        }

    def web_search(self, query, num_results=3):
        """
        Perform a web search using DDGS (DuckDuckGo-based metasearch).

        Args:
            query: Search query
            num_results: Number of results to return

        Returns:
            List of search results with title, link, and snippet
        """
        try:
            # DDGS.text returns a generator; convert it to a list for reuse
            with DDGS() as ddgs:
                results = [r for r in ddgs.text(query, max_results=num_results)]
            return results
        except Exception as e:
            print(f"Web search error: {str(e)}")
            return []

    def query_with_web_search(self, question, use_web_search=False):
        """
        Query the RAG system with optional web search augmentation

        Args:
            question: User question
            use_web_search: Whether to augment with web search results

        Returns:
            Dictionary with answer, source documents, and web results
        """
        if self.vectorstore is None:
            raise ValueError("Vector store not initialized. Call build_index() first.")

        # Retrieve relevant documents from local PDF
        if self.retriever is not None:
            docs = self.retriever.invoke(question)
        else:
            docs = self.vectorstore.similarity_search(question, k=5)

        # Build context from local documents
        context = "\n\n---\n\n".join(doc.page_content for doc in docs)

        # Optionally augment with web search
        web_results = []
        web_context = ""
        if use_web_search:
            web_results = self.web_search(question, num_results=3)
            if web_results:
                web_snippets = [
                    f"- {r.get('title', 'No title')}: {r.get('body', 'No description')}"
                    for r in web_results
                ]
                web_context = "\n\nWeb Search Results:\n" + "\n".join(web_snippets)

        # Build final prompt
        prompt = (
            "Use the following pieces of context to answer the question at the end. "
            "If you don't know the answer, just say that you don't know, don't try to make up an answer.\n\n"
            f"Context:\n{context}"
        )

        if web_context:
            prompt += web_context

        prompt += f"\n\nQuestion: {question}\n\nAnswer:"

        messages = [
            (
                "system",
                "You are a helpful assistant that answers questions based on the provided context and optional web results.",
            ),
            ("human", prompt),
        ]

        # USE GEMINI (multi-key) INSTEAD OF OPENAI HERE
        response = self._invoke_with_gemini(messages)

        try:
            answer = response.content
            print("answer", answer)
        except AttributeError:
            answer = str(response)

        return {
            "answer": answer,
            "source_documents": docs,
            "web_results": web_results
        }

    def save_vectorstore(self, path="vectorstore"):
        """Save the vector store to disk"""
        if self.vectorstore:
            self.vectorstore.save_local(path)
            print(f"Vector store saved to {path}")

    def load_vectorstore(self, path="vectorstore"):
        """Load the vector store from disk"""
        if os.path.exists(path):
            self.vectorstore = FAISS.load_local(
                path,
                self.embeddings,
                allow_dangerous_deserialization=True
            )
            self.retriever = self.vectorstore.as_retriever(search_kwargs={"k": 5})
            print(f"Vector store loaded from {path}")
        else:
            raise FileNotFoundError(f"Vector store not found at {path}")

    def _invoke_with_gemini(self, messages):
        max_retries = len(self.gemini_manager.api_keys)
        last_error = None

        for _ in range(max_retries):
            try:
                current_index = self.gemini_manager.current_api_index
                current_key = self.gemini_manager.get_current_api_key()

                # Our own quota pre-check
                if self.gemini_manager.is_quota_exceeded(current_index):
                    print(f"[QUOTA] Gemini API {current_index} quota exceeded")
                    if not self.gemini_manager.rotate_to_next_api():
                        raise Exception("All Gemini APIs have exceeded quota")
                    continue

                llm = ChatGoogleGenerativeAI(
                    model="gemini-2.5-flash",
                    temperature=0.7,
                    google_api_key=current_key,
                    max_retries=0,  # disable internal retries; we handle 429 ourselves
                )

                response = llm.invoke(messages)
                self.gemini_manager.record_request(current_index)
                print(f"[SUCCESS] Response from Gemini API {current_index}")
                return response

            except Exception as e:
                last_error = e
                msg = str(e).lower()
                print(f"[ERROR] Gemini API {self.gemini_manager.current_api_index} failed: {e}")

                if "quota" in msg or "rate" in msg or "429" in msg:
                    if not self.gemini_manager.rotate_to_next_api():
                        break
                else:
                    if not self.gemini_manager.rotate_to_next_api():
                        break

        if last_error is not None:
            raise last_error
        raise Exception("Could not get response from any Gemini API")


def main():
    """Main function for testing the RAG system"""
    try:
        # Initialize RAG system
        rag = VanillaRAG(docs_folder="docs")

        # Build the index
        rag.build_index()

        # Example queries (you can add them back here if you want)
        # result = rag.query("Your question")
        # print(result["answer"])

    except Exception as e:
        print(f"Error: {str(e)}")


if __name__ == "__main__":
    main()
