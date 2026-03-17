import React from 'react';
import { Message } from '../../types';
import { formatTime } from '../../utils/date';
import { MessageSquare, Copy, Check } from 'lucide-react';

interface GroupedMessages {
  date: string;
  label: string;
  messages: Message[];
}

interface MessageListProps {
  groupedMessages: GroupedMessages[];
  messagesLength: number;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  copiedId: string | null;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  loadMoreRef: React.RefObject<HTMLDivElement | null>;
  onCopy: (message: Message) => void;
}

export const MessageList: React.FC<MessageListProps> = ({
  groupedMessages,
  messagesLength,
  loading,
  loadingMore,
  error,
  copiedId,
  scrollContainerRef,
  loadMoreRef,
  onCopy,
}) => (
  <div className="max-w-3xl mx-auto">
    <h1 className="text-2xl font-garamond font-medium text-neutral-900 mb-6">Messages</h1>

    {loading && messagesLength === 0 ? (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm font-garamond text-neutral-500">Loading messages...</p>
      </div>
    ) : error && messagesLength === 0 ? (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm font-garamond text-red-600">{error}</p>
      </div>
    ) : (
      <div ref={scrollContainerRef} className="space-y-6">
        {groupedMessages.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-sm font-garamond text-neutral-500">No messages yet</p>
          </div>
        ) : (
          groupedMessages.map((group) => (
            <div key={group.label} className="space-y-2">
              <h3 className="text-xs font-garamond text-neutral-500 font-medium">{group.label}</h3>
              <div className="space-y-2">
                {group.messages.map((message) => (
                  <div
                    key={message.id}
                    className="group relative p-3 rounded-lg bg-white border border-neutral-200 hover:border-neutral-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <MessageSquare className="h-4 w-4 text-neutral-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-garamond text-neutral-800 break-words leading-relaxed mb-1">
                          {message.response || message.query}
                        </p>
                        <p className="text-xs font-garamond text-neutral-400">{formatTime(message.createdAt)}</p>
                      </div>
                      <button
                        onClick={() => onCopy(message)}
                        className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded hover:bg-neutral-100 focus:outline-none"
                        title="Copy to clipboard"
                      >
                        {copiedId === message.id ? (
                          <Check className="h-3.5 w-3.5 text-green-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5 text-neutral-500" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}

        {loadingMore && (
          <div className="flex items-center justify-center py-4">
            <p className="text-xs font-garamond text-neutral-500">Loading more...</p>
          </div>
        )}

        <div ref={loadMoreRef} className="h-1" />
      </div>
    )}
  </div>
);
