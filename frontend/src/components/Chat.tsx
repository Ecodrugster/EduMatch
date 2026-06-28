import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../api/axios';
import { useAuth } from '../context/AuthContext';

interface Message {
  id?: number;
  project_id: number;
  sender_id: number;
  content: string;
  sent_at: string;
}

interface ChatProps {
  projectId: number;
}

export const Chat: React.FC<ChatProps> = ({ projectId }) => {
  const { accessToken, userId } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch initial message history
  const { data: history, isLoading } = useQuery({
    queryKey: ['messages', projectId],
    queryFn: async () => {
      const res = await axiosInstance.get(`/protected/messages?project_id=${projectId}&limit=100`);
      return res.data.messages as Message[];
    },
    enabled: projectId > 0,
  });

  useEffect(() => {
    if (history) {
      // Backend might return latest first or oldest first. Sort by sent_at to be safe.
      const sorted = [...history].sort((a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime());
      setMessages(sorted);
    }
  }, [history]);

  useEffect(() => {
    if (!accessToken || !projectId) return;

    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const wsUrl = isLocal
      ? `ws://localhost:8080/protected/ws/${projectId}?token=${accessToken}`
      : `wss://edumatch-ap9d.onrender.com/protected/ws/${projectId}?token=${accessToken}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const msg: Message = JSON.parse(event.data);
        setMessages((prev) => [...prev, msg]);
      } catch (e) {
        console.error("Failed to parse websocket message", e);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket closed");
    };

    return () => {
      ws.close();
    };
  }, [projectId, accessToken]);

  useEffect(() => {
    // Scroll to bottom when messages update
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !wsRef.current) return;
    
    // The backend just expects the raw string text.
    wsRef.current.send(input.trim());
    setInput('');
  };

  if (isLoading) return <div className="text-cyan-800 dark:text-cyan-100">Загрузка истории чата...</div>;

  return (
    <div className="flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden h-[500px]">
      <div className="bg-gray-50 dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="m-0 text-cyan-400">Командный Чат</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {messages.map((msg, idx) => {
          const isMe = msg.sender_id === userId;
          return (
            <div key={idx} className={`flex flex-col max-w-[70%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}>
              <span className="text-xs text-gray-500 mb-1">
                {isMe ? 'Вы' : `Пользователь #${msg.sender_id}`}
              </span>
              <div className={`px-4 py-2 rounded-2xl ${isMe ? 'bg-cyan-600 text-white rounded-br-none' : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-bl-none'}`}>
                {msg.content}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="p-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex gap-2">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Написать сообщение..."
          className="flex-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-full px-4 py-2 outline-none focus:ring-1 focus:ring-cyan-500"
        />
        <button 
          type="submit"
          disabled={!input.trim()}
          className="bg-cyan-500 text-white rounded-full px-6 py-2 font-semibold hover:bg-cyan-600 disabled:opacity-50 transition-colors"
        >
          Отправить
        </button>
      </form>
    </div>
  );
};
