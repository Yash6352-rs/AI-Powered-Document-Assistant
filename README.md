# 📄 RAG Document AI Assistant

An AI-powered **Document Question Answering system** that allows users to upload multiple PDF documents and chat with their contents using **Retrieval-Augmented Generation (RAG)**.

The system combines **semantic vector search, MMR, BM25 keyword search, and Reciprocal Rank Fusion (RRF)** to retrieve relevant information before generating answers with Google's Gemini.

---

## ✨ Features

- 📄 Upload multiple PDF documents
- 💬 Conversational document Q&A
- 🧠 Retrieval-Augmented Generation (RAG)
- ✂️ Automatic text chunking
- 🔢 Sentence Transformer embeddings
- 🗄️ ChromaDB vector database
- 🔍 Semantic search with MMR
- 🔤 BM25 keyword search
- 🔗 Reciprocal Rank Fusion (RRF)
- ✨ Query rewriting using Gemini
- 🤖 Gemini-powered answer generation
- 📚 Source citations with filename, page and chunk ID
- ⚡ Real-time streaming responses
- 🧾 Conversation history
- 🎨 Modern React + Tailwind CSS UI
- 🗂️ Multi-PDF document management

---

# 🏗️ Architecture

```text
                    User
                     │
                     ▼
              React Frontend
                     │
                     ▼
              FastAPI Backend
                     │
        ┌────────────┴────────────┐
        │                         │
    PDF Upload               User Question
        │                         │
        ▼                         ▼
   PyPDFLoader              Query Rewriting
        │                         │
        ▼                         ▼
  Text Chunking             Hybrid Retrieval
        │                    ┌────┴────┐
        ▼                    ▼         ▼
   Embeddings             Vector     BM25
        │                  MMR       Search
        ▼                    └────┬────┘
    ChromaDB                     ▼
        │                        RRF
        │                         │
        └─────────────────────────▼
                            Top 4 Chunks
                                  │
                                  ▼
                            Gemini LLM
                                  │
                         ┌────────┴────────┐
                         ▼                 ▼
                    AI Response       Citations
                         │
                         ▼
                   Stream to UI
```
---

## ⚙️ Tech Stack

- Frontend
  - React.js
  - Vite
  - Tailwind CSS
  - Axios

- Backend
  - Python
  - FastAPI
  - Uvicorn

- AI / RAG
  - LangChain
  - Google Gemini 3.6 Flash
  - ChromaDB
  - BM25Retriever
  - Reciprocal Rank Fusion
  - HuggingFace Embeddings

- PDF Processing
  - PyPDFLoader
  - RecursiveCharacterTextSplitter

---

# 🧠 RAG Pipeline

## 1. Document Processing
Uploaded PDFs are processed using PyPDFLoader.

The extracted text is divided into chunks using:

```python
RecursiveCharacterTextSplitter(
    chunk_size=800, chunk_overlap=150
)
```

Each chunk receives metadata such as:
  document_id
  filename
  page
  chunk_id

## 2. Embeddings

The project uses:
```text
sentence-transformers/all-MiniLM-L6-v2
```
to convert document chunks into vector embeddings.

The embeddings are stored in ChromaDB for semantic retrieval.

## 3. Hybrid Retrieval

When the user asks a question, the system performs two types of retrieval:

```text
User Query
    │
    ├──► Vector Search (MMR)
    │
    └──► BM25 Keyword Search
              │
              ▼
             RRF
              │
              ▼
         Top 4 Chunks
```

## Vector Search

ChromaDB uses MMR (Maximal Marginal Relevance) to retrieve relevant and diverse chunks.

### BM25

BM25 provides keyword-based retrieval, which is useful for exact terms, names, numbers and technical keywords.

The BM25 index is currently maintained in memory.

### RRF

Reciprocal Rank Fusion combines the rankings from vector search and BM25.

---

## ✨ Query Rewriting

The system supports conversational follow-up questions.

For example:
```text
User: What is machine learning?

User: What are its types?
```
The second question is rewritten using Gemini and conversation history into a standalone search query.

This improves retrieval for follow-up questions.

---

## 🤖 Answer Generation

The top retrieved chunks are passed to Gemini.

The model is instructed to:

- Answer only from the provided context
- Avoid hallucinations
- Keep answers clear and concise
- Return an appropriate response when information is unavailable

---

## ⚡ Streaming Responses

The FastAPI backend streams the generated response to the React frontend using NDJSON streaming.

The frontend displays the answer as it is generated.

After generation, the backend sends the source information.

---

## 📚 Citations

Each answer provides source information such as:

```text
📚 Sources

Generative AI Overview.pdf
Page 3 • Chunk 2
Page 6 • Chunk 13
Page 8 • Chunk 21
```

This allows users to understand where the retrieved information came from.

---

## 📂 Multi-PDF Support

Multiple PDFs can be uploaded.

Their chunks are added to:

- ChromaDB for vector search
- BM25 in-memory index for keyword search

This allows the system to retrieve information across multiple documents.

---

## 📁 Project Structure

```text
Rag-Document-AI-Assistant/
│
├── backend/
│   ├── app.py
│   ├── uploads/
│   ├── chroma_db/
│   ├── utils/
│   │   ├── chunking.py
│   │   ├── embeddings.py
│   │   ├── pdf_loader.py
│   │   └── rag_pipeline.py
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

---

## 🚀 Installation

### Backend

```text
cd backend

conda create -n documentai python=3.10
conda activate documentai

pip install -r requirements.txt

uvicorn app:app --reload
```

- Backend:
```text
http://127.0.0.1:8000
```
- API documentation:
```text
http://127.0.0.1:8000/docs
```

### Frontend

```text
cd frontend

npm install
npm run dev
```
- Frontend:
```text
http://localhost:5173
```

### 🔑 Environment Variables

Create .env inside the backend:

```text
GOOGLE_API_KEY=YOUR_GOOGLE_API_KEY
```
---

# 📷 Output 
The output/ folder contains: 
- Screenshots
  - 1-homepage
  - 2-pdf-uploading
  - 3-pdf-uploaded
  - 4-user-ques
  - 5-assistant-answer
  - 6-conversational-chat
  - 7-multi-pdf-upload
  - 8-multi-document-q&a
  - Architecture Diagram
    
---
## 🔮 Future Improvements

- 🔐 User authentication
- 🎯 Metadata-based document filtering
- 💾 Persistent BM25 index
- 📊 RAG evaluation
- 🎯 Dedicated reranking model
- ☁️ Cloud deployment
- 🐳 Docker support
- 📄 PDF preview
- 🔗 Clickable source citations

---

## 👨‍💻 Developed By

Yash Panchal

Built with:

```text
React + FastAPI + LangChain + ChromaDB + BM25 + Gemini
```
