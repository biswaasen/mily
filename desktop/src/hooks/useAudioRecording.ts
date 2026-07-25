import { useState, useRef, useEffect, useCallback } from 'react';
import { RecordingStatus } from '../types';
import { useIpc } from './useIpc';

const playRecordingFeedback = () => {
  try {
    const url = new URL('public/audio.wav', window.location.href).href;
    const a = new Audio(url);
    a.volume = 0.4;
    a.play().catch(() => {});
  } catch (_) {}
};

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
  const levelRef = useRef<number>(0);
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
    levelRef.current = 0;
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

  const startRecording = async () => {
    if (statusRef.current !== 'idle') return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];
      setStatus('recording');
      statusRef.current = 'recording';
      playRecordingFeedback();
      const capturedContext = context.trim();

      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;

      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
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
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        if (isCancelledRef.current) {
          isCancelledRef.current = false;
          cleanup();
          setStatus('idle');
          statusRef.current = 'idle';
          audioChunksRef.current = [];
          return;
        }

        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

          if (audioBlob.size > 5000) {
            playRecordingFeedback();
            setStatus('processing');
            statusRef.current = 'processing';
            ipcRenderer.send('processing');

            try {
              const result = await sendAudioToGroq(audioBlob, capturedContext);
              ipcRenderer.send('http-result', {
                response: result.response,
                action: result.action,
                transcription: result.transcription,
              });
              setTimeout(() => { cleanup(); setContext(''); }, 100);
            } catch (error) {
              const msg = error instanceof Error ? error.message : 'Failed to process audio. Please try again.';
              setErrorMessage(msg);
              setStatus('idle');
              statusRef.current = 'idle';
              setTimeout(() => setErrorMessage(''), 5000);
            }
          } else {
            cleanup();
            setStatus('idle');
            statusRef.current = 'idle';
            setContext('');
          }
        } else {
          cleanup();
          setStatus('idle');
          statusRef.current = 'idle';
          setContext('');
        }

        audioChunksRef.current = [];
      };

      mediaRecorder.start(100);
    } catch (error) {
      setStatus('idle');
      statusRef.current = 'idle';
      setErrorMessage('Microphone access is required. Please enable it in system settings.');
      setTimeout(() => setErrorMessage(''), 1500);
      try { await ipcRenderer.invoke('reset-onboarding'); } catch {}
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && statusRef.current === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
  };

  const cancelRecording = useCallback(() => {
    isCancelledRef.current = true;

    if (statusRef.current === 'recording') {
      audioChunksRef.current = [];
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      cleanup();
      setStatus('idle');
      statusRef.current = 'idle';
      isCancelledRef.current = false;
      return;
    }

    if (statusRef.current === 'processing') {
      ipcRenderer.send('cancel-processing');
      cleanup();
      setStatus('idle');
      statusRef.current = 'idle';
      isCancelledRef.current = false;
      return;
    }

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
        await startRecording();
      } else if (statusRef.current === 'recording') {
        stopRecording();
      }
    };

    const handleStartRecording = async () => {
      if (statusRef.current === 'idle') await startRecording();
    };

    const handleStopRecording = () => {
      if (statusRef.current === 'recording') stopRecording();
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
      cleanup();
    };
  }, [ipcRenderer, cancelRecording]);

  useEffect(() => {
    if (status !== 'recording' || !analyserRef.current) {
      if (waveAnimationRef.current) {
        cancelAnimationFrame(waveAnimationRef.current);
        waveAnimationRef.current = null;
      }
      levelRef.current = 0;
      return;
    }

    const updateLevel = () => {
      if (statusRef.current !== 'recording' || !analyserRef.current) {
        if (waveAnimationRef.current) {
          cancelAnimationFrame(waveAnimationRef.current);
          waveAnimationRef.current = null;
        }
        levelRef.current = 0;
        return;
      }
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      let sum = 0;
      const start = 4;
      const end = Math.min(48, dataArray.length);
      for (let i = start; i < end; i++) sum += dataArray[i];
      levelRef.current = Math.min(1, (sum / (end - start) / 255) * 2.8);
      waveAnimationRef.current = requestAnimationFrame(updateLevel);
    };
    updateLevel();
    return () => {
      if (waveAnimationRef.current) {
        cancelAnimationFrame(waveAnimationRef.current);
        waveAnimationRef.current = null;
      }
      levelRef.current = 0;
    };
  }, [status]);

  return {
    status,
    errorMessage,
    levelRef,
    cancelRecording,
    setContext,
    startRecording,
  };
};
