import { useCallback, useEffect, useRef, useState } from 'react';
import { useAudioRecording } from '../../hooks/useAudioRecording';
import { BuddyIcon } from './duck';
import { useIpc } from '../../hooks/useIpc';

const DRAG_THRESHOLD = 4;

export const Dialog: React.FC = () => {
  const [context] = useState('');
  const [dragging, setDragging] = useState(false);
  const { status, levelRef, setContext: setRecordingContext } = useAudioRecording();
  const ipcRenderer = useIpc();

  const dragRef = useRef({
    active: false,
    moved: false,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
  });

  useEffect(() => {
    setRecordingContext(context);
  }, [context, setRecordingContext]);

  const onPointerDown = useCallback(async (e: React.PointerEvent) => {
    if (e.button === 2) {
      e.preventDefault();
      ipcRenderer.send('buddy-context-menu');
      return;
    }
    if (e.button !== 0) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = {
      active: true,
      moved: false,
      startX: e.screenX,
      startY: e.screenY,
      originX: 0,
      originY: 0,
    };
    try {
      const bounds = await ipcRenderer.invoke('get-buddy-bounds');
      if (!dragRef.current.active) return;
      dragRef.current.originX = bounds?.x ?? 0;
      dragRef.current.originY = bounds?.y ?? 0;
    } catch {}
  }, [ipcRenderer]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current.active) return;
    const dx = e.screenX - dragRef.current.startX;
    const dy = e.screenY - dragRef.current.startY;
    if (!dragRef.current.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    if (!dragRef.current.moved) {
      dragRef.current.moved = true;
      setDragging(true);
    }
    ipcRenderer.send('move-buddy', {
      x: Math.round(dragRef.current.originX + dx),
      y: Math.round(dragRef.current.originY + dy),
    });
  }, [ipcRenderer]);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
    const wasDrag = dragRef.current.moved;
    const wasActive = dragRef.current.active;
    dragRef.current.active = false;
    dragRef.current.moved = false;
    setDragging(false);
    if (wasActive && wasDrag) ipcRenderer.send('save-buddy-position');
    else if (wasActive && !wasDrag && e.button === 0) ipcRenderer.send('toggle-panel');
  }, [ipcRenderer]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onContextMenu={(e) => { e.preventDefault(); ipcRenderer.send('buddy-context-menu'); }}
    >
      <BuddyIcon status={status} levelRef={levelRef} dragging={dragging} />
    </div>
  );
};
