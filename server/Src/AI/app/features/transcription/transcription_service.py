import json
import os
import tempfile
from collections.abc import AsyncIterator
from dataclasses import dataclass
from pathlib import Path

from fastapi import UploadFile
from mutagen import File as MutagenFile
from openai import AsyncOpenAI

from app.chat.logger import get_logger
from app.features.transcription.transcription_errors import (
    AudioDurationTooLongError,
    AudioDurationUnknownError,
    EmptyAudioFileError,
)


logger = get_logger("transcription")


@dataclass(frozen=True)
class UploadedAudioFile:
    path: str
    filename: str
    content_type: str


class TranscriptionService:
    def __init__(
        self,
        base_url: str,
        api_key: str,
        model: str,
        max_audio_duration_seconds: int,
    ):
        self.client = AsyncOpenAI(api_key=api_key, base_url=base_url)
        self.model = model
        self.max_audio_duration_seconds = max_audio_duration_seconds

    async def save_and_validate_upload(self, upload: UploadFile) -> UploadedAudioFile:
        filename = upload.filename or "audio.wav"
        content_type = upload.content_type or "application/octet-stream"
        suffix = Path(filename).suffix
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            temp_path = temp_file.name
            total_bytes = 0

            while chunk := await upload.read(1024 * 1024):
                total_bytes += len(chunk)
                temp_file.write(chunk)
        await upload.close()

        if total_bytes == 0:
            self._delete_file(temp_path)
            raise EmptyAudioFileError("Audio file is empty")

        #TODO: not working need to debug for various audio types
        # try:
        #     self._validate_duration(temp_path)
        # except Exception:
        #     self._delete_file(temp_path)
        #     raise

        logger.info(
            "Accepted transcription upload: filename=%s content_type=%s bytes=%s",
            filename,
            content_type,
            total_bytes,
        )

        return UploadedAudioFile(
            path=temp_path,
            filename=filename,
            content_type=content_type,
        )

    async def stream_transcription(
        self,
        audio_file: UploadedAudioFile,
        *,
        language: str | None = None,
        prompt: str | None = None,
    ) -> AsyncIterator[str]:
        yielded_provider_event = False

        # for debug
        # yield self._sse(
        #     "transcription.started",
        #     {
        #         "filename": audio_file.filename,
        #         "content_type": audio_file.content_type,
        #         "model": self.model,
        #     },
        # )

        try:
            with open(audio_file.path, "rb") as audio_stream:
                transcription_args = {
                    "file": (
                        audio_file.filename,
                        audio_stream,
                        audio_file.content_type,
                    ),
                    "model": self.model,
                    "stream": True,
                }
                if language:
                    transcription_args["language"] = language
                if prompt:
                    transcription_args["prompt"] = prompt

                logger.info(
                    "Opening transcription provider stream: filename=%s content_type=%s language=%s",
                    audio_file.filename,
                    audio_file.content_type,
                    language,
                )
                stream = await self.client.audio.transcriptions.create(**transcription_args)
                logger.info("Transcription provider stream opened")

                async for event in stream:
                    yielded_provider_event = True
                    event_type = getattr(event, "type", "")
                    logger.info("Transcription stream event received: %s", event_type)
                    if event_type == "transcript.text.delta":
                        delta = getattr(event, "delta", "")
                        if delta:
                            logger.info("Transcription delta chunk: %s", delta)
                            yield self._sse("transcription.delta", {"text": delta})
                    elif event_type == "transcript.text.done":
                        text = getattr(event, "text", "")
                        logger.info("Transcription completed: %s", text)
                        yield self._sse(
                            "transcription.done",
                            {"text": text},
                        )
                    elif event_type == "transcript.text.segment":
                        text = getattr(event, "text", "")
                        logger.info(
                            "Transcription segment chunk: id=%s start=%s end=%s text=%s",
                            getattr(event, "id", None),
                            getattr(event, "start", None),
                            getattr(event, "end", None),
                            text,
                        )
                        yield self._sse(
                            "transcription.segment",
                            {
                                "id": getattr(event, "id", None),
                                "start": getattr(event, "start", None),
                                "end": getattr(event, "end", None),
                                "text": text,
                                "speaker": getattr(event, "speaker", None),
                            },
                        )
                    else:
                        logger.info("Unknown transcription stream event: %s", event)
                        yield self._sse(
                            "transcription.event",
                            self._event_to_dict(event),
                        )

                if not yielded_provider_event:
                    logger.warning("Transcription provider stream closed without events")
                    async for fallback_chunk in self._stream_fallback_transcription(
                        audio_file,
                        language=language,
                        prompt=prompt,
                    ):
                        yield fallback_chunk
        except Exception as exc:
            logger.exception("Transcription stream failed")
            yield self._sse("transcription.error", {"message": str(exc)})
        finally:
            logger.info("Deleting temporary transcription file: %s", audio_file.path)
            self._delete_file(audio_file.path)

    def _validate_duration(self, audio_path: str) -> None:
        try:
            audio = MutagenFile(audio_path)
        except Exception as exc:
            raise AudioDurationUnknownError("Could not determine audio duration") from exc

        duration = getattr(getattr(audio, "info", None), "length", None)
        if duration is None:
            raise AudioDurationUnknownError("Could not determine audio duration")

        if duration > self.max_audio_duration_seconds:
            raise AudioDurationTooLongError(
                f"Audio duration must be {self.max_audio_duration_seconds} seconds or less"
            )

    @staticmethod
    def _sse(event: str, data: dict) -> str:
        return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"

    async def _stream_fallback_transcription(
        self,
        audio_file: UploadedAudioFile,
        *,
        language: str | None = None,
        prompt: str | None = None,
    ) -> AsyncIterator[str]:
        # for debug
        # yield self._sse(
        #     "transcription.fallback",
        #     {"message": "Provider streaming returned no events; using non-streaming transcription fallback"},
        # )

        with open(audio_file.path, "rb") as audio_stream:
            transcription_args = {
                "file": (
                    audio_file.filename,
                    audio_stream,
                    audio_file.content_type,
                ),
                "model": self.model,
            }
            if language:
                transcription_args["language"] = language
            if prompt:
                transcription_args["prompt"] = prompt

            logger.info("Opening fallback non-streaming transcription request")
            response = await self.client.audio.transcriptions.create(**transcription_args)

        text = self._extract_transcription_text(response)
        logger.info("Fallback transcription completed: %s", text)

        if not text:
            yield self._sse(
                "transcription.empty",
                {"message": "Transcription completed without text"},
            )
            return

        for chunk in self._chunk_text(text):
            logger.info("Fallback transcription chunk: %s", chunk)
            yield self._sse("transcription.delta", {"text": chunk})

        yield self._sse("transcription.done", {"text": text})

    @staticmethod
    def _extract_transcription_text(response) -> str:
        if isinstance(response, str):
            return response

        text = getattr(response, "text", None)
        if isinstance(text, str):
            return text

        if isinstance(response, dict):
            text = response.get("text")
            if isinstance(text, str):
                return text

        return ""

    @staticmethod
    def _chunk_text(text: str, chunk_size: int = 24) -> list[str]:
        return [text[index : index + chunk_size] for index in range(0, len(text), chunk_size)]

    @staticmethod
    def _event_to_dict(event) -> dict:
        if hasattr(event, "model_dump"):
            return event.model_dump(mode="json")

        return {
            key: value
            for key, value in vars(event).items()
            if not key.startswith("_")
        }

    @staticmethod
    def _delete_file(path: str) -> None:
        try:
            os.remove(path)
        except FileNotFoundError:
            pass
