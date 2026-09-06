from fastapi import APIRouter


router = APIRouter(tags=["health"])


@router.get("/health/live", include_in_schema=False, openapi_extra={"security": []})
async def liveness_check() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/health/ready", include_in_schema=False, openapi_extra={"security": []})
async def readiness_check() -> dict[str, str]:
    return {"status": "ok"}
