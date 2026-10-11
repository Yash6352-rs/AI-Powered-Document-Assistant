# 📄 AI-Powered Document Assistant

An AI-powered **Document Question Answering system** that allows users to upload multiple PDF and TXT documents and chat with their contents using **Retrieval-Augmented Generation (RAG)**.

The system combines **semantic vector search, MMR, BM25 keyword search, and Reciprocal Rank Fusion (RRF)** to retrieve relevant information before generating grounded answers using OpenAI GPT-3.5 Turbo through OpenRouter.

---

## ✨ Features

- 📄 Upload multiple PDF and TXT documents
- 💬 Conversational document question answering
- 🧠 Retrieval-Augmented Generation (RAG)
- ✂️ Automatic text chunking with overlapping chunks
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
- Lucide React

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

## 1. Document Processing

The application supports PDF and TXT documents.

- **PDF text:** Extracted using PyPDFLoader.
- **Tables:** Extracted using pdfplumber.
- **Images:** Text extracted from embedded PDF images using PyMuPDF, Pillow, and Tesseract OCR.
- **TXT files:** Loaded using LangChain's TextLoader.

The extracted content is divided into smaller, overlapping chunks.

```python
RecursiveCharacterTextSplitter(
    chunk_size=800,
    chunk_overlap=150
)
```

Each chunk stores metadata such as:

- `document_id`
- `filename`
- `page`
- `chunk_id`

This metadata helps identify the source of retrieved information.

## 2. Embeddings

The project uses:

```text
sentence-transformers/all-MiniLM-L6-v2
```

The embedding model converts document chunks into vector representations.

These embeddings are stored in ChromaDB and used for semantic retrieval.

### Why this model?

- Produces compact text embeddings.
- Supports semantic similarity search.
- Is suitable for a lightweight document retrieval pipeline.

## 3. Hybrid Retrieval

When a user asks a question, the system performs vector search and keyword search.

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

### Vector Search with MMR

Maximum Marginal Relevance (MMR) retrieves semantically relevant chunks while encouraging diversity in the results.

The current configuration uses:

- `k = 4`
- `fetch_k = 10`
- `lambda_mult = 0.5`

### BM25 Keyword Search

BM25 retrieves chunks based on keyword matching. It is useful for exact terms, names, numbers, and technical keywords.

The BM25 index is currently maintained in memory.

### Reciprocal Rank Fusion (RRF)

RRF combines the ranked results from vector search and BM25 into a unified ranking.

The system selects the top four fused chunks before applying LLM-based relevance filtering.

### LLM-Based Relevance Filtering

The LLM evaluates whether each retrieved chunk contains information useful for answering the user's question.

Chunks judged irrelevant are removed before answer generation.

---

## ✨ Query Rewriting

The system supports conversational follow-up questions by rewriting them into standalone search queries.

For example:

```text
User: What is machine learning?

Assistant: Machine learning is ...

User: What are its types?
```

The second question is rewritten using the conversation history so that the retrieval pipeline can identify the correct subject.

The current implementation uses the last six chat messages, corresponding to approximately three user-assistant exchanges.

---

## 🤖 Answer Generation

The selected document chunks are passed to the language model through LangChain.

The model is instructed to:

- Answer using only the supplied document context.
- Avoid unsupported information.
- Keep answers clear and concise.
- Match values to the correct table rows and columns.
- Return a predefined fallback response when the answer is not supported by the context.

If relevant information is not found, the application returns:

```text
I couldn't find this information in the uploaded document.
```

---

## 📚 Source Citations

The backend returns source metadata alongside the generated answer.

Example:

```text
Sources

report.pdf
Page 2 • Chunk 3
Page 4 • Chunk 7

notes.txt
Chunk 1
```

PDF sources can include page numbers, while TXT sources may contain chunk IDs without page numbers.

Citations help users identify which retrieved document chunks were used as context for an answer.

---

## 📂 Multiple Document Support

The application allows users to upload multiple documents.

Their chunks are added to:

- **ChromaDB:** For vector-based retrieval.
- **BM25 in-memory index:** For keyword-based retrieval.

The retrieval pipeline combines results from these sources to find relevant information across indexed documents.

The current implementation searches across the indexed documents rather than applying a document-specific filter to each question. The BM25 index is also maintained in memory.

---

## 📁 Project Structure

```text
Document-AI-Assistant/
│
├── backend/
│   ├── app.py
│   ├── uploads/
│   ├── chroma_db/
│   ├── utils/
│   │   ├── chunking.py
│   │   ├── embeddings.py
│   │   ├── document_loader.py
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

*Adjust the structure above if any directory or filename differs in your actual repository.*

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
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd Document-AI-Assistant
```

Replace the placeholder URL with your actual GitHub repository URL.

### 2. Set Up the Backend

```bash
cd backend

python -m venv venv
```

Activate the virtual environment.

**Windows PowerShell:**

```powershell
.\venv\Scripts\Activate.ps1
```

**Windows Command Prompt:**

```cmd
venv\Scripts\activate.bat
```

Install the dependencies:

```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Create a `.env` file inside the `backend` directory.

```env
OPENROUTER_API_KEY=your_openrouter_api_key
```

Replace the placeholder with your actual API key.

**Important:** Never commit your `.env` file, API keys, or other credentials to GitHub.

### 4. Configure Tesseract OCR

Install Tesseract OCR on your system.

If necessary, configure its executable path in your document-loading code:

```python
pytesseract.pytesseract.tesseract_cmd = (
    r"C:\Program Files\Tesseract-OCR\tesseract.exe"
)
```

Update the path to match your Tesseract installation.

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

## 🧪 Usage

1. Start the backend and frontend.
2. Open the application in your browser.
3. Upload a PDF or TXT document.
4. Wait for document processing to complete.
5. Ask a question about the uploaded content.
6. Review the answer and source citations.
7. Ask follow-up questions using conversation context.
8. Ask a question whose answer is absent from the document to test the fallback response.

---

## 🛡️ Error Handling and Logging

The application validates uploaded file types, file sizes, and empty files.

FastAPI returns appropriate error responses for invalid uploads and failed requests. Python logging is used for errors and unexpected failures, while `print()` statements provide progress information during development.

Internal exception details are logged for debugging without exposing them in user-facing error responses.

---

## 📷 Output

The `output/` directory can contain screenshots and demonstration assets, such as:

- Homepage
- Document upload
- Uploaded document list
- User question
- Assistant answer
- Follow-up conversation
- Multiple document upload
- Multi-document question answering
- Architecture diagram

Add these screenshots if you include an `output/` directory in the repository.

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
- 🐳 **Docker support:** Simplify setup and deployment with containerization.

---

## 👨‍💻 Developed By

**Yash Panchal**

Built with:

```text
React + FastAPI + LangChain + ChromaDB
+ HuggingFace Embeddings + BM25 + OpenRouter
```
