from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from housing_platform.db.session import check_database_connection, get_db

router = APIRouter(tags=["health"])


@router.get("/health")
def health_check(db: Session = Depends(get_db)) -> dict[str, str | bool]:
    del db  # session reserved for future dependency checks
    db_ok = check_database_connection()
    return {
        "status": "ok" if db_ok else "degraded",
        "database": db_ok,
    }
