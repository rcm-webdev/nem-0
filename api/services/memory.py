import os
from mem0 import Memory
from api.config import DATABASE_URL, MODEL_CHOICE

_config = {
    "llm": {"provider": "openai", "config": {"model": MODEL_CHOICE}},
    "vector_store": {
        "provider": "supabase",
        "config": {
            "connection_string": DATABASE_URL,
            "collection_name": "chat_memories",
        },
    },
}

memory = Memory.from_config(_config)


def search_memories(query: str, user_id: str, limit: int = 5):
    try:
        return memory.search(query=query, user_id=user_id, limit=limit)
    except Exception as e:
        raise RuntimeError(f"Memory search failed: {e}") from e


def add_to_memory(messages: list, user_id: str):
    try:
        memory.add(messages, user_id=user_id)
    except Exception as e:
        raise RuntimeError(f"Memory add failed: {e}") from e


def get_all_memories(user_id: str):
    try:
        return memory.get_all(user_id=user_id)
    except Exception as e:
        raise RuntimeError(f"Memory get_all failed: {e}") from e


def clear_all_memories(user_id: str):
    try:
        memory.delete_all(user_id=user_id)
    except Exception as e:
        raise RuntimeError(f"Memory delete_all failed: {e}") from e
