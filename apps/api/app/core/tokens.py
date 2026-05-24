from functools import lru_cache

import tiktoken


@lru_cache(maxsize=4)
def _get_encoding(model: str) -> tiktoken.Encoding:
    try:
        return tiktoken.encoding_for_model(model)
    except KeyError:
        return tiktoken.get_encoding("cl100k_base")


def count_tokens(text: str, model: str = "gpt-4o-mini") -> int:
    if not text:
        return 0
    return len(_get_encoding(model).encode(text))
