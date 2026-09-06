import { BASE_URL } from '../../../utils/constants';
import { getAuthTokens } from '../../../utils/handlers';
import type { RecordedAudio } from '../../../types/Chat';

const TRANSCRIPTIONS_ENDPOINT = `${BASE_URL}/api/v1/transcriptions`;

type TranscriptionEvent = {
  event: string;
  data: string;
};

const parseEvent = (block: string): TranscriptionEvent | null => {
  let event = 'message';
  const data: string[] = [];

  for (const line of block.split(/\r?\n/)) {
    if (line.startsWith('event:')) event = line.slice(6).trim();
    if (line.startsWith('data:')) data.push(line.slice(5).trimStart());
  }

  return data.length > 0 ? { event, data: data.join('\n') } : null;
};

export const parseTranscriptionSse = (buffer: string) => {
  const blocks = buffer.split(/\r?\n\r?\n/);
  return {
    events: blocks
      .slice(0, -1)
      .map(parseEvent)
      .filter((event): event is TranscriptionEvent => event !== null),
    remainder: blocks[blocks.length - 1] ?? '',
  };
};

const audioFormValue = (audio: RecordedAudio) => {
  if (audio.kind === 'blob') return audio.blob;

  return {
    uri: audio.uri,
    name: 'recording.m4a',
    type: audio.mimeType,
  };
};

export const transcribeAudio = async (
  audio: RecordedAudio,
  onText: (text: string, isFinal: boolean) => void,
  prompt?: string,
  signal?: AbortSignal,
): Promise<string> => {
  const formData = new FormData();
  formData.append(
    'audio',
    audioFormValue(audio) as unknown as Blob,
    'recording.webm',
  );
  formData.append('language', 'fa');
  if (prompt) formData.append('prompt', prompt);

  const tokens = await getAuthTokens();
  return new Promise<string>((resolve, reject) => {
    const request = new XMLHttpRequest();
    let processedLength = 0;
    let buffer = '';
    let latestText = '';
    let receivedEvent = false;

    const consume = (event: TranscriptionEvent) => {
      if (
        event.event !== 'transcription.delta' &&
        event.event !== 'transcription.done'
      )
        return;
      let payload: { text?: unknown };
      try {
        payload = JSON.parse(event.data) as { text?: unknown };
      } catch {
        return;
      }
      if (typeof payload.text !== 'string') return;
      receivedEvent = true;
      latestText =
        event.event === 'transcription.done'
          ? payload.text
          : latestText + payload.text;
      onText(latestText, event.event === 'transcription.done');
    };

    const consumeResponse = () => {
      const chunk = request.responseText.slice(processedLength);
      processedLength = request.responseText.length;
      const parsed = parseTranscriptionSse(buffer + chunk);
      buffer = parsed.remainder;
      parsed.events.forEach(consume);
    };

    const abort = () => request.abort();
    signal?.addEventListener('abort', abort, { once: true });
    request.open('POST', TRANSCRIPTIONS_ENDPOINT);
    request.setRequestHeader('Accept', 'text/event-stream');
    if (tokens?.accessToken) {
      request.setRequestHeader('Authorization', `Bearer ${tokens.accessToken}`);
    }
    request.onprogress = consumeResponse;
    request.onerror = () => reject(new Error('Transcription request failed.'));
    request.onabort = () => reject(new Error('Transcription request aborted.'));
    request.onload = () => {
      signal?.removeEventListener('abort', abort);
      if (request.status < 200 || request.status >= 300) {
        reject(new Error(`Transcription request failed (${request.status}).`));
        return;
      }
      consumeResponse();
      const finalEvent = parseEvent(buffer);
      if (finalEvent) consume(finalEvent);
      if (!receivedEvent) {
        reject(new Error('No transcription was returned.'));
        return;
      }
      resolve(latestText);
    };
    request.send(formData);
  });
};
