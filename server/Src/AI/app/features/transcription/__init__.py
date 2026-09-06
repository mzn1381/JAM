import os

from app.features.transcription.transcription_service import TranscriptionService


_transcription_service: TranscriptionService | None = None


def _read_max_audio_duration_seconds() -> int:
    raw_value = os.getenv("MAX_AUDIO_DURATION_SECONDS", "15").strip()
    try:
        max_duration = int(raw_value)
    except ValueError as exc:
        raise RuntimeError("MAX_AUDIO_DURATION_SECONDS must be an integer") from exc

    if max_duration <= 0:
        raise RuntimeError("MAX_AUDIO_DURATION_SECONDS must be greater than 0")

    return max_duration


def get_transcription_service() -> TranscriptionService:
    global _transcription_service
    if _transcription_service is not None:
        return _transcription_service

    base_url = os.getenv("TRANSCRIPTION_BASE_URL")
    if not base_url:
        raise RuntimeError("TRANSCRIPTION_BASE_URL is not set")

    api_key = os.getenv("TRANSCRIPTION_API_KEY")
    if not api_key:
        raise RuntimeError("TRANSCRIPTION_API_KEY is not set")

    model = os.getenv("TRANSCRIPTION_MODEL", "gpt-4o-mini-transcribe").strip()
    if not model:
        raise RuntimeError("TRANSCRIPTION_MODEL is not set")

    _transcription_service = TranscriptionService(
        base_url=base_url,
        api_key=api_key,
        model=model,
        max_audio_duration_seconds=_read_max_audio_duration_seconds(),
    )
    return _transcription_service
