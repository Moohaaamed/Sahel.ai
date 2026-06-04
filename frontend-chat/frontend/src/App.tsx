import { useState, useCallback, useMemo, useEffect } from 'react';
import { ChatHeader, ChatViewport, ChatInput, type Message, type ChatModes } from '@/components/chat';
import { useChat } from '@/hooks/useChat';
import { useDocuments } from '@/hooks/useDocuments';
import { getToken, getOwner } from '@/lib/auth';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';

type Route = 'login' | 'chat' | 'dashboard';

function getRoute(): Route {
  if (!getToken()) return 'login';
  const hash = window.location.hash.slice(1);
  if (hash === '/dashboard') return 'dashboard';
  return 'chat';
}

function App() {
  const [route, setRoute] = useState<Route>(getRoute);

  useEffect(() => {
    const onHash = () => setRoute(getRoute());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  if (route === 'login') {
    return <LoginPage onLogin={() => { window.location.hash = '/dashboard'; setRoute('dashboard'); }} />;
  }

  if (route === 'dashboard') {
    return <DashboardPage onLogout={() => { localStorage.removeItem('sahel_token'); localStorage.removeItem('sahel_owner'); setRoute('login'); }} />;
  }

  return <ChatView />;
}

function ChatView() {
  const { messages: rawMessages, isStreaming, sendMessage, clearMessages } = useChat();
  const { documents, uploading, setDocuments, setUploading, setError } = useDocuments();

  const [modes, setModes] = useState<ChatModes>({
    rag: false,
    reasoning: false,
    webSearch: false,
  });

  const messages: Message[] = useMemo(
    () =>
      rawMessages.map((msg) => ({
        id: String(msg.id),
        role: msg.sender === 'user' ? ('user' as const) : ('assistant' as const),
        content: msg.text,
        isStreaming: msg.isStreaming,
      })),
    [rawMessages],
  );

  const handleSend = useCallback(
    (content: string) => {
      sendMessage(content, modes.rag);
    },
    [sendMessage, modes.rag],
  );

  const handleNewChat = useCallback(() => {
    clearMessages();
  }, [clearMessages]);

  const handleUploadStart = useCallback(
    (filename: string) => {
      setError(null);
      setUploading({ filename, progress: 0 });
    },
    [setError, setUploading],
  );

  const handleUploadProgress = useCallback(
    (filename: string, progress: number) => {
      setUploading({ filename, progress });
    },
    [setUploading],
  );

  const handleUploadEnd = useCallback(() => {
    setUploading(null);
  }, [setUploading]);

  const handleError = useCallback(
    (message: string) => {
      setError(message);
    },
    [setError],
  );

  const owner = getOwner();

  return (
    <div className="flex flex-col h-screen bg-background">
      <ChatHeader onNewChat={handleNewChat} disabled={isStreaming} />
      {owner && (
        <div className="flex justify-end px-4 py-1">
          <a
            href="#/dashboard"
            className="text-xs text-muted-foreground hover:text-primary transition"
          >
            Dashboard &rarr;
          </a>
        </div>
      )}

      <main className="flex-1 flex flex-col min-h-0">
        <ChatViewport messages={messages} />

        <div className="shrink-0 border-t border-border/30 bg-background/50 backdrop-blur-sm">
          <ChatInput
            onSend={handleSend}
            isLoading={isStreaming}
            modes={modes}
            onModesChange={setModes}
            documents={documents}
            uploading={uploading}
            onDocumentsChange={setDocuments}
            onUploadStart={handleUploadStart}
            onUploadProgress={handleUploadProgress}
            onUploadEnd={handleUploadEnd}
            onError={handleError}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
