import { useState, useRef, useEffect, useCallback } from 'react';
import { RecordingStatus } from '../types';
import { MIN_HEIGHT, MAX_HEIGHT } from '../utils/constants';
import { useIpc } from './useIpc';

const playRecordingFeedback = () => {
  try {
    const url = new URL('public/audio.wav', window.location.href).href;
    const a = new Audio(url);
    a.volume = 0.4;
    a.play().catch(() => {});
  } catch (_) {}
};

const CENTER_ORDER = [2, 3, 1, 4, 0];

export const useAudioRecording = () => {
  const [status, setStatus] = useState<RecordingStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [context, setContext] = useState<string>('');
  const ipcRenderer = useIpc();

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const statusRef = useRef<RecordingStatus>('idle');
  const isCancelledRef = useRef<boolean>(false);
  const startingRef = useRef(false);
  const operationRef = useRef(0);
  const barsRef = useRef<(HTMLDivElement | null)[]>([]);
  const waveAnimationRef = useRef<number | null>(null);

  const cleanup = () => {
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    audioContextRef.current = null;
    analyserRef.current = null;
    barsRef.current.forEach((bar) => {
      if (bar) bar.style.height = `${MIN_HEIGHT}px`;
    });
  };

  const sendAudioToGroq = async (audioBlob: Blob, capturedContext: string) => {
    const arrayBuffer = await audioBlob.arrayBuffer();
    const uint8 = Array.from(new Uint8Array(arrayBuffer));
    const result = await ipcRenderer.invoke('process-audio', {
      audioData: uint8,
      context: capturedContext,
    });
    return result;
  };

  const startRecording = async (targetApp = '') => {
    if (statusRef.current !== 'idle' || startingRef.current) return;
    const operation = ++operationRef.current;
    startingRef.current = true;
    isCancelledRef.current = false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Fn may have been released while the permission dialog was open.
      if (operation !== operationRef.current) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      startingRef.current = false;
      streamRef.current = stream;
      audioChunksRef.current = [];
      setStatus('recording');
      statusRef.current = 'recording';
      playRecordingFeedback();
      const capturedContext = targetApp || context.trim();
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5;
      analyser.minDecibels = -90;
      analyser.maxDecibels = -10;
      source.connect(analyser);
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      mediaRecorder.ondataavailable = (event) => {
        if (operation === operationRef.current && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      mediaRecorder.onstop = async () => {
        if (operation !== operationRef.current) return;
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        audioChunksRef.current = [];
        // Stop microphone capture before any network request, including failures.
        cleanup();
        if (audioBlob.size <= 5000) {
          setStatus('idle');
          statusRef.current = 'idle';
          setContext('');
          return;
        }
        playRecordingFeedback();
        setStatus('processing');
        statusRef.current = 'processing';
        ipcRenderer.send('processing');
        try {
          const result = await sendAudioToGroq(audioBlob, capturedContext);
          if (operation !== operationRef.current) return;
          ipcRenderer.send('http-result', {
            response: result.response,
            action: result.action,
            transcription: result.transcription,
          });
          setContext('');
        } catch (error) {
          if (operation !== operationRef.current) return;
          const msg = error instanceof Error ? error.message : 'Failed to process audio. Please try again.';
          setErrorMessage(msg);
          setStatus('idle');
          statusRef.current = 'idle';
          setTimeout(() => setErrorMessage(''), 5000);
        }
      };
      mediaRecorder.start(100);
    } catch (error) {
      if (operation !== operationRef.current) return;
      startingRef.current = false;
      cleanup();
      setStatus('idle');
      statusRef.current = 'idle';
      setErrorMessage('Microphone access is required. Please enable it in system settings.');
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  const stopRecording = () => {
    if (startingRef.current) {
      ++operationRef.current;
      startingRef.current = false;
    }
    if (mediaRecorderRef.current && statusRef.current === 'recording') {
      if (mediaRecorderRef.current.state !== 'inactive') mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
  };

  const cancelRecording = useCallback(() => {
    ++operationRef.current;
    startingRef.current = false;
    audioChunksRef.current = [];
    const recorder = mediaRecorderRef.current;
    mediaRecorderRef.current = null;
    if (recorder && recorder.state !== 'inactive') recorder.stop();
    ipcRenderer.send('cancel-processing');
    cleanup();
    setStatus('idle');
    statusRef.current = 'idle';
    isCancelledRef.current = false;
  }, [ipcRenderer]);

  useEffect(() => {
    const handleProcessing = () => {
      setStatus('processing');
      statusRef.current = 'processing';
    };

    const handleProcessingComplete = () => {
      if (isCancelledRef.current) {
        cleanup();
        isCancelledRef.current = false;
      }
      setStatus('idle');
      statusRef.current = 'idle';
    };

    const handleError = (_event: any, message: string) => {
      if (statusRef.current === 'processing') {
        setStatus('idle');
        statusRef.current = 'idle';
      }
      setErrorMessage(message);
      setTimeout(() => setErrorMessage(''), 1500);
    };

    const handleToggleRecording = async (_event: any, _targetApp: string) => {
      if (statusRef.current === 'idle') {
        await startRecording(_targetApp);
      } else if (statusRef.current === 'recording') {
        stopRecording();
      }
    };

    const handleStartRecording = async (_event: any, targetApp: string) => {
      if (statusRef.current === 'idle') await startRecording(targetApp);
    };

    const handleStopRecording = () => {
      stopRecording();
    };

    const handleCancelRecording = () => {
      cancelRecording();
    };

    ipcRenderer.on('processing', handleProcessing);
    ipcRenderer.on('processing-complete', handleProcessingComplete);
    ipcRenderer.on('error', handleError);
    ipcRenderer.on('toggle-recording', handleToggleRecording);
    ipcRenderer.on('start-recording', handleStartRecording);
    ipcRenderer.on('stop-recording', handleStopRecording);
    ipcRenderer.on('cancel-recording', handleCancelRecording);

    return () => {
      ipcRenderer.removeListener('processing', handleProcessing);
      ipcRenderer.removeListener('processing-complete', handleProcessingComplete);
      ipcRenderer.removeListener('error', handleError);
      ipcRenderer.removeListener('toggle-recording', handleToggleRecording);
      ipcRenderer.removeListener('start-recording', handleStartRecording);
      ipcRenderer.removeListener('stop-recording', handleStopRecording);
      ipcRenderer.removeListener('cancel-recording', handleCancelRecording);
      ++operationRef.current;
      startingRef.current = false;
      cleanup();
    };
  }, [ipcRenderer, cancelRecording]);

  useEffect(() => {
    const isRecording = status === 'recording' && analyserRef.current;

    if (!isRecording) {
      if (waveAnimationRef.current) {
        cancelAnimationFrame(waveAnimationRef.current);
        waveAnimationRef.current = null;
      }
      barsRef.current.forEach((bar) => {
        if (bar) bar.style.height = `${MIN_HEIGHT}px`;
      });
      return;
    }

    if (!barsRef.current.length) return;

    const updateBars = () => {
      if (statusRef.current !== 'recording' || !analyserRef.current) {
        if (waveAnimationRef.current) {
          cancelAnimationFrame(waveAnimationRef.current);
          waveAnimationRef.current = null;
        }
        barsRef.current.forEach((bar) => {
          if (bar) bar.style.height = `${MIN_HEIGHT}px`;
        });
        return;
      }

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);

      CENTER_ORDER.forEach((barIndex, i) => {
        const bar = barsRef.current[barIndex];
        if (!bar) return;

        const freqIndex = Math.floor(10 + (i * 8));
        const raw = dataArray[freqIndex] / 255;
        const value = Math.min(1, raw * 2.5);
        const centerIntensity = 1 - Math.abs(i - CENTER_ORDER.length / 2) / (CENTER_ORDER.length / 2);
        const height = MIN_HEIGHT + value * (MAX_HEIGHT - MIN_HEIGHT) * centerIntensity;

        bar.style.height = `${Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, height))}px`;
      });

      waveAnimationRef.current = requestAnimationFrame(updateBars);
    };

    updateBars();
    return () => {
      if (waveAnimationRef.current) {
        cancelAnimationFrame(waveAnimationRef.current);
        waveAnimationRef.current = null;
      }
      barsRef.current.forEach((bar) => {
        if (bar) bar.style.height = `${MIN_HEIGHT}px`;
      });
    };
  }, [status]);

  return {
    status,
    errorMessage,
    barsRef,
    cancelRecording,
    setContext,
    startRecording,
  };
};
