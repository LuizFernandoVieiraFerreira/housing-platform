from datetime import UTC, datetime

from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from housing_platform.auth.errors import RateLimitedError
from housing_platform.db.models import ApiRateLimits


class RateLimitService:
    def __init__(self, db: Session) -> None:
        self._db = db

    def assert_rate_limit(self, bucket: str, max_requests: int, window_seconds: int) -> None:
        trimmed = bucket.strip()
        if not trimmed or max_requests <= 0 or window_seconds <= 0:
            raise RateLimitedError("Rate limit exceeded")

        now = datetime.now(UTC)
        window_start_epoch = (now.timestamp() // window_seconds) * window_seconds
        window_start = datetime.fromtimestamp(window_start_epoch, UTC)

        stmt = (
            insert(ApiRateLimits)
            .values(bucket=trimmed, window_start=window_start, request_count=1)
            .on_conflict_do_update(
                index_elements=[ApiRateLimits.bucket, ApiRateLimits.window_start],
                set_={"request_count": ApiRateLimits.request_count + 1},
            )
            .returning(ApiRateLimits.request_count)
        )
        count = self._db.execute(stmt).scalar_one()
        if count > max_requests:
            raise RateLimitedError("Rate limit exceeded")
