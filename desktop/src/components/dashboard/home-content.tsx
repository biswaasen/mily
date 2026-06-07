import React from 'react';
import { BookOpen, Trash2 } from 'lucide-react';
import { Memory } from '../../types';
import { useShortcut } from '../../hooks/useShortcut';

interface HomeContentProps {
  memoryText: string;
  onMemoryTextChange: (value: string) => void;
  memoryKey: string;
  onMemoryKeyChange: (value: string) => void;
  memories: Memory[];
  isAddingMemory: boolean;
  onAddMemory: () => void;
  onDeleteMemory: (id: string) => void;
}

export const HomeContent: React.FC<HomeContentProps> = ({
  memoryText,
  onMemoryTextChange,
  memories,
  isAddingMemory,
  onAddMemory,
  onDeleteMemory,
}) => {
  const { formatShortcut } = useShortcut();
  return (
    <div className="max-w-3xl mx-auto space-y-8 px-4 md:px-0">
      <div className="bg-gradient-to-br from-neutral-50 to-neutral-100/50 rounded-xl p-6 border border-neutral-200">
        <h1 className="text-2xl md:text-3xl font-garamond font-medium text-neutral-900 mb-4 tracking-tight">
          Welcome to Mily
        </h1>
        
        <div className="bg-gradient-to-br from-white to-neutral-50 rounded-xl px-6 py-5 border border-neutral-200 shadow-sm mb-5">
          <p className="text-sm font-garamond tracking-[0.12em] text-neutral-500 uppercase mb-2">
            Recording controls
          </p>
          <p className="text-base font-garamond text-neutral-800 leading-relaxed">
            Press{" "}
            <kbd className="inline-flex items-center px-3 py-1 text-sm font-semibold bg-neutral-900 text-white rounded-md shadow-sm mx-1">
              {formatShortcut()}
            </kbd>
            to start recording, and press{" "}
            <kbd className="inline-flex items-center px-3 py-1 text-sm font-semibold bg-neutral-900 text-white rounded-md shadow-sm mx-1">
              {formatShortcut()}
            </kbd>
            again to stop. Press{" "}
            <kbd className="inline-flex items-center px-2 py-0.5 text-[11px] font-semibold bg-neutral-100 text-neutral-800 rounded border border-neutral-300 mx-1">
              Esc
            </kbd>
            to cancel.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-3 bg-white/60 rounded-lg p-3 border border-neutral-200/60">
            <div className="p-1.5 bg-purple-50 rounded-md flex-shrink-0">
              <BookOpen className="h-4 w-4 text-purple-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-garamond font-semibold text-neutral-900 mb-0.5">Voice to text</p>
              <p className="text-xs font-garamond text-neutral-500">Speak anything — it gets transcribed and pasted into your active app.</p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-garamond font-medium text-neutral-900 mb-3">Memory</h2>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={memoryText}
            onChange={(e) => onMemoryTextChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onAddMemory();
              }
            }}
            placeholder="Add something for Mily to remember..."
            className="flex-1 px-3 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-300 focus:border-transparent text-sm font-garamond text-neutral-900 placeholder:text-neutral-400"
          />
          <button
            onClick={onAddMemory}
            disabled={!memoryText.trim() || isAddingMemory}
            className="px-4 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-garamond font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
          >
            Save
          </button>
        </div>

        {memories.length === 0 ? (
          <div className="flex items-center justify-center py-8 rounded-lg bg-neutral-50 border border-neutral-200">
            <p className="text-sm font-garamond text-neutral-500">No memories yet. Add one above to get started.</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {memories.map((memory) => (
              <div key={memory.id} className="group inline-flex items-start gap-1.5 bg-neutral-50 rounded-lg px-2.5 py-1.5 border border-neutral-200">
                <p className="text-sm font-garamond text-neutral-800 leading-snug">
                  {memory.content}
                </p>
                <button
                  onClick={() => onDeleteMemory(memory.id)}
                  className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-red-100 focus:outline-none"
                  title="Delete memory"
                >
                  <Trash2 className="h-3 w-3 text-red-500" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
