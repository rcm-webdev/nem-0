from fastapi import APIRouter, HTTPException
from api.models.schemas import MemoriesResponse, DeleteMemoriesResponse
from api.services.memory import get_all_memories, clear_all_memories

router = APIRouter()


@router.get("/memories/{user_id}", response_model=MemoriesResponse)
async def get_memories(user_id: str):
    try:
        result = get_all_memories(user_id=user_id)
        memories = result.get("results", []) if result else []
        return MemoriesResponse(memories=memories, count=len(memories), user_id=user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/memories/{user_id}", response_model=DeleteMemoriesResponse)
async def delete_memories(user_id: str):
    try:
        clear_all_memories(user_id=user_id)
        return DeleteMemoriesResponse(deleted=True, user_id=user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
