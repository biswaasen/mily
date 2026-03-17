import { useState, useEffect, useRef, useCallback } from 'react';
import { UserProfile, Subscription, Message, Memory } from '../../types';
import { useIpc } from '../../hooks/useIpc';
import { Sidebar } from './sidebar';
import { HomeContent } from './home-content';
import { MessageList } from './message-list';
import { SettingsContent } from './settings-content';
import { formatDate } from '../../utils/date';
import { MessagesApi } from '../../services/api/messages.api';
import { MemoryApi } from '../../services/api/memory.api';

interface GroupedMessages {
  date: string;
  label: string;
  messages: Message[];
}

type Tab = 'home' | 'messages' | 'settings';

function groupMessagesByDate(msgs: Message[]): GroupedMessages[] {
  const groups: Record<string, { label: string; date: Date; messages: Message[] }> = {};
  msgs.forEach((msg) => {
    const { label, date } = formatDate(msg.createdAt);
    if (!groups[label]) groups[label] = { label, date, messages: [] };
    groups[label].messages.push(msg);
  });
  return Object.values(groups)
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .map((g) => ({ date: g.date.toISOString(), label: g.label, messages: g.messages }));
}

interface DashboardProps {
  isAuthenticated: boolean;
  user: UserProfile | null;
  subscription: Subscription | null;
  onLogout: () => void;
  backendUrl: string;
  onUserUpdate: (updatedUser: UserProfile) => void;
  backendUnavailable?: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({
  isAuthenticated,
  user,
  subscription,
  onLogout,
  backendUrl,
  onUserUpdate,
  backendUnavailable,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [messages, setMessages] = useState<Message[]>([]);
  const [groupedMessages, setGroupedMessages] = useState<GroupedMessages[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [memoryText, setMemoryText] = useState('');
  const [memoryKey, setMemoryKey] = useState('');
  const [isAddingMemory, setIsAddingMemory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const ipcRenderer = useIpc();
  const prevBackendUnavailable = useRef(backendUnavailable);

  useEffect(() => {
    const handleError = (_: unknown, message: string) => {
      setErrorMessage(message);
      setTimeout(() => setErrorMessage(''), 2000);
    };
    const handleSuccess = (_: unknown, message: string) => {
      setSuccessMessage(message);
      setTimeout(() => setSuccessMessage(''), 3000);
    };
    ipcRenderer.on('error', handleError);
    ipcRenderer.on('auth-success-message', handleSuccess);
    return () => {
      ipcRenderer.removeListener('error', handleError);
      ipcRenderer.removeListener('auth-success-message', handleSuccess);
    };
  }, [ipcRenderer]);

  const getToken = useCallback(() => ipcRenderer.invoke('get-auth-token'), [ipcRenderer]);

  const fetchMessages = useCallback(
    async (pageNum: number, append: boolean) => {
      if (!backendUrl) return;
      try {
        if (pageNum === 1) setLoading(true);
        else setLoadingMore(true);
        setError(null);
        const api = new MessagesApi(backendUrl, getToken);
        const data = await api.getMessages(pageNum, 20);
        if (append) setMessages((prev) => [...prev, ...data.messages]);
        else setMessages(data.messages);
        setHasMore(data.pagination.page < data.pagination.totalPages);
        setPage(pageNum);
      } catch (err: unknown) {
        const e = err as { status?: number };
        setError(e?.status === 401 ? 'Authentication required' : 'Failed to load messages');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [backendUrl, getToken]
  );

  useEffect(() => {
    if (backendUrl && activeTab === 'messages') fetchMessages(1, false);
  }, [backendUrl, activeTab, fetchMessages]);

  useEffect(() => {
    setGroupedMessages(groupMessagesByDate(messages));
  }, [messages]);

  const fetchMemories = useCallback(async () => {
    if (!backendUrl) return;
    try {
      const api = new MemoryApi(backendUrl, getToken);
      setMemories(await api.getMemories());
    } catch (_) {}
  }, [backendUrl, getToken]);

  useEffect(() => {
    if (backendUrl && activeTab === 'home') fetchMemories();
  }, [backendUrl, activeTab, fetchMemories]);

  useEffect(() => {
    if (prevBackendUnavailable.current && !backendUnavailable && backendUrl) {
      if (activeTab === 'messages') fetchMessages(1, false);
      if (activeTab === 'home') fetchMemories();
    }
    prevBackendUnavailable.current = backendUnavailable ?? false;
  }, [backendUnavailable, backendUrl, activeTab, fetchMessages, fetchMemories]);

  useEffect(() => {
    if (!loadMoreRef.current || !hasMore || loading || loadingMore) return;
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) fetchMessages(page + 1, true);
      },
      { threshold: 0.1 }
    );
    observerRef.current.observe(loadMoreRef.current);
    return () => observerRef.current?.disconnect();
  }, [hasMore, loading, loadingMore, page, fetchMessages]);

  const handleCopy = useCallback(async (message: Message) => {
    const text = message.response || message.query;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(message.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (_) {}
  }, []);

  const handleAddMemory = useCallback(async () => {
    if (!memoryText.trim() || isAddingMemory || !backendUrl) return;
    setIsAddingMemory(true);
    try {
      const api = new MemoryApi(backendUrl, getToken);
      await api.addMemory(memoryText.trim(), memoryKey.trim() || undefined);
      setMemoryText('');
      setMemoryKey('');
      await fetchMemories();
      setSuccessMessage('Memory saved successfully');
    } catch (_) {
      setErrorMessage('Failed to save memory');
    } finally {
      setIsAddingMemory(false);
    }
  }, [memoryText, memoryKey, isAddingMemory, backendUrl, getToken, fetchMemories]);

  const handleDeleteMemory = useCallback(
    async (id: string) => {
      if (!backendUrl) return;
      try {
        const api = new MemoryApi(backendUrl, getToken);
        await api.deleteMemory(id);
        await fetchMemories();
        setSuccessMessage('Memory deleted successfully');
      } catch (_) {
        setErrorMessage('Failed to delete memory');
      }
    },
    [backendUrl, getToken, fetchMemories]
  );

  if (!isAuthenticated) return null;

  return (
    <div className="h-screen w-full bg-white flex flex-col md:flex-row">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        user={user}
        subscription={subscription}
        onLogout={onLogout}
      />

      <div className="flex-1 flex flex-col relative min-w-0">
        <div className="absolute top-0 left-0 right-0 h-12 pl-20 z-10" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties} />
        {(errorMessage || successMessage) && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
            <div
              className={`px-4 py-2 rounded-lg text-sm font-garamond shadow-lg ${
                errorMessage ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'
              }`}
            >
              {errorMessage || successMessage}
            </div>
          </div>
        )}
        <div
          className="flex-1 overflow-auto p-4 pt-12 md:p-8"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
        >
          <style>{`.flex-1.overflow-auto::-webkit-scrollbar { display: none; }`}</style>
          {backendUnavailable && (
            <div className="max-w-3xl mx-auto mb-4 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm font-garamond">
              Server is unreachable. Your session is still valid; data will load when the backend is back.
            </div>
          )}
          {activeTab === 'home' && (
            <HomeContent
              memoryText={memoryText}
              onMemoryTextChange={setMemoryText}
              memoryKey={memoryKey}
              onMemoryKeyChange={setMemoryKey}
              memories={memories}
              isAddingMemory={isAddingMemory}
              onAddMemory={handleAddMemory}
              onDeleteMemory={handleDeleteMemory}
            />
          )}
          {activeTab === 'messages' && (
            <MessageList
              groupedMessages={groupedMessages}
              messagesLength={messages.length}
              loading={loading}
              loadingMore={loadingMore}
              error={error}
              copiedId={copiedId}
              scrollContainerRef={scrollContainerRef}
              loadMoreRef={loadMoreRef}
              onCopy={handleCopy}
            />
          )}
          {activeTab === 'settings' && <SettingsContent />}
        </div>
      </div>
    </div>
  );
};
