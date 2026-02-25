from fastapi import APIRouter, HTTPException
from api.models.schemas import ProfileRequest, ProfileResponse, OnboardingResponse
from api.services.memory import search_memories, add_to_memory

router = APIRouter()


@router.post("/profile", response_model=ProfileResponse)
async def save_profile(body: ProfileRequest):
    try:
        profile_text = (
            f"Seller business profile update:\n"
            f"- Business Type: {body.business_type}\n"
            f"- Revenue Range: {body.revenue_range}\n"
            f"- Primary Goals: {body.primary_goals}\n"
            f"- Pain Points: {body.pain_points}\n"
            f"- Risk Tolerance: {body.risk_tolerance}"
        )
        add_to_memory(
            [
                {"role": "system", "content": "Seller profile update"},
                {"role": "user", "content": profile_text},
            ],
            user_id=body.user_id,
        )
        return ProfileResponse(saved=True, user_id=body.user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/profile/onboarding/{user_id}", response_model=OnboardingResponse)
async def check_onboarding(user_id: str):
    try:
        results = search_memories(
            query="seller business profile", user_id=user_id, limit=1
        )
        onboarding_complete = bool(results and results.get("results"))
        return OnboardingResponse(onboarding_complete=onboarding_complete, user_id=user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
