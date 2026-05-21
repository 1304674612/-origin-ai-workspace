from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass(frozen=True)
class VectorRecord:
    id: str
    text: str
    vector: list[float]
    metadata: dict


@dataclass(frozen=True)
class RetrievalResult:
    id: str
    text: str
    score: float
    metadata: dict


class VectorStore(ABC):
    name: str

    @abstractmethod
    async def upsert(self, index_name: str, records: list[VectorRecord]) -> None:
        raise NotImplementedError

    @abstractmethod
    async def search(
        self, index_name: str, query_vector: list[float], limit: int = 8
    ) -> list[RetrievalResult]:
        raise NotImplementedError
