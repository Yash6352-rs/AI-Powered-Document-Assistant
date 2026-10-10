from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma

DB_PATH = "chroma_db"

def get_embedding_model():
  return HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
  )

def create_vector_db(chunks):
    embedding_model = get_embedding_model()

    vectordb = Chroma(
        persist_directory=DB_PATH,
        embedding_function=embedding_model
    )

    vectordb.add_documents(chunks)

    return vectordb

def load_vector_db():
    embedding_model = get_embedding_model()

    return Chroma(
        persist_directory=DB_PATH,
        embedding_function=embedding_model
    )