class TranscriptionError(Exception):
    code = "TRANSCRIPTION_ERROR"


class AudioDurationTooLongError(TranscriptionError):
    code = "AUDIO_DURATION_TOO_LONG"


class AudioDurationUnknownError(TranscriptionError):
    code = "AUDIO_DURATION_UNKNOWN"


class EmptyAudioFileError(TranscriptionError):
    code = "EMPTY_AUDIO_FILE"
