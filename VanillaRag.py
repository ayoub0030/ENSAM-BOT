import os
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_community.vectorstores import FAISS
from ddgs import DDGS
#import streamlit as st


# Load environment variables
load_dotenv()


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
            
        # Initialize embeddings and LLM
        # langchain-openai 1.x expects `api_key` and `model` arguments
        self.embeddings = OpenAIEmbeddings(
            api_key=self.api_key
        )
        self.llm = ChatOpenAI(
            model="gpt-5-search-api",
            temperature=0.7,
            api_key=self.api_key
        )
    print('model')
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
        print(f"Split into {len(chunks)} chunks of size {chunk_size} with overlap {chunk_overlap}")
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
        self.retriever = self.vectorstore.as_retriever(search_kwargs={"k": 3})
        
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
            docs = self.vectorstore.similarity_search(question, k=3)

        # Build context string from retrieved documents
        context = "\n\n---\n\n".join(doc.page_content for doc in docs)

        prompt = (
            "Use the following pieces of context to answer the question at the end. "
            "If you don't know the answer, just say that you don't know, don't try to make up an answer.\n\n"
            f"Context:\n{context}\n\nQuestion: {question}\n\nAnswer:"
        )

        messages = [
            (
                "system",
                "You are a helpful assistant that answers questions based on the provided context.",
            ),
            ("human", prompt),
        ]

        response = self.llm.invoke(messages)
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
            docs = self.vectorstore.similarity_search(question, k=3)

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

        response = self.llm.invoke(messages)
        try:
            answer = response.content
            print('answer',answer)
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
            self.retriever = self.vectorstore.as_retriever(search_kwargs={"k": 3})
            print(f"Vector store loaded from {path}")
        else:
            raise FileNotFoundError(f"Vector store not found at {path}")


def main():
    """Main function for testing the RAG system"""
    try:
        # Initialize RAG system
        rag = VanillaRAG(docs_folder="docs")
        
        # Build the index
        rag.build_index()
        
      
    except Exception as e:
        print(f"Error: {str(e)}")


if __name__ == "__main__":
    main()
