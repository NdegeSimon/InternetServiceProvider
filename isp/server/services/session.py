"""Session-related service helpers."""

from typing import Optional


def create_session(user_id: str) -> dict:
    # TODO: wire up to a real store (database, cache, etc.)
    return {"id": "fake-session-id", "user_id": user_id}


def get_session(session_id: str) -> Optional[dict]:
    # TODO: implement real lookup
    return None
