import type { RecordedAudio } from '../../../types/Chat';
import { VoiceRecorderError, type VoiceRecorder } from './voiceRecorder.types';

let mediaRecorder: MediaRecorder | null = null;
let mediaStream: MediaStream | null = null;
let chunks: Blob[] = [];

const stopTracks = () => {
  mediaStream?.getTracks().forEach(track => track.stop());
  mediaStream = null;
};

const getSupportedMimeType = () => {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp3'];
  return candidates.find(type => MediaRecorder.isTypeSupported(type)) ?? '';
};

export const voiceRecorder: VoiceRecorder = {
  async start() {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      throw new VoiceRecorderError(
        'not-supported',
        'Audio recording is not supported by this browser.',
      );
    }

    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      const mimeType = getSupportedMimeType();
      mediaRecorder = new MediaRecorder(
        mediaStream,
        mimeType ? { mimeType, audioBitsPerSecond: 128000 } : undefined,
      );
      chunks = [];
      mediaRecorder.addEventListener('dataavailable', event => {
        if (event.data.size > 0) chunks.push(event.data);
      });
      mediaRecorder.start(100);
    } catch (error) {
      stopTracks();
      mediaRecorder = null;
      const isPermissionError =
        error instanceof DOMException &&
        (error.name === 'NotAllowedError' || error.name === 'SecurityError');
      throw new VoiceRecorderError(
        isPermissionError ? 'permission-denied' : 'recording-failed',
        error instanceof Error ? error.message : 'Unable to start recording.',
      );
    }
  },

  async pause() {
    if (mediaRecorder?.state === 'recording') mediaRecorder.pause();
  },

  async resume() {
    if (mediaRecorder?.state === 'paused') mediaRecorder.resume();
  },

  async stop(durationMs) {
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
      throw new VoiceRecorderError(
        'recording-failed',
        'There is no active recording to stop.',
      );
    }

    const recorder = mediaRecorder;
    return new Promise<RecordedAudio>((resolve, reject) => {
      recorder.addEventListener(
        'stop',
        () => {
          const mimeType = recorder.mimeType || 'audio/webm';
          const blob = new Blob(chunks, { type: mimeType });
          const uri = URL.createObjectURL(blob);
          mediaRecorder = null;
          chunks = [];
          stopTracks();
          resolve({
            kind: 'blob',
            uri,
            mimeType,
            durationMs,
            platform: 'web',
            blob,
          });
        },
        { once: true },
      );
      recorder.addEventListener(
        'error',
        () => {
          mediaRecorder = null;
          chunks = [];
          stopTracks();
          reject(
            new VoiceRecorderError(
              'recording-failed',
              'Unable to finalize recording.',
            ),
          );
        },
        { once: true },
      );
      recorder.stop();
    });
  },

  async cancel() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.addEventListener('dataavailable', () => {}, { once: true });
      mediaRecorder.stop();
    }
    mediaRecorder = null;
    chunks = [];
    stopTracks();
  },

  release(audio) {
    if (audio?.kind === 'blob') URL.revokeObjectURL(audio.uri);
  },
};
