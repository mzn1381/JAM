import { Platform } from 'react-native';
import Sound, {
  AudioEncoderAndroidType,
  AudioSourceAndroidType,
  AVEncoderAudioQualityIOSType,
  OutputFormatAndroidType,
  type AudioSet,
} from 'react-native-nitro-sound';
import { PERMISSIONS, request, RESULTS } from 'react-native-permissions';
import type { RecordedAudio } from '../../../types/Chat';
import { VoiceRecorderError, type VoiceRecorder } from './voiceRecorder.types';

const AUDIO_SETTINGS: AudioSet = {
  AudioSourceAndroid: AudioSourceAndroidType.MIC,
  OutputFormatAndroid: OutputFormatAndroidType.MPEG_4,
  AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
  AVEncodingOptionIOS: 'aac',
  AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
  AudioChannels: 1,
  AudioSamplingRate: 44100,
  AudioEncodingBitRate: 128000,
};

let isActive = false;

const requestMicrophonePermission = async () => {
  const permission =
    Platform.OS === 'ios'
      ? PERMISSIONS.IOS.MICROPHONE
      : PERMISSIONS.ANDROID.RECORD_AUDIO;
  const result = await request(permission);

  if (result !== RESULTS.GRANTED && result !== RESULTS.LIMITED) {
    throw new VoiceRecorderError(
      'permission-denied',
      'Microphone permission was not granted.',
    );
  }
};

export const voiceRecorder: VoiceRecorder = {
  async start() {
    try {
      await requestMicrophonePermission();
      await Sound.startRecorder(undefined, AUDIO_SETTINGS, false);
      isActive = true;
    } catch (error) {
      isActive = false;
      if (error instanceof VoiceRecorderError) throw error;
      throw new VoiceRecorderError(
        'recording-failed',
        error instanceof Error ? error.message : 'Unable to start recording.',
      );
    }
  },

  async pause() {
    if (!isActive) return;
    await Sound.pauseRecorder();
  },

  async resume() {
    if (!isActive) return;
    await Sound.resumeRecorder();
  },

  async stop(durationMs) {
    if (!isActive) {
      throw new VoiceRecorderError(
        'recording-failed',
        'There is no active recording to stop.',
      );
    }

    try {
      const uri = await Sound.stopRecorder();
      isActive = false;
      return {
        kind: 'file',
        uri,
        mimeType: 'audio/mp4',
        durationMs,
        platform: Platform.OS as 'android' | 'ios',
      } satisfies RecordedAudio;
    } catch (error) {
      isActive = false;
      throw new VoiceRecorderError(
        'recording-failed',
        error instanceof Error ? error.message : 'Unable to stop recording.',
      );
    }
  },

  async cancel() {
    if (!isActive) return;
    try {
      await Sound.stopRecorder();
    } finally {
      isActive = false;
    }
  },

  release() {},
};
