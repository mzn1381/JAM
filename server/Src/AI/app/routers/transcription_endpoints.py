from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse

from app.features.transcription import get_transcription_service
from app.features.transcription.transcription_errors import TranscriptionError


router = APIRouter(prefix="/api/v1", tags=["transcription"])


def _to_http_error(exc: TranscriptionError) -> HTTPException:
    code_map = {
        "EMPTY_AUDIO_FILE": 400,
        "AUDIO_DURATION_UNKNOWN": 400,
        "AUDIO_DURATION_TOO_LONG": 413,
    }
    status = code_map.get(getattr(exc, "code", "TRANSCRIPTION_ERROR"), 400)
    return HTTPException(status_code=status, detail=str(exc))


@router.post(
    "/transcriptions",
    response_class=StreamingResponse,
    responses={
        200: {
            "content": {"text/event-stream": {}},
            "description": "Streams transcription events as server-sent events.",
        },
        400: {"description": "Invalid audio file."},
        413: {"description": "Audio duration exceeds the configured maximum."},
    },
)
async def transcribe_audio(
    audio: UploadFile = File(...),
    language: str | None = Form(default="fa"),
    prompt: str | None = Form(default=None),
) -> StreamingResponse:
    service = get_transcription_service()

    try:
        audio_path = await service.save_and_validate_upload(audio)
    except TranscriptionError as exc:
        raise _to_http_error(exc) from exc

    return StreamingResponse(
        service.stream_transcription(audio_path, language=language, prompt=prompt),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
