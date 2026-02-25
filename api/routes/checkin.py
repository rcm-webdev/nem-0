from fastapi import APIRouter, HTTPException
from api.models.schemas import CheckinRequest, CheckinResponse
from api.services.memory import add_to_memory

router = APIRouter()


@router.post("/checkin", response_model=CheckinResponse)
async def save_checkin(body: CheckinRequest):
    try:
        checkin_text = (
            f"Weekly check-in (Week {body.week_number}):\n"
            f"- Key Wins: {body.key_wins}\n"
            f"- Key Challenges: {body.key_challenges}\n"
            f"- Overall Summary: {body.summary}\n"
            f"- Sentiment: {body.sentiment}"
        )
        add_to_memory(
            [
                {"role": "system", "content": "Weekly check-in"},
                {"role": "user", "content": checkin_text},
            ],
            user_id=body.user_id,
        )
        return CheckinResponse(saved=True, user_id=body.user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
