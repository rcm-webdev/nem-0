import uuid
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from api.utils.sanitize import sanitize_text


# Chat
class ChatRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    user_id: str
    message: str

    @field_validator("user_id")
    @classmethod
    def valid_uuid(cls, v: str) -> str:
        try:
            uuid.UUID(v)
        except ValueError:
            raise ValueError("user_id must be a valid UUID")
        return v

    @field_validator("message")
    @classmethod
    def clean_message(cls, v: str) -> str:
        return sanitize_text(v, field_name="message", max_len=2000)


class ChatResponse(BaseModel):
    response: str
    memories_used: int
    user_id: str


# Memories
class MemoriesResponse(BaseModel):
    memories: list
    count: int
    user_id: str


class DeleteMemoriesResponse(BaseModel):
    deleted: bool
    user_id: str


# Profile
class ProfileRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    user_id: str
    business_type: Literal["Retail", "Collectibles", "Ecommerce", "Service", "Other"]
    revenue_range: Literal["Under $10K/yr", "$10K–$50K/yr", "$50K–$200K/yr", "$200K+/yr"]
    primary_goals: str
    pain_points: str
    risk_tolerance: Literal["Conservative", "Moderate", "Aggressive"]

    @field_validator("user_id")
    @classmethod
    def valid_uuid(cls, v: str) -> str:
        try:
            uuid.UUID(v)
        except ValueError:
            raise ValueError("user_id must be a valid UUID")
        return v

    @field_validator("primary_goals")
    @classmethod
    def clean_primary_goals(cls, v: str) -> str:
        return sanitize_text(v, field_name="primary_goals", max_len=1000)

    @field_validator("pain_points")
    @classmethod
    def clean_pain_points(cls, v: str) -> str:
        return sanitize_text(v, field_name="pain_points", max_len=1000)


class ProfileResponse(BaseModel):
    saved: bool
    user_id: str


class OnboardingResponse(BaseModel):
    onboarding_complete: bool
    user_id: str


# Recommendations
class RecommendationsRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    user_id: str

    @field_validator("user_id")
    @classmethod
    def valid_uuid(cls, v: str) -> str:
        try:
            uuid.UUID(v)
        except ValueError:
            raise ValueError("user_id must be a valid UUID")
        return v


class RecommendationsResponse(BaseModel):
    recommendations: str
    actions: list[str]
    user_id: str


class TrackActionRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    user_id: str
    action_text: str
    status: Literal["implemented", "skipped"]

    @field_validator("user_id")
    @classmethod
    def valid_uuid(cls, v: str) -> str:
        try:
            uuid.UUID(v)
        except ValueError:
            raise ValueError("user_id must be a valid UUID")
        return v

    @field_validator("action_text")
    @classmethod
    def clean_action_text(cls, v: str) -> str:
        return sanitize_text(v, field_name="action_text", max_len=500)


class TrackActionResponse(BaseModel):
    tracked: bool
    user_id: str


# Check-in
class CheckinRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    user_id: str
    week_number: Annotated[int, Field(ge=1, le=52)]
    key_wins: str
    key_challenges: str
    summary: str
    sentiment: Literal["Positive", "Neutral", "Negative"]

    @field_validator("user_id")
    @classmethod
    def valid_uuid(cls, v: str) -> str:
        try:
            uuid.UUID(v)
        except ValueError:
            raise ValueError("user_id must be a valid UUID")
        return v

    @field_validator("key_wins")
    @classmethod
    def clean_key_wins(cls, v: str) -> str:
        return sanitize_text(v, field_name="key_wins", max_len=1000)

    @field_validator("key_challenges")
    @classmethod
    def clean_key_challenges(cls, v: str) -> str:
        return sanitize_text(v, field_name="key_challenges", max_len=1000)

    @field_validator("summary")
    @classmethod
    def clean_summary(cls, v: str) -> str:
        return sanitize_text(v, field_name="summary", max_len=2000)


class CheckinResponse(BaseModel):
    saved: bool
    user_id: str
