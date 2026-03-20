import { useEffect, useState } from 'react';
import { useAudioRecording } from '../../hooks/useAudioRecording';
import { useAuth } from '../../hooks/useAuth';
import { WaveBars } from './waves';
import { useIpc } from '../../hooks/useIpc';
import { useShortcut } from '../../hooks/useShortcut';

export const Dialog: React.FC = () => {
  const { isAuthenticated, checkingAuth } = useAuth();
  const { formatShortcut } = useShortcut();
  const [context] = useState<string>('');
  const [hoverHint, setHoverHint] = useState(false);
  const { status, errorMessage, barsRef, setContext: setRecordingContext } = useAudioRecording();
  const ipcRenderer = useIpc();

  const hasError = errorMessage.trim().length > 0;
  const showError = hasError && status === 'idle';
  const showHoverHint = hoverHint && status === 'idle' && !showError;

  useEffect(() => {
    ipcRenderer.send('disable-mouse-events');
    return () => {
      ipcRenderer.send('disable-mouse-events');
    };
  }, [ipcRenderer]);

  useEffect(() => {
    setRecordingContext(context);
  }, [context, setRecordingContext]);

  if (!isAuthenticated && !checkingAuth) return null;

  return (
    <div 
      className="relative w-full h-full flex flex-col items-center justify-start" 
      style={{ pointerEvents: 'none', paddingTop: '10px' }}
    >
        <div 
          className="relative flex flex-col items-center"
          onMouseEnter={() => { setHoverHint(true); ipcRenderer.send('enable-mouse-events'); }}
          onMouseLeave={() => { setHoverHint(false); ipcRenderer.send('disable-mouse-events'); }}
          style={{ pointerEvents: 'auto' }}
        >
        <div 
          className="rounded-full flex flex-col items-center justify-center backdrop-blur-md"
          style={{
            padding: '5px 10px',
            background: hasError ? 'rgba(30, 30, 30, 0.7)' : 'rgba(30, 30, 30, 0.65)',
            borderWidth: '1px',
            borderColor: hasError ? 'rgba(255, 100, 100, 0.3)' : 'rgba(255, 255, 255, 0.15)',
            opacity: 0.85,
          }}
        >
          {showHoverHint ? (
            <div className="text-white/70 text-xs text-center whitespace-nowrap" style={{ lineHeight: '1.4' }}>
              Press {formatShortcut()} to start and stop recording
            </div>
          ) : showError ? (
            <div className="text-white/90 text-sm text-center whitespace-nowrap px-2" style={{ lineHeight: '1.4' }}>
              {errorMessage}
            </div>
          ) : (
            <div className="flex items-center justify-center" style={{ lineHeight: 0 }}>
              <WaveBars status={status} barsRef={barsRef} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
