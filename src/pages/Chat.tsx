import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { ArrowLeft, Send, Heart, Reply, X } from 'lucide-react';

import RankBadge from '../components/RankBadge';

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  senderPhoto: string;
  senderRank?: string;
  teamId: string;
  likes?: string[];
  replyTo?: {
    id: string;
    name: string;
    text: string;
  };
  createdAt: string;
}

export default function Chat() {
  const { teamId } = useParams<{ teamId: string }>();
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<{ id: string, name: string, text: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!userData?.teams?.includes(teamId || '')) {
      navigate('/teams');
      return;
    }

    const q = query(
      collection(db, 'messages'),
      where('teamId', '==', teamId),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(msgs);
      setLoading(false);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    return unsubscribe;
  }, [teamId, userData, navigate]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !userData) return;

    const text = newMessage;
    const replyData = replyingTo;
    
    setNewMessage('');
    setReplyingTo(null);

    try {
      const messageData: any = {
        text,
        senderId: user.uid,
        senderName: userData.displayName || 'Member',
        senderPhoto: userData.photoURL || '',
        senderRank: userData.rank || 'Tech Apprentice',
        teamId,
        likes: [],
        createdAt: new Date().toISOString()
      };

      if (replyData) {
        messageData.replyTo = replyData;
      }

      await addDoc(collection(db, 'messages'), messageData);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const toggleLike = async (messageId: string, currentLikes: string[] = []) => {
    if (!user) return;
    
    const messageRef = doc(db, 'messages', messageId);
    const hasLiked = currentLikes.includes(user.uid);

    try {
      if (hasLiked) {
        await updateDoc(messageRef, {
          likes: arrayRemove(user.uid)
        });
      } else {
        await updateDoc(messageRef, {
          likes: arrayUnion(user.uid)
        });
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handleReplyClick = (msg: Message) => {
    setReplyingTo({
      id: msg.id,
      name: msg.senderName,
      text: msg.text
    });
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const teamName = teamId?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <div className="flex flex-col h-[calc(100dvh-140px)]">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-800 mb-4">
        <button onClick={() => navigate('/teams')} className="p-2 hover:bg-gray-900 rounded-full text-gray-400 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-lg font-bold text-white">{teamName} Chat</h2>
          <p className="text-xs text-cyan-400">Secure Team Channel</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4 pb-4">
        {loading ? (
          <div className="text-center text-gray-500 py-4">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 py-10">No messages yet. Be the first to say hello!</div>
        ) : (
          messages.map((msg, index) => {
            const isMine = msg.senderId === user?.uid;
            const showHeader = index === 0 || messages[index - 1].senderId !== msg.senderId;
            const hasLiked = user ? (msg.likes || []).includes(user.uid) : false;
            const likeCount = (msg.likes || []).length;

            return (
              <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                {showHeader && (
                  <div className={`flex items-center gap-2 mb-1 ${isMine ? 'flex-row-reverse' : ''}`}>
                    {msg.senderPhoto ? (
                      <img src={msg.senderPhoto} alt={msg.senderName} className="w-5 h-5 rounded-full object-cover" />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center text-[10px] font-bold text-gray-400">
                        {msg.senderName.charAt(0)}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{msg.senderName}</span>
                      <RankBadge rank={msg.senderRank || 'Tech Apprentice'} />
                    </div>
                  </div>
                )}
                
                <div className="relative group max-w-[85%]">
                  <div className={`px-4 py-2 rounded-2xl ${
                    isMine 
                      ? 'bg-purple-900/40 text-white border border-purple-500/30 rounded-tr-sm' 
                      : 'bg-cyan-900/20 text-gray-200 border border-cyan-500/30 rounded-tl-sm'
                  }`}>
                    {msg.replyTo && (
                      <div className={`mb-2 pl-2 border-l-2 text-xs rounded p-1.5 ${isMine ? 'border-purple-400 bg-purple-900/40 text-purple-200' : 'border-cyan-400 bg-cyan-900/40 text-cyan-200'}`}>
                        <span className="font-bold block mb-0.5">{msg.replyTo.name}</span>
                        <span className="line-clamp-1 opacity-80">{msg.replyTo.text}</span>
                      </div>
                    )}
                    <p className="text-sm leading-relaxed break-words">{msg.text}</p>
                    <div className={`text-[10px] mt-1 ${isMine ? 'text-purple-300/60 text-right' : 'text-cyan-500/60'}`}>
                      {formatTime(msg.createdAt)}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className={`absolute ${isMine ? '-left-16' : '-right-16'} bottom-1 flex gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity`}>
                    <button
                      onClick={() => handleReplyClick(msg)}
                      className="p-1.5 bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white rounded-full transition-colors"
                      title="Reply"
                    >
                      <Reply size={14} />
                    </button>
                    <button
                      onClick={() => toggleLike(msg.id, msg.likes)}
                      className={`p-1.5 rounded-full transition-all ${
                        hasLiked ? 'bg-pink-500/20 text-pink-400' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                      title="Like"
                    >
                      <Heart size={14} className={hasLiked ? 'fill-current' : ''} />
                    </button>
                  </div>
                  
                  {/* Like Counter Badge */}
                  {likeCount > 0 && (
                    <div className={`absolute ${isMine ? '-left-3' : '-right-3'} -bottom-2 bg-black border border-gray-800 rounded-full px-1.5 py-0.5 flex items-center gap-1 text-[10px] text-pink-400 z-10`}>
                      <Heart size={8} className="fill-current" /> {likeCount}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="mt-2 flex flex-col gap-2">
        {replyingTo && (
          <div className="px-3 py-2 bg-gray-900/80 border border-purple-500/50 rounded-xl shadow-[0_0_10px_rgba(168,85,247,0.2)] flex justify-between items-center animate-in slide-in-from-bottom-2">
            <div className="overflow-hidden">
              <span className="text-xs text-purple-400 font-bold block mb-0.5">Replying to {replyingTo.name}</span>
              <p className="text-xs text-gray-300 line-clamp-1 truncate">{replyingTo.text}</p>
            </div>
            <button 
              onClick={() => setReplyingTo(null)}
              className="p-1 text-gray-500 hover:text-gray-300 ml-2 shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        )}
        <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
            placeholder="Type a message..."
            className="flex-1 bg-gray-900 border border-gray-800 rounded-2xl py-3 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 resize-none max-h-32 min-h-[48px] custom-scrollbar"
            rows={1}
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="h-12 w-12 rounded-full bg-purple-600 hover:bg-purple-500 flex items-center justify-center text-white transition-colors disabled:opacity-50 disabled:hover:bg-purple-600 shrink-0 shadow-[0_0_15px_rgba(168,85,247,0.4)]"
          >
            <Send size={20} className="ml-1" />
          </button>
        </form>
      </div>
    </div>
  );
}
