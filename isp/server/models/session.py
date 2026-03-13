"""Session models.

Add your database models / persistence logic here.
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional


@dataclass
class Session:
    id: str
    user_id: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.utcnow)
    is_active: bool = True
