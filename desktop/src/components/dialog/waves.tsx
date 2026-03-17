import React from 'react';
import { RecordingStatus } from '../../types';
import { WAVE_LINES } from '../../utils/constants';

interface WaveBarsProps {
  status: RecordingStatus;
  barsRef: React.MutableRefObject<(HTMLDivElement | null)[]>;
}

export const WaveBars: React.FC<WaveBarsProps> = ({ status, barsRef }) => {
  return (
    <>
      <style>{`
        .wave-bar.processing {
          animation: processingPulse 1.5s ease-in-out infinite;
        }
        @keyframes processingPulse {
          0%, 100% {
            opacity: 0.6;
            transform: scaleY(1);
          }
          50% {
            opacity: 1;
            transform: scaleY(1.5);
          }
        }
      `}</style>
      <div className="flex items-center justify-center gap-[3px]" style={{ lineHeight: 0 }}>
        {Array.from({ length: WAVE_LINES }).map((_, i) => (
          <div
            key={i}
            ref={(el) => { barsRef.current[i] = el; }}
            className={`wave-bar rounded-full bg-white ${status === 'processing' ? 'processing' : ''}`}
            style={{
              width: '2px',
              height: status === 'recording' ? '10px' : status === 'processing' ? '4px' : '2px',
              opacity: 0.8,
              animationDelay: status === 'processing' ? `${i * 120}ms` : undefined,
              transformOrigin: 'center',
              transition: status === 'recording' 
                ? 'height 0.05s linear, opacity 0.05s linear' 
                : 'height 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1), width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        ))}
      </div>
    </>
  );
};

