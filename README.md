# 📄 AI-Powered Document Assistant

An AI-powered **Document Question Answering system** that allows users to upload multiple PDF and TXT documents and chat with their contents using **Retrieval-Augmented Generation (RAG)**.

The system combines **semantic vector search, MMR, BM25 keyword search, and Reciprocal Rank Fusion (RRF)** to retrieve relevant information before generating grounded answers using OpenAI GPT-3.5 Turbo through OpenRouter.

---

## ✨ Features

- 📄 Upload PDF and TXT documents
- 💬 Conversational document question answering
- ✂️ Text chunking with overlapping chunks
- 🔢 Sentence Transformer embeddings
- 🗄️ ChromaDB vector database
- 🔍 Semantic search using MMR
- 🔤 BM25 keyword search
- 🔗 Reciprocal Rank Fusion (RRF)
- ✨ Query rewriting for follow-up questions
- 🤖 LLM-based answer generation using OpenRouter
- 🧹 LLM-based relevance filtering
- 📚 Source citations with filename, page number when available, and chunk ID
- 🖼️ Text extraction from PDF images using OCR
- 📊 Table extraction from PDF documents
- 🛡️ Input validation and error handling
- 🎨 React + Tailwind CSS user interface
- 🗂️ Multi-document upload and retrieval

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
             ┌──────────┴──────────┐
             │                     │
        Document Upload        User Question
             │                     │
             ▼                     ▼
       PDF / TXT Loader       Query Rewriting
             │                     │
             ▼                     ▼
     Text, Tables, OCR       Hybrid Retrieval
             │                ┌────┴────┐
             ▼                ▼         ▼
       Text Chunking        Vector     BM25
             │              MMR      Search
             ▼                └────┬────┘
         Embeddings                ▼
             │                    RRF
             ▼                     │
          ChromaDB                 ▼
                            Top 4 Chunks
                                  │
                                  ▼
                         LLM Relevance Filter
                                  │
                                  ▼
                          OpenRouter LLM
                                  │
                         ┌────────┴────────┐
                         ▼                 ▼
                    AI Response       Citations
                         │                 │
                         └────────┬────────┘
                                  ▼
                             React UI
```

---

## ⚙️ Tech Stack

### Frontend

- React.js
- Vite
- Tailwind CSS
- Axios

### Backend

- Python
- FastAPI
- Uvicorn

### AI / RAG

- LangChain
- OpenRouter API
- OpenAI GPT-3.5 Turbo
- HuggingFace Sentence Transformers
- ChromaDB
- BM25Retriever
- Reciprocal Rank Fusion (RRF)

### Document Processing

- PyPDFLoader
- pdfplumber
- PyMuPDF
- Pillow
- Tesseract OCR
- RecursiveCharacterTextSplitter

---

# 🧠 RAG Pipeline

## 1. 📄 Document Processing

The application supports PDF and TXT files.

- **PDF text:** PyPDFLoader
- **Tables:** pdfplumber
- **Image text (OCR):** PyMuPDF, Pillow, and Tesseract OCR
- **TXT files:** LangChain TextLoader

Extracted content is split into overlapping chunks using `RecursiveCharacterTextSplitter` with `chunk_size=800` and `chunk_overlap=150`.

Each chunk stores metadata such as `document_id`, `filename`, `page`, and `chunk_id` for source identification.

## 2. 🔢 Embeddings

The project uses `sentence-transformers/all-MiniLM-L6-v2` to convert text chunks into vector embeddings, which are stored in ChromaDB for semantic search.

## 3. 🔍 Hybrid Retrieval

The system combines vector search and keyword search to retrieve relevant information.

```text
                  User Query
                      │
             ┌────────┴────────┐
             ▼                 ▼
       Vector Search       BM25 Search
            MMR             Keywords
             │                 │
             └────────┬────────┘
                      ▼
                     RRF
                      │
                      ▼
                Top 4 Chunks
                      │
                      ▼
             Relevance Filtering
```

- **MMR:** Retrieves semantically relevant and diverse chunks (`k=4`, `fetch_k=10`, `lambda_mult=0.5`).
- **BM25:** Finds matches based on keywords, names, and technical terms.
- **RRF:** Combines rankings from both retrieval methods.
- **Relevance Filtering:** Uses an LLM to remove irrelevant chunks before answer generation.

## 4. ✨ Query Rewriting

Follow-up questions are rewritten into standalone queries using the last six chat messages.

**Example:**
- User: What is machine learning?
- User: What are its types?

The system uses conversation history to understand that the second question refers to machine learning.

## 5. 🤖 Answer Generation

LangChain passes the retrieved context to the LLM, which is instructed to:

- Answer using document context.
- Avoid unsupported information.
- Provide clear, concise answers.
- Interpret table values using their correct rows and columns.

If the answer is not found, the system returns:

```text
I couldn't find this information in the uploaded document.
```

## 6. 📚 Source Citations

The backend returns source metadata with each answer, including filenames, page numbers when available, and chunk IDs.

**Example:**

```text
report.pdf
Page 2 • Chunk 3
Page 4 • Chunk 7

notes.txt
Chunk 1
```

PDF citations can include page numbers, while TXT citations may show only chunk IDs. These sources help users identify the content used to generate an answer.---

## 📁 Project Structure

```text
Document-AI-Assistant/
│
├── backend/
│   ├── chroma_db/
│   ├── uploads/
│   ├── utils/
│   │   ├── chunking.py
│   │   ├── document_loader.py
│   │   ├── embeddings.py
│   │   └── rag_pipeline.py
│   ├── app.py
│   ├── requirements.txt
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
├── .env
└── README.md
```

---

## 🚀 Installation and Setup

### Prerequisites

- Python 3.10
- Node.js and npm
- Git
- Tesseract OCR
- OpenRouter API key

### 1. Clone the Repository

```bash
git clone [<YOUR_GITHUB_REPOSITORY_URL>](https://github.com/Yash6352-rs/AI-Powered-Document-Assistant)
cd Document-AI-Assistant
```

### 2. Set Up the Backend

```bash
cd backend

python -m venv venv
```

Activate the virtual environment.

Install the dependencies:

```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Create a `.env` file inside the `backend` directory.

```env
OPENROUTER_API_KEY=your_openrouter_api_key
```

### 4. Configure Tesseract OCR

Install Tesseract OCR on your system.


### 5. Start the Backend

From the `backend` directory, run:

```bash
uvicorn app:app --reload
```

The backend will be available at:

- Backend: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- API documentation: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### 6. Start the Frontend

Open a new terminal and navigate to the frontend directory:

```bash
cd frontend

npm install
npm run dev
```

Open the application in your browser:

[http://localhost:5173](http://localhost:5173)

---

## 🛡️ Error Handling and Logging

The application validates uploaded file types, file sizes, and empty files.

FastAPI returns appropriate error responses for invalid uploads and failed requests. Python logging is used for errors and unexpected failures, while `print()` statements provide progress information during development.

Internal exception details are logged for debugging without exposing them in user-facing error responses.

---

## 📷 Output

The `Output SS/` directory can contain screenshots and demonstration assets, such as:

- Homepage
- 1-user-interface
- 2-file-upload
- 3-text-file_1
- 3-text-file_2
- 3-text-file_3
- 4-pdf-query_1
- 4-pdf-query_2
- 5-pdf-table_1
- 5-pdf-table_2
- 6-pdf-image_1
- 6-pdf-image_2
- 7-pdf-not-found-query
- PDF File Recording
- TXT File Recording

---

## 🔮 Limitations and Future Improvements

- 🔎 **Document filtering:** Add document-specific metadata filtering to restrict retrieval to selected documents when needed.
- 💾 **Persistent BM25 index:** Rebuild or persist the BM25 index across backend restarts.
- 🧾 **Conversation persistence:** Store conversation history beyond the current frontend session.
- 📊 **RAG evaluation:** Evaluate retrieval quality and answer accuracy using a test dataset.
- 🎯 **Reranking:** Add a dedicated reranking model to improve retrieval quality.
- 📄 **Scanned document support:** Improve extraction from complex scanned tables and images.
- 🔗 **Clickable citations:** Allow users to open the original document at a cited page.
- ☁️ **Cloud deployment:** Deploy the frontend and backend to a production environment.

---

## 👨‍💻 Developed By

**Yash Panchal**
