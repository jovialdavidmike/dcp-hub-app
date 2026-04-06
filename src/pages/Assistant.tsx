import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { GoogleGenAI } from '@google/genai';
import { Send, Bot, User, Loader2 } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export default function Assistant() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history from localStorage
  useEffect(() => {
    if (user) {
      const savedHistory = localStorage.getItem(`assistant_chat_${user.uid}`);
      if (savedHistory) {
        try {
          setMessages(JSON.parse(savedHistory));
        } catch (e) {
          console.error("Failed to parse chat history", e);
        }
      } else {
        // Initial greeting
        setMessages([
          {
            id: Date.now().toString(),
            role: 'model',
            text: "Welcome to the DC Prime Techub. I'm the Hub Assistant. What are we building today?",
            timestamp: Date.now(),
          }
        ]);
      }
    }
  }, [user]);

  // Save chat history to localStorage whenever it changes
  useEffect(() => {
    if (user && messages.length > 0) {
      localStorage.setItem(`assistant_chat_${user.uid}`, JSON.stringify(messages));
    }
    scrollToBottom();
  }, [messages, user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
      
      // Format history for the model
      const history = messages.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }));

      const chat = ai.chats.create({
        model: 'gemini-3.1-pro-preview',
        config: {
          systemInstruction: "You are the DCP Hub Assistant. You help members of the DC Prime Techub in Abuja with technical questions, motivation, and hub navigation. Keep your tone gritty, professional, and encouraging.",
        }
      });

      // We need to send the history to the chat instance if we want it to remember context.
      // But the @google/genai SDK doesn't easily let us pass history to `ai.chats.create` directly in the same way as the old SDK.
      // Let's use `generateContent` with history instead.
      
      const contents = messages.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }));
      contents.push({ role: 'user', parts: [{ text: userMessage.text }] });

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: contents,
        config: {
          systemInstruction: "You are the DCP Hub Assistant. You help members of the DC Prime Techub in Abuja with technical questions, motivation, and hub navigation. Keep your tone gritty, professional, and encouraging.",
        }
      });

      if (response.text) {
        const modelMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: response.text,
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, modelMessage]);
      }
    } catch (error) {
      console.error("Error communicating with Hub Assistant:", error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "System error. I'm having trouble connecting right now. Try again later.",
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-h-[800px] bg-gray-900/50 rounded-2xl border-2 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.4)] overflow-hidden">
      <div className="p-4 bg-gray-900 border-b border-purple-500/50 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-purple-900/50 flex items-center justify-center border border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.5)]">
          <Bot className="text-purple-400" size={20} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">DCP Hub Assistant</h2>
          <p className="text-xs text-purple-400">AI Support & Navigation</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex max-w-[80%] gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-auto ${
                msg.role === 'user' 
                  ? 'bg-cyan-900/50 border border-cyan-500/30' 
                  : 'bg-purple-900/50 border border-purple-500/50 shadow-[0_0_8px_rgba(168,85,247,0.4)]'
              }`}>
                {msg.role === 'user' ? <User size={14} className="text-cyan-400" /> : <Bot size={14} className="text-purple-400" />}
              </div>
              <div
                className={`p-3 rounded-2xl ${
                  msg.role === 'user'
                    ? 'bg-cyan-900/30 text-white rounded-br-sm border border-cyan-800/50'
                    : 'bg-gray-800/80 text-gray-200 rounded-bl-sm border border-purple-900/50'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                <span className="text-[10px] opacity-50 mt-1 block text-right">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex max-w-[80%] gap-2 flex-row">
              <div className="w-8 h-8 rounded-full bg-purple-900/50 border border-purple-500/50 shadow-[0_0_8px_rgba(168,85,247,0.4)] flex items-center justify-center shrink-0 mt-auto">
                <Bot size={14} className="text-purple-400" />
              </div>
              <div className="p-3 rounded-2xl bg-gray-800/80 text-gray-200 rounded-bl-sm border border-purple-900/50 flex items-center gap-2">
                <Loader2 size={14} className="animate-spin text-purple-400" />
                <span className="text-sm text-gray-400">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-gray-900 border-t border-purple-500/50">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask the Hub Assistant..."
            className="flex-1 bg-black border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="w-12 h-12 rounded-xl bg-purple-600 hover:bg-purple-500 flex items-center justify-center text-white transition-colors disabled:opacity-50 shadow-[0_0_10px_rgba(168,85,247,0.3)] shrink-0"
          >
            <Send size={18} className="ml-1" />
          </button>
        </form>
      </div>
    </div>
  );
}
