from fastapi import APIRouter, HTTPException
from api.models.schemas import ChatRequest, ChatResponse
from api.services.memory import search_memories, add_to_memory
from api.services.llm import chat_completion

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat(body: ChatRequest):
    try:
        relevant_memories = search_memories(query=body.message, user_id=body.user_id, limit=5)

        formatted_memories = ""
        memories_used = 0
        if relevant_memories and len(relevant_memories.get("results", [])) > 0:
            for entry in relevant_memories["results"]:
                formatted_memories += f"- {entry['memory']}\n"
            memories_used = len(relevant_memories["results"])

        assistant_response, messages = chat_completion(
            message=body.message,
            memories_context=formatted_memories,
        )

        add_to_memory(messages, user_id=body.user_id)

        return ChatResponse(
            response=assistant_response,
            memories_used=memories_used,
            user_id=body.user_id,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
