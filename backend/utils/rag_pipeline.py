import os
import uuid
import logging

from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_community.retrievers import BM25Retriever

from utils.embeddings import load_vector_db, create_vector_db
from utils.document_loader import load_document
from utils.chunking import create_chunks

# Logging
logger = logging.getLogger(__name__)

load_dotenv()

# LLM 
llm = ChatOpenAI(
    model="openai/gpt-3.5-turbo",
    openai_api_key=os.getenv("OPENROUTER_API_KEY"),
    base_url="https://openrouter.ai/api/v1",
    temperature=0,
    max_tokens=300
)

# BM25 Retriever
bm25_retriever = None

def reset_bm25_retriever():
    global bm25_retriever
    bm25_retriever = None
    logger.info("BM25 retriever reset successfully.")

# Process Uploaded Document
def process_document(file_path, original_filename=None):
    global bm25_retriever

    # Load PDF or TXT document
    documents = load_document(file_path)
    document_id = str(uuid.uuid4())

    chunks = create_chunks(documents)

    if not chunks:
        raise ValueError("No readable chunks were created.")

    # Preserve the original uploaded filename
    display_filename = original_filename or os.path.basename(file_path)

    # Add metadata to each chunk
    for chunk_id, chunk in enumerate(chunks):
        chunk.metadata["document_id"] = document_id
        chunk.metadata["filename"] = display_filename
        chunk.metadata["chunk_id"] = chunk_id

    # Store chunks in ChromaDB
    create_vector_db(chunks)

    # Create or update BM25 retriever
    if bm25_retriever is None:
        existing_docs = chunks
    else:
        existing_docs = bm25_retriever.docs + chunks

    bm25_retriever = BM25Retriever.from_documents(existing_docs)
    bm25_retriever.k = 4

    logger.info(
        "Document processed: %s, chunks: %s",
        display_filename,
        len(chunks)
    )

    return {
        "document_id": document_id,
        "filename": display_filename,
        "chunks": len(chunks)
    }


# Query Rewriting
def rewrite_query(question, chat_history):
    if not chat_history:
        return question

    history_text = ""

    # Use the last 3 conversation turns
    for message in chat_history[-6:]:
        role = message.get("role", "")
        content = message.get("content", "")

        history_text += f"{role}: {content}\n"

    prompt = f"""
        You rewrite follow-up questions into standalone search queries.

        Rules:
        - Resolve pronouns such as "it", "its", and "they" using the
        most recent relevant conversation context.
        - Give priority to the latest user question and its answer.
        - Preserve the entity established in the latest relevant exchange.
        - Do not reuse an older entity if a newer exchange identifies
        a different entity.
        - Do not answer the question.
        - Return only the standalone search query.

        Conversation history:
        {history_text}

        Latest question:
        {question}

        Standalone search query:
        """

    try:
        response = llm.invoke(prompt)
        search_query = response.content.strip()

        if not search_query:
            return question

        logger.info("Original question: %s", question)
        logger.info("Rewritten query: %s", search_query)

        return search_query

    except Exception:
        logger.exception("Query rewriting failed.")
        return question

# Reciprocal Rank Fusion
def reciprocal_rank_fusion(vector_docs, keyword_docs, k=60):
    scores = {}
    documents = {}

    for results in [vector_docs, keyword_docs]:
        for rank, doc in enumerate(results, start=1):
            key = (
                doc.metadata.get("document_id"),
                doc.metadata.get("filename"),
                doc.metadata.get("page"),
                doc.metadata.get("chunk_id")
            )

            scores[key] = scores.get(key, 0) + 1 / (k + rank)
            documents[key] = doc

    ranked_documents = sorted(
        documents.items(),
        key=lambda item: scores[item[0]],
        reverse=True
    )

    return [
        doc
        for key, doc in ranked_documents[:4]
    ]


# Filter Irrelevant Documents
def filter_relevant_documents(query, documents):
    if not documents:
        return []

    relevant_docs = []

    for doc in documents:
        prompt = f"""
                Determine whether the document chunk contains information
                that can help answer the user's question.

                Question:
                {query}

                Document chunk:
                {doc.page_content}

                Return only YES or NO.
                """

        try:
            response = llm.invoke(prompt)
            result = response.content.strip().upper()

            if result == "YES":
                relevant_docs.append(doc)

        except Exception:
            logger.exception("Document relevance check failed.")
            raise

    # Do not return irrelevant chunks when all are rejected
    if not relevant_docs:
        logger.info("No relevant document chunks found.")
        return []

    return relevant_docs


# Hybrid Retrieval
def hybrid_retrieve(query):
    vectordb = load_vector_db()

    # Vector search across uploaded documents
    vector_retriever = vectordb.as_retriever(
        search_type="mmr",
        search_kwargs={
            "k": 4,
            "fetch_k": 10,
            "lambda_mult": 0.5
        }
    )

    vector_docs = vector_retriever.invoke(query)

    # Keyword search across uploaded documents
    keyword_docs = []

    if bm25_retriever is not None:
        keyword_docs = bm25_retriever.invoke(query)

    # Combine results using Reciprocal Rank Fusion
    final_docs = reciprocal_rank_fusion(
        vector_docs,
        keyword_docs
    )

    # Remove irrelevant chunks
    final_docs = filter_relevant_documents(
        query,
        final_docs
    )
    
    return final_docs


# RAG Answer Generation
def get_rag_chain():
    prompt = ChatPromptTemplate.from_template("""
You are a helpful Document AI Assistant.

Answer questions ONLY using the provided document context.

Rules:
- Never make up information.
- If the answer is not supported by the context, reply exactly:
  "I couldn't find this information in the uploaded document."

- Answer the exact question asked.
- Keep answers clear, concise, and well-structured.
- Do not return the entire table when only one value is requested.
- If the question asks about a specific quarter, return only
  the information relevant to that quarter.
- If the question refers to an entity identified in the conversation,
  use the resolved question provided as input.
- Use bullet points when appropriate.
- For definitions, answer in 2–4 sentences.
- For lists, use bullet points.
- For summaries, summarize only the provided context.
- Do not introduce unsupported information.
- Do not mention page numbers in the answer.
- Match each value to its correct row and column.
- For tabular data, use the explicit row and column labels.
- Never assign a value to a different row or category.
- If the same table contains duplicated or conflicting extracted values, use the clearest explicit row-to-value mapping.

Context:
{context}

Question:
{input}

Answer:
""")

    document_chain = create_stuff_documents_chain(
        llm,
        prompt
    )

    return document_chain