import re

INJECTION_PATTERNS = [
    r"ignore\s+(all\s+)?previous\s+instructions?",
    r"disregard\s+(all\s+)?(previous\s+)?instructions?",
    r"forget\s+(your\s+)?instructions?",
    r"you\s+are\s+now\s+",
    r"\bsystem\s*:",
    r"\bassistant\s*:",
    r"<\|im_start\|>",
    r"<\|endoftext\|>",
]
_COMPILED = [re.compile(p, re.IGNORECASE) for p in INJECTION_PATTERNS]

CONTROL_CHARS = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")


def sanitize_text(value: str, *, field_name: str = "field", max_len: int = 2000) -> str:
    value = value.strip()
    if not value:
        raise ValueError(f"{field_name} must not be empty")
    if len(value) > max_len:
        raise ValueError(f"{field_name} exceeds maximum length of {max_len} characters")
    value = CONTROL_CHARS.sub("", value)
    for pattern in _COMPILED:
        if pattern.search(value):
            raise ValueError(f"{field_name} contains disallowed content")
    return value
