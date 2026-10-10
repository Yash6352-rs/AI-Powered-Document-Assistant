import logging
from pathlib import Path
from io import BytesIO

import fitz
import pdfplumber
import pytesseract

from PIL import Image

from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_core.documents import Document

# Logging
logger = logging.getLogger(__name__)


def load_document(file_path):
    path = Path(file_path)

    if not path.is_file():
        raise FileNotFoundError(f"File not found: {path.name}")

    extension = path.suffix.lower()
    documents = []

    # Load PDF text, tables, and images
    if extension == ".pdf":
        documents = PyPDFLoader(str(path)).load()

        # Extract tables from each PDF page
        with pdfplumber.open(str(path)) as pdf:
            for page_number, page in enumerate(pdf.pages):
                tables = page.extract_tables()

                for table_number, table in enumerate(tables):
                    if not table:
                        continue

                    table_text = "\n".join(
                        " | ".join(str(cell or "") for cell in row)
                        for row in table
                    )

                    if table_text.strip():
                        documents.append(
                            Document(
                                page_content=(
                                    f"Table {table_number + 1} "
                                    f"from page {page_number + 1}:\n"
                                    f"{table_text}"
                                ),
                                metadata={
                                    "source": str(path),
                                    "page": page_number,
                                    "content_type": "table"
                                }
                            )
                        )

        # Extract text from embedded images using OCR
        with fitz.open(str(path)) as pdf_document:
            for page_number, page in enumerate(pdf_document):
                images = page.get_images(full=True)

                for image_number, image_info in enumerate(images):
                    try:
                        image_data = pdf_document.extract_image(image_info[0])
                        image = Image.open(
                            BytesIO(image_data["image"])
                        ).convert("RGB")

                        image_text = pytesseract.image_to_string(image).strip()

                        if image_text:
                            documents.append(
                                Document(
                                    page_content=(
                                        f"Text extracted from image "
                                        f"{image_number + 1} on page "
                                        f"{page_number + 1}:\n{image_text}"
                                    ),
                                    metadata={
                                        "source": str(path),
                                        "page": page_number,
                                        "content_type": "image_ocr"
                                    }
                                )
                            )

                    except Exception as e:
                        logger.warning(
                            "OCR failed for image %s on page %s: %s",
                            image_number + 1,
                            page_number + 1,
                            type(e).__name__
                        )

    # Load TXT files
    elif extension == ".txt":
        documents = TextLoader(
            str(path),
            encoding="utf-8",
            autodetect_encoding=True
        ).load()

    else:
        raise ValueError(f"Unsupported file type: {extension}")

    # Validate extracted content
    if not documents or not any(
        doc.page_content.strip() for doc in documents
    ):
        raise ValueError("The uploaded document contains no readable text.")

    # Add common metadata
    for doc in documents:
        doc.metadata["filename"] = path.name
        doc.metadata["file_type"] = extension.lstrip(".")

    return documents
