import re
from fastapi import APIRouter, HTTPException
from api.models.schemas import (
    RecommendationsRequest,
    RecommendationsResponse,
    TrackActionRequest,
    TrackActionResponse,
)
from api.services.memory import search_memories, add_to_memory
from api.services.llm import generate_recommendations

router = APIRouter()


def parse_actions(rec_text: str) -> list[str]:
    """Extract the 3 numbered action lines from the recommendations markdown."""
    actions = []
    for line in rec_text.splitlines():
        match = re.match(r"^\s*\d+\.\s+(.+)", line)
        if match:
            actions.append(match.group(1).strip())
        if len(actions) == 3:
            break
    return actions


@router.post("/recommendations", response_model=RecommendationsResponse)
async def get_recommendations(body: RecommendationsRequest):
    try:
        relevant_memories = search_memories(
            query="goals challenges inventory cashflow revenue",
            user_id=body.user_id,
            limit=8,
        )

        formatted_memories = ""
        if relevant_memories and len(relevant_memories.get("results", [])) > 0:
            for entry in relevant_memories["results"]:
                formatted_memories += f"- {entry['memory']}\n"

        rec_text = generate_recommendations(memories_context=formatted_memories)
        actions = parse_actions(rec_text)

        return RecommendationsResponse(
            recommendations=rec_text,
            actions=actions,
            user_id=body.user_id,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/recommendations/track", response_model=TrackActionResponse)
async def track_action(body: TrackActionRequest):
    try:
        feedback = f"Recommendation '{body.action_text}' was marked as: {body.status}"
        add_to_memory(
            [
                {"role": "system", "content": "Action tracking feedback"},
                {"role": "user", "content": feedback},
            ],
            user_id=body.user_id,
        )
        return TrackActionResponse(tracked=True, user_id=body.user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
