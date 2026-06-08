import { useState, useRef, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { API_URL } from '../config';
import { useLanguage } from '../i18n';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

const ChatWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: ${({ $compact }) => ($compact ? '560px' : '70vh')};
  max-width: 900px;
  width: 100%;
  margin: 0 auto;
  background-color: #fff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  overflow: hidden;

  @media (max-width: 620px) {
    height: 560px;
  }
`;

const ChatContainer = styled.div`
  flex-grow: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #f1efe8;
`;

const Message = styled.div`
  padding: 12px 16px;
  border-radius: 8px;
  max-width: 80%;
  word-break: break-word;
  background-color: ${({ sender }) => (sender === 'user' ? '#378add' : '#ffffff')};
  color: ${({ sender }) => (sender === 'user' ? '#fff' : '#2f3540')};
  align-self: ${({ sender }) => (sender === 'user' ? 'flex-end' : 'flex-start')};
  border: ${({ sender }) => (sender === 'user' ? '0' : '1px solid rgba(0, 0, 0, 0.08)')};
  line-height: 1.55;
`;

const InputArea = styled.div`
  position: sticky;
  bottom: 0;
  background-color: #fff;
  padding: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
`;

const InputContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const InputField = styled.input`
  flex-grow: 1;
  padding: 12px 16px;
  min-height: 54px;
  border: 1px solid #b8c2cc;
  border-radius: 8px;
  font-size: 16px;
  outline: none;
  transition: border-color 0.2s ease;

  &:focus {
    border-color: #378add;
  }
`;

const SendButton = styled.button`
  min-width: 58px;
  min-height: 54px;
  padding: 0 18px;
  background-color: #378add;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #185fa5;
  }

  &:disabled {
    background-color: #b0bec5;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.div`
  display: grid;
  gap: 14px;
  max-width: 520px;
  margin: 24px auto;
  color: #2f3540;
  font-size: 20px;
  line-height: 1.5;

  span {
    color: #185fa5;
    font-size: 15px;
    font-weight: 700;
  }
`;

const SuggestionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  button {
    min-height: 38px;
    padding: 0 12px;
    border: 0.5px solid #85b7eb;
    border-radius: 999px;
    background: #ffffff;
    color: #185fa5;
    font-weight: 700;
    cursor: pointer;
  }
`;

const ChatInterface = ({ documentName, business, onMessageSaved, onConversationChange, compact = false }) => {
  const { t } = useLanguage();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const chatContainerRef = useRef(null);
  const abortRef = useRef(null);
  const messagesRef = useRef(messages);
  const msgIdRef = useRef(0);
  const nextMsgId = useCallback(() => `msg_${Date.now()}_${++msgIdRef.current}`, []);

  // Persist messages to localStorage when they change
  useEffect(() => {
    if (business?.id && messages !== messagesRef.current) {
      localStorage.setItem(`sahel_chat_history_${business.id}`, JSON.stringify(messages));
      messagesRef.current = messages;
    }
  }, [messages, business?.id]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (business?.id) {
      const stored = localStorage.getItem(`sahel_chat_history_${business.id}`);
      const storedConvId = localStorage.getItem(`sahel_chat_conv_id_${business.id}`);
      if (stored) {
        try {
          setMessages(JSON.parse(stored));
        } catch (e) {
          console.error('Failed to parse chat history:', e);
          setMessages([]);
        }
      } else {
        setMessages([]);
      }
      setConversationId(storedConvId || null);
    } else {
      setMessages([]);
      setConversationId(null);
    }
    setInput('');
  }, [business?.id]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const sendMessage = useCallback(async (messageText) => {
    const trimmedInput = (messageText || '').trim();
    if (!trimmedInput || isLoading || !business) return;

    const newUserMessage = { id: nextMsgId(), text: trimmedInput, sender: 'user' };
    setMessages((prev) => [...prev, newUserMessage]);
    setInput('');
    setIsLoading(true);

    try {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const response = await api.post(`/businesses/${business.id}/chat`, {
        question: trimmedInput,
        conversation_id: conversationId,
      }, { signal: controller.signal });
      const newConvId = response.data.conversation_id;
      setConversationId(newConvId);
      localStorage.setItem(`sahel_chat_conv_id_${business.id}`, newConvId);
      onConversationChange?.(newConvId);

      const newBotMessage = { id: nextMsgId(), text: response.data.answer, sender: 'bot' };
      setMessages((prev) => [...prev, newBotMessage]);
      onMessageSaved?.();
    } catch (e) {
      console.error('Chat API error:', e);
      const errorMsg = { id: nextMsgId(), text: t('chat.error'), sender: 'bot' };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [business, conversationId, isLoading, onConversationChange, onMessageSaved, nextMsgId, t]);

  return (
    <ChatWrapper $compact={compact}>
      <ChatContainer ref={chatContainerRef}>
        {messages.length === 0 ? (
          <EmptyState>
            <span>AI-POWERED CONCIERGE</span>
            <div>
              {documentName
                ? `Posez une question sur "${documentName}" pour tester ${business?.name}.`
                : t('chat.welcome')}
            </div>
            <SuggestionRow>
              <button type="button" onClick={() => setInput(t('chat.suggestServices'))}>
                {t('chat.services')}
              </button>
              <button type="button" onClick={() => setInput(t('chat.suggestPricing'))}>
                {t('chat.pricing')}
              </button>
            </SuggestionRow>
          </EmptyState>
        ) : (
          messages.map((message) => (
            <Message key={message.id} sender={message.sender}>
              {message.text}
            </Message>
          ))
        )}
      </ChatContainer>
      <InputArea>
        <InputContainer>
          <InputField
            type="text"
            placeholder={t('chat.placeholder')}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
            disabled={isLoading}
          />
          <SendButton onClick={() => sendMessage(input)} disabled={!input.trim() || isLoading || !business} aria-label={t('chat.send')}>
            {isLoading ? '...' : '▷'}
          </SendButton>
        </InputContainer>
      </InputArea>
    </ChatWrapper>
  );
};

export default ChatInterface;
