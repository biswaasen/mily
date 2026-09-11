import { useEffect, useState } from 'react';
import { useAudioRecording } from '../../hooks/useAudioRecording';
import { WaveBars } from './waves';
import { useIpc } from '../../hooks/useIpc';

export const Dialog: React.FC = () => {
  const [context] = useState('');
  const [hoverHint, setHoverHint] = useState(false);
  const { status, errorMessage, barsRef, setContext: setRecordingContext } = useAudioRecording();
  const ipcRenderer = useIpc();

  const hasError = errorMessage.trim().length > 0;
  const showError = hasError && status === 'idle';
  const showHoverHint = hoverHint && status === 'idle' && !showError;

  useEffect(() => {
    setRecordingContext(context);
  }, [context, setRecordingContext]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingBottom: 10,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'auto' }}
        onMouseEnter={() => {
          setHoverHint(true);
          ipcRenderer.send('enable-mouse-events');
        }}
        onMouseLeave={() => {
          setHoverHint(false);
          ipcRenderer.send('disable-mouse-events');
        }}
        onClick={() => ipcRenderer.send('toggle-panel')}
        onContextMenu={(e) => {
          e.preventDefault();
          ipcRenderer.send('buddy-context-menu');
        }}
      >
        <div
          style={{
            borderRadius: 999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '5px 8px',
            background: hasError ? 'rgba(18, 18, 18, 0.82)' : 'rgba(18, 18, 18, 0.78)',
            border: `1px solid ${hasError ? 'rgba(255, 100, 100, 0.3)' : 'rgba(255, 255, 255, 0.12)'}`,
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            opacity: 0.85,
            cursor: 'pointer',
          }}
        >
          {showHoverHint ? (
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, textAlign: 'center', whiteSpace: 'nowrap', lineHeight: 1.4, fontFamily: 'system-ui, sans-serif' }}>
              Hold Fn to speak
            </div>
          ) : showError ? (
            <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, textAlign: 'center', whiteSpace: 'nowrap', lineHeight: 1.4, padding: '0 8px', fontFamily: 'system-ui, sans-serif' }}>
              {errorMessage}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 0 }}>
              <WaveBars status={status} barsRef={barsRef} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
