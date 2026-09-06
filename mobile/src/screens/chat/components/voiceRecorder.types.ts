import type { RecordedAudio } from '../../../types/Chat';

export type VoiceRecorderErrorCode =
  | 'permission-denied'
  | 'not-supported'
  | 'recording-failed';

export class VoiceRecorderError extends Error {
  readonly code: VoiceRecorderErrorCode;

  constructor(code: VoiceRecorderErrorCode, message: string) {
    super(message);
    this.name = 'VoiceRecorderError';
    this.code = code;
  }
}

export interface VoiceRecorder {
  start(): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  stop(durationMs: number): Promise<RecordedAudio>;
  cancel(): Promise<void>;
  release(audio: RecordedAudio | null): void;
}
