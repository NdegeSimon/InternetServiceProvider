"""Transaction models."""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional


@dataclass
class Transaction:
    id: str
    amount: float
    created_at: datetime = field(default_factory=datetime.utcnow)
    metadata: Optional[dict] = None
