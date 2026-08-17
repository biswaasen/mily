import React, { useEffect, useState } from 'react';
import { RecordingStatus } from '../../types';

interface BuddyIconProps {
  status: RecordingStatus;
  levelRef: React.MutableRefObject<number>;
  dragging?: boolean;
}

const FACES = {
  idle: '◔ᴗ◔',
  blink: '¬ᴗ¬',
  listen: '◔ᴗ◔',
  talkSoft: '◔ᴗ◔',
  talkMid: '◕ᴗ◕',
  talkLoud: '◕ᴗ◕',
  think: '◔ᴗ◔',
  thinkAlt: '◕ᴗ◕',
} as const;

export const BuddyIcon: React.FC<BuddyIconProps> = ({ status, levelRef, dragging }) => {
  const [face, setFace] = useState<string>(FACES.idle);
  const [glow, setGlow] = useState(0);

  useEffect(() => {
    if (status !== 'idle') return;
    setFace(FACES.idle);
    let t: ReturnType<typeof setTimeout>;
    const schedule = () => {
      t = setTimeout(() => {
        setFace(FACES.blink);
        setTimeout(() => { setFace(FACES.idle); schedule(); }, 90);
      }, 3200 + Math.random() * 2800);
    };
    schedule();
    return () => clearTimeout(t);
  }, [status]);

  useEffect(() => {
    if (status !== 'recording') return;
    let raf = 0;
    let frame = 0;
    const tick = () => {
      const level = levelRef.current;
      setGlow(level);
      frame += 1;
      const energy = Math.min(1, level * 1.5 + Math.max(0, Math.sin(frame / 5) * 0.1));
      if (energy < 0.12) setFace(FACES.listen);
      else if (energy < 0.4) setFace(FACES.talkSoft);
      else setFace(FACES.talkMid);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); setGlow(0); };
  }, [status, levelRef]);

  useEffect(() => {
    if (status !== 'processing') return;
    setFace(FACES.think);
    const id = setInterval(() => {
      setFace((p) => (p === FACES.think ? FACES.thinkAlt : FACES.think));
    }, 420);
    return () => clearInterval(id);
  }, [status]);

  const color = 'rgba(255, 255, 255, 0.92)';

  return (
    <>
      <style>{`
        .mickey-face {
          margin: 0; padding: 0; border: none; background: none;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 15px; line-height: 1; letter-spacing: 0.04em;
          cursor: grab; user-select: none;
          text-shadow: 0 1px 3px rgba(0,0,0,0.55);
          transition: opacity 160ms ease, transform 160ms ease;
        }
        .mickey-face.dragging { cursor: grabbing; transform: scale(1.08); animation: none !important; }
        .mickey-face.idle { animation: faceDrift 5s ease-in-out infinite; }
        .mickey-face.recording { animation: faceTalk 0.48s ease-in-out infinite; }
        .mickey-face.processing { animation: faceThink 1.6s ease-in-out infinite; }
        @keyframes faceDrift {
          0%, 100% { transform: translateY(0); opacity: 0.8; }
          50% { transform: translateY(-1.5px); opacity: 1; }
        }
        @keyframes faceTalk {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes faceThink {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.9; }
        }
      `}</style>
      <pre
        className={`mickey-face ${status} ${dragging ? 'dragging' : ''}`}
        style={{
          color,
          opacity: status === 'recording' ? 0.78 + glow * 0.18 : undefined,
        }}
      >
        {face}
      </pre>
    </>
  );
};
