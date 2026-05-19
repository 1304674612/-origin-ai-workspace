from pathlib import Path

from docx import Document


class FileParser:
    async def parse(self, path: Path, content_type: str | None) -> tuple[str | None, dict]:
        suffix = path.suffix.lower()
        if suffix in {".txt", ".md", ".markdown"}:
            text = path.read_text(encoding="utf-8", errors="ignore")
            return text, {"parser": "plain-text", "characters": len(text)}
        if suffix == ".docx":
            document = Document(path)
            text = "\n".join(
                paragraph.text for paragraph in document.paragraphs if paragraph.text.strip()
            )
            return text, {"parser": "python-docx", "paragraphs": len(document.paragraphs)}
        if suffix == ".pdf":
            return None, {
                "parser": "pending-pdf",
                "note": "PDF text extraction adapter is ready to extend",
            }
        if content_type and content_type.startswith("image/"):
            return None, {"parser": "image", "note": "Image OCR adapter is ready to extend"}
        return None, {"parser": "unsupported"}
