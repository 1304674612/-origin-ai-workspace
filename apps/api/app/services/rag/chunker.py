class TextChunker:
    def __init__(self, chunk_size: int = 1200, overlap: int = 160) -> None:
        if overlap >= chunk_size:
            raise ValueError(f"overlap ({overlap}) must be less than chunk_size ({chunk_size})")
        self.chunk_size = chunk_size
        self.overlap = overlap

    def split(self, text: str) -> list[str]:
        clean = "\n".join(line.strip() for line in text.splitlines() if line.strip())
        if not clean:
            return []

        chunks: list[str] = []
        start = 0
        while start < len(clean):
            end = min(start + self.chunk_size, len(clean))
            chunks.append(clean[start:end])
            if end == len(clean):
                break
            start = max(start + 1, end - self.overlap)
        return chunks
