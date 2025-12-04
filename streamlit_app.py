import streamlit as st
import os
from VanillaRag import VanillaRAG

# Page configuration
st.set_page_config(
    page_title="Vanilla RAG System",
    page_icon="📚",
    layout="wide"
)

# Custom CSS
st.markdown("""
<style>
    .main-header {
        font-size: 2.5rem;
        color: #1E88E5;
        text-align: center;
        margin-bottom: 2rem;
    }
    .stTextInput > div > div > input {
        font-size: 1.1rem;
    }
    .answer-box {
        background-color: #f8f9fb;
        color: #111111 !important;
        padding: 1.5rem;
        border-radius: 0.5rem;
        border-left: 5px solid #1E88E5;
        margin: 1rem 0;
        font-size: 1rem;
        line-height: 1.5;
        white-space: pre-wrap;
    }
    .source-box {
        background-color: #fff9e6;
        color: #111111 !important;
        padding: 1rem;
        border-radius: 0.5rem;
        margin: 0.5rem 0;
        border-left: 3px solid #ffc107;
        font-size: 0.95rem;
        line-height: 1.5;
        white-space: pre-wrap;
    }
</style>
""", unsafe_allow_html=True)

# Initialize session state
if 'rag' not in st.session_state:
    st.session_state.rag = None
if 'index_built' not in st.session_state:
    st.session_state.index_built = False
if 'chat_history' not in st.session_state:
    st.session_state.chat_history = []
if 'use_web_search' not in st.session_state:
    st.session_state.use_web_search = False

# Header
st.markdown('<h1 class="main-header">📚 ENSAM RAG System</h1>', unsafe_allow_html=True)
st.markdown("### A simple Retrieval-Augmented Generation system using OpenAI")

# Sidebar
with st.sidebar:
    st.header("⚙️ Configuration")
    
    # API Key input
    api_key = st.text_input(
        "OpenAI API Key",
        type="password",
        help="Enter your OpenAI API key"
    )
    
    if api_key:
        os.environ["OPENAI_API_KEY"] = api_key
    
    st.divider()
    
    # RAG Configuration
    st.subheader("RAG Parameters")
    chunk_size = st.slider("Chunk Size", 100, 200, 350, 50)
    chunk_overlap = st.slider("Chunk Overlap", 0, 500, 200, 50)
    
    st.divider()
    
    # Web Search Toggle
    st.subheader("Web Search")
    st.session_state.use_web_search = st.checkbox("🌐 Enable Web Search", value=st.session_state.use_web_search, help="Augment answers with real-time web search results")
    
    # Build Index Button
    if st.button("🔨 Build Index", type="primary", use_container_width=True):
        if not api_key:
            st.error("⚠️ Please enter your OpenAI API key first!")
        else:
            with st.spinner("Building RAG index... This may take a few minutes."):
                try:
                    # Initialize RAG system
                    st.session_state.rag = VanillaRAG(
                        docs_folder="docs",
                        chunk_size=chunk_size,
                        chunk_overlap=chunk_overlap
                    )
                    
                    # Build the index
                    st.session_state.rag.build_index()
                    st.session_state.index_built = True
                    
                    st.success("✅ Index built successfully!")
                    st.balloons()
                    
                except Exception as e:
                    st.error(f"❌ Error building index: {str(e)}")
                    st.session_state.index_built = False
    
    # Status indicator
    st.divider()
    if st.session_state.index_built:
        st.success("✅ RAG System Ready")
    else:
        st.warning("⚠️ Index not built yet")
    
    # Clear chat button
    if st.button("🗑️ Clear Chat History", use_container_width=True):
        st.session_state.chat_history = []
        st.rerun()

# Main content area
col1, col2 = st.columns([2, 1])

with col1:
    st.subheader("💬 Ask Questions")
    
    # Check if system is ready
    if not st.session_state.index_built:
        st.info("👈 Please configure your API key and build the index using the sidebar.")
    else:
        # Question input
        question = st.text_input(
            "Enter your question:",
            placeholder="e.g., What is this document about?",
            key="question_input"
        )
        
        col_btn1, col_btn2, col_btn3 = st.columns([1, 1, 2])
        
        with col_btn1:
            ask_button = st.button("🔍 Ask", type="primary", use_container_width=True)
        
        # Process question
        if ask_button and question:
            with st.spinner("Searching and generating answer..."):
                try:
                    # Query the RAG system with optional web search
                    if st.session_state.use_web_search:
                        result = st.session_state.rag.query_with_web_search(question, use_web_search=True)
                    else:
                        result = st.session_state.rag.query(question)
                    
                    # Add to chat history
                    st.session_state.chat_history.append({
                        "question": question,
                        "answer": result["answer"],
                        "sources": result["source_documents"],
                        "web_results": result.get("web_results", [])
                    })
                    
                    # Clear input
                    st.rerun()
                    
                except Exception as e:
                    st.error(f"❌ Error: {str(e)}")
        
        # Display chat history
        if st.session_state.chat_history:
            st.divider()
            st.subheader("📝 Conversation History")
            
            for i, chat in enumerate(reversed(st.session_state.chat_history)):
                with st.expander(f"Q: {chat['question']}", expanded=(i == 0)):
                    st.markdown(f'<div class="answer-box"><strong>Answer:</strong><br>{chat["answer"]}</div>', 
                              unsafe_allow_html=True)
                    
                    st.markdown(f"**📄 Sources Used:** {len(chat['sources'])} document chunks")
                    
                    # Show source excerpts
                    with st.expander("View Source Excerpts"):
                        for j, doc in enumerate(chat['sources'][:3], 1):  # Show top 3 sources
                            st.markdown(f'<div class="source-box"><strong>Source {j}:</strong><br>{doc.page_content[:300]}...</div>', 
                                      unsafe_allow_html=True)
                    
                    # Show web results if available
                    if chat.get("web_results"):
                        st.markdown("**🌐 Web Search Results:**")
                        with st.expander("View Web Results"):
                            for j, result in enumerate(chat["web_results"][:3], 1):
                                st.markdown(f"""
                                **{j}. {result.get('title', 'No title')}**
                                
                                {result.get('body', 'No description')}
                                
                                🔗 [Link]({result.get('href', '#')})
                                """)
                            st.divider()

with col2:
    st.subheader("📊 System Info")
    
    # Document info
    if os.path.exists("docs"):
        pdf_files = [f for f in os.listdir("docs") if f.endswith('.pdf')]
        st.metric("PDF Documents", len(pdf_files))
        
        if pdf_files:
            st.write("**Files:**")
            for pdf in pdf_files:
                st.write(f"📄 {pdf}")
    
    st.divider()
    
    # Example questions
    st.subheader("💡 Example Questions")
    example_questions = [
        "What is this document about?",
        "Can you summarize the main topics?",
        "What are the key points?",
        "Tell me about the content"
    ]
    
    for eq in example_questions:
        if st.button(eq, use_container_width=True, key=f"example_{eq}"):
            if st.session_state.index_built:
                with st.spinner("Searching and generating answer..."):
                    try:
                        if st.session_state.use_web_search:
                            result = st.session_state.rag.query_with_web_search(eq, use_web_search=True)
                        else:
                            result = st.session_state.rag.query(eq)
                        st.session_state.chat_history.append({
                            "question": eq,
                            "answer": result["answer"],
                            "sources": result["source_documents"],
                            "web_results": result.get("web_results", [])
                        })
                        st.rerun()
                    except Exception as e:
                        st.error(f"❌ Error: {str(e)}")
            else:
                st.warning("Please build the index first!")


