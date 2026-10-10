from langchain_text_splitters import RecursiveCharacterTextSplitter

def create_chunks(documents):
  splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=150
    )

  chunks = splitter.split_documents(documents)

  for i,chunk in enumerate(chunks):
    chunk.metadata["chunk_id"] = i

  return chunks
