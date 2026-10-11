import os
import uuid
import shutil
import logging

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from utils.embeddings import clear_vector_db
from utils.rag_pipeline import reset_bm25_retriever

from utils.rag_pipeline import (
    process_document,
    get_rag_chain,
    rewrite_query,
    hybrid_retrieve
)

# Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)

app = FastAPI(title="Document AI Assistant")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_FOLDER = "uploads"
MAX_FILE_SIZE = 10 * 1024 * 1024
ALLOWED_EXTENSIONS = {".pdf", ".txt"}

# Create uploads folder and remove old uploaded files at startup
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

for filename in os.listdir(UPLOAD_FOLDER):
    filepath = os.path.join(UPLOAD_FOLDER, filename)

    try:
        if os.path.isfile(filepath) or os.path.islink(filepath):
            os.remove(filepath)
        elif os.path.isdir(filepath):
            shutil.rmtree(filepath)
    except OSError:
        logger.exception("Failed to remove an old uploaded item")
        raise

clear_vector_db()
reset_bm25_retriever()

logger.info("Previous session data cleared successfully.")


@app.get("/")
def home():
    return {
        "success": True,
        "message": "Document AI Backend Running"
    }


@app.post("/uploads")
async def upload_document(file: UploadFile = File(...)):
    filepath = None

    try:
        if not file.filename:
            raise HTTPException(
                status_code=400,
                detail="No file selected."
            )

        extension = os.path.splitext(file.filename)[1].lower()

        if extension not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail="Only PDF and TXT files are supported."
            )

        contents = await file.read(MAX_FILE_SIZE + 1)

        if not contents:
            raise HTTPException(
                status_code=400,
                detail="Uploaded file is empty."
            )

        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail="File size must not exceed 10 MB."
            )

        filename = f"{uuid.uuid4().hex}{extension}"
        filepath = os.path.join(UPLOAD_FOLDER, filename)

        with open(filepath, "wb") as f:
            f.write(contents)

        results = process_document(
            filepath,
            original_filename=file.filename
        )

        logger.info("Document processed successfully: %s", filename)

        return {
            "success": True,
            "document_id": results["document_id"],
            "filename": file.filename,
            "chunks": results["chunks"]
        }

    except HTTPException:
        raise

    except (ValueError, FileNotFoundError) as e:
        logger.warning(
            "Document processing failed: %s",
            type(e).__name__
        )

        if filepath and os.path.exists(filepath):
            os.remove(filepath)

        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

    except Exception:
        logger.exception("Unexpected document upload failure")

        if filepath and os.path.exists(filepath):
            os.remove(filepath)

        raise HTTPException(
            status_code=500,
            detail="Document processing failed. Please try again."
        )

    finally:
        await file.close()


@app.post("/chat")
async def chat(data: dict):
    if not isinstance(data, dict):
        raise HTTPException(
            status_code=400,
            detail="Request body must be a JSON object."
        )

    question = data.get("question", "")
    document_id = data.get("document_id", "")
    chat_history = data.get("chat_history", [])

    if not isinstance(question, str) or not question.strip():
        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty."
        )

    if not isinstance(document_id, str) or not document_id.strip():
        raise HTTPException(
            status_code=400,
            detail="Document ID is required."
        )

    if not isinstance(chat_history, list):
        raise HTTPException(
            status_code=400,
            detail="Chat history must be a list."
        )

    for message in chat_history:
        if (
            not isinstance(message, dict)
            or not isinstance(message.get("role"), str)
            or not isinstance(message.get("content"), str)
        ):
            raise HTTPException(
                status_code=400,
                detail="Each chat history item must contain role and content strings."
            )

    question = question.strip()

    try:
        search_query = rewrite_query(question, chat_history)

        documents = hybrid_retrieve(search_query)

        for doc in documents:
            logger.info(
                "Retrieved source: %s | Content: %s",
                doc.metadata.get("filename"),
                doc.page_content
            )

        if not documents:
            logger.info("No relevant chunks found for chat request")

            return {
                "success": True,
                "answer": "I couldn't find this information in the uploaded document.",
                "sources": []
            }

        document_chain = get_rag_chain()

        unique_sources = set()

        for doc in documents:
            logger.info("SOURCE METADATA: %s", doc.metadata)

            filename = doc.metadata.get("filename", "Unknown")
            page = doc.metadata.get("page")
            page = page + 1 if isinstance(page, int) else None
            chunk = doc.metadata.get("chunk_id", "-")

            unique_sources.add((filename, page, chunk))

        sources = [
            {
                "filename": filename,
                "page": page,
                "chunk": chunk
            }
            for filename, page, chunk in sorted(
                unique_sources,
                key=lambda item: (
                    item[0],
                    item[1] or 0,
                    str(item[2])
                )
            )
        ]

        response = document_chain.invoke({
            "context": documents,
            "input": search_query
        })

        logger.info("Chat request completed successfully")

        return {
            "success": True,
            "answer": response,
            "sources": sources
        }

    except Exception:
        logger.exception("Chat request failed")

        raise HTTPException(
            status_code=500,
            detail="Unable to process the question. Please try again."
        )