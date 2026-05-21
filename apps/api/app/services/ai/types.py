from collections.abc import AsyncIterator
from dataclasses import dataclass


@dataclass(frozen=True)
class AIMessage:
    role: str
    content: str


@dataclass(frozen=True)
class ChatCompletionRequest:
    provider: str
    model: str
    messages: list[AIMessage]
    temperature: float
    max_tokens: int


class AIProvider:
    name: str

    async def stream_chat(self, request: ChatCompletionRequest) -> AsyncIterator[str]:
        raise NotImplementedError

    async def list_models(self) -> list[str]:
        return []
