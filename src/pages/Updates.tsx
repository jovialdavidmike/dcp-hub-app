import React, { useEffect, useState, useRef } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, addDoc, increment } from 'firebase/firestore';
import { Zap, MessageCircle, Share2, Send, Activity, Reply, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

import RankBadge from '../components/RankBadge';

interface Update {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorRank?: string;
  imageUrl?: string;
  videoUrl?: string;
  likes?: string[];
  createdAt: string;
}

interface Comment {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  authorPhoto: string;
  authorRank?: string;
  replyTo?: {
    id: string;
    name: string;
    text: string;
  };
  createdAt: string;
}

const PostCard = ({ update, user, userData }: { key?: React.Key, update: Update, user: any, userData: any }) => {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLiking, setIsLiking] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ id: string, name: string, text: string } | null>(null);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  const hasLiked = user ? (update.likes || []).includes(user.uid) : false;
  const likeCount = (update.likes || []).length;

  useEffect(() => {
    if (!showComments) return;
    const q = query(
      collection(db, `updates/${update.id}/comments`),
      orderBy('createdAt', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Comment[]);
    });
    return unsubscribe;
  }, [showComments, update.id]);

  const toggleLike = async () => {
    if (!user) return;
    setIsLiking(true);
    const updateRef = doc(db, 'updates', update.id);
    const authorRef = doc(db, 'users', update.authorId);
    try {
      if (hasLiked) {
        await updateDoc(updateRef, { likes: arrayRemove(user.uid) });
        await updateDoc(authorRef, { impactsReceived: increment(-1) }).catch(e => console.error("Error decrementing impacts:", e));
      } else {
        await updateDoc(updateRef, { likes: arrayUnion(user.uid) });
        await updateDoc(authorRef, { impactsReceived: increment(1) }).catch(e => console.error("Error incrementing impacts:", e));
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    } finally {
      setTimeout(() => setIsLiking(false), 500);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Hub Update',
          text: update.content.substring(0, 100) + '...',
          url: window.location.href,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      navigator.clipboard.writeText(`${update.content}\n\n${window.location.href}`);
      alert('Link copied to clipboard!');
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user || !userData) return;

    const text = newComment;
    const replyData = replyingTo;
    
    setNewComment('');
    setReplyingTo(null);

    try {
      const commentData: any = {
        text,
        authorId: user.uid,
        authorName: userData.displayName || 'Member',
        authorPhoto: userData.photoURL || '',
        authorRank: userData.rank || 'Tech Apprentice',
        createdAt: new Date().toISOString()
      };

      if (replyData) {
        commentData.replyTo = replyData;
      }

      await addDoc(collection(db, `updates/${update.id}/comments`), commentData);
      
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { commentsPosted: increment(1) }).catch(e => console.error("Error incrementing comments:", e));
    } catch (error) {
      console.error("Error posting comment:", error);
    }
  };

  const handleReplyClick = (comment: Comment) => {
    setReplyingTo({
      id: comment.id,
      name: comment.authorName,
      text: comment.text
    });
    if (commentInputRef.current) {
      commentInputRef.current.focus();
    }
  };

  const getYouTubeEmbedUrl = (url?: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
  };

  const embedUrl = getYouTubeEmbedUrl(update.videoUrl);

  return (
    <div className="bg-gray-900/40 backdrop-blur-md rounded-2xl border border-white/10 relative overflow-hidden flex flex-col transition-transform duration-300 hover:-translate-y-1 shadow-lg">
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyan-500 to-purple-500 z-10"></div>
      
      {/* Media Section */}
      {embedUrl ? (
        <div className="w-full aspect-video bg-black relative">
          <iframe 
            src={embedUrl} 
            title="YouTube video player" 
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen
          ></iframe>
        </div>
      ) : update.imageUrl ? (
        <div className="w-full h-56 bg-black relative">
          <img 
            src={update.imageUrl} 
            alt="Update" 
            className="w-full h-full object-cover"
          />
        </div>
      ) : null}
      
      <div className="p-5 flex-1 flex flex-col">
        {/* Author & Time */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-900/50 flex items-center justify-center text-sm font-bold text-purple-300 border border-purple-500/30">
              {update.authorName?.charAt(0) || 'A'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="block text-sm font-bold text-gray-200">{update.authorName || 'Admin'}</span>
                <RankBadge rank={update.authorRank || 'Tech Apprentice'} />
              </div>
              <span className="block text-[10px] text-gray-500">
                {new Date(update.createdAt).toLocaleString(undefined, {
                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
              </span>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap mb-5 flex-1 font-sans">
          {update.content}
        </p>

        {/* Engagement Bar */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-800/50 mt-auto">
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleLike}
              className={`flex items-center gap-1.5 transition-all duration-300 group ${
                hasLiked ? 'text-cyan-400' : 'text-gray-400 hover:text-cyan-300'
              } ${isLiking ? 'scale-125' : 'scale-100'}`}
            >
              <Zap size={18} className={`${hasLiked ? 'fill-current drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'group-hover:fill-cyan-900/50'}`} />
              <span className="text-xs font-semibold">
                {likeCount} {likeCount === 1 ? 'Impact' : 'Impacts'}
              </span>
            </button>

            <button 
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-1.5 text-gray-400 hover:text-purple-400 transition-colors"
            >
              <MessageCircle size={18} />
              <span className="text-xs font-semibold">Insights</span>
            </button>
          </div>

          <button 
            onClick={handleShare}
            className="text-gray-400 hover:text-white transition-colors p-1"
          >
            <Share2 size={18} />
          </button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-4 pt-4 border-t border-gray-800/50 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="space-y-3 mb-4 max-h-48 overflow-y-auto custom-scrollbar pr-2">
              {comments.length === 0 ? (
                <p className="text-xs text-gray-500 text-center italic">No insights yet. Be the first to share your thoughts!</p>
              ) : (
                comments.map(comment => (
                  <div key={comment.id} className="flex gap-2 group">
                    {comment.authorPhoto ? (
                      <img src={comment.authorPhoto} alt={comment.authorName} className="w-6 h-6 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-[10px] font-bold text-gray-400 shrink-0">
                        {comment.authorName.charAt(0)}
                      </div>
                    )}
                    <div className="bg-gray-800/50 rounded-2xl rounded-tl-sm px-3 py-2 flex-1 relative">
                      <div className="flex justify-between items-baseline mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-300">{comment.authorName}</span>
                          <RankBadge rank={comment.authorRank || 'Tech Apprentice'} />
                        </div>
                        <span className="text-[9px] text-gray-500">
                          {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {comment.replyTo && (
                        <div className="mb-1.5 pl-2 border-l-2 border-purple-500/50 bg-black/20 p-1 rounded text-[10px] text-gray-400">
                          <span className="font-bold text-purple-400">{comment.replyTo.name}</span>
                          <span className="ml-1 opacity-80 line-clamp-1">{comment.replyTo.text}</span>
                        </div>
                      )}
                      <p className="text-xs text-gray-300 leading-relaxed">{comment.text}</p>
                      
                      <button
                        onClick={() => handleReplyClick(comment)}
                        className="absolute -right-2 -bottom-2 p-1.5 bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white rounded-full transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 shadow-md"
                        title="Reply"
                      >
                        <Reply size={12} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="flex flex-col gap-2">
              {replyingTo && (
                <div className="px-3 py-2 bg-gray-900/80 border border-purple-500/50 rounded-xl shadow-[0_0_10px_rgba(168,85,247,0.2)] flex justify-between items-center animate-in slide-in-from-bottom-2">
                  <div className="overflow-hidden">
                    <span className="text-[10px] text-purple-400 font-bold block mb-0.5">Replying to {replyingTo.name}</span>
                    <p className="text-[10px] text-gray-300 line-clamp-1 truncate">{replyingTo.text}</p>
                  </div>
                  <button 
                    onClick={() => setReplyingTo(null)}
                    className="p-1 text-gray-500 hover:text-gray-300 ml-2 shrink-0"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
              <form onSubmit={handlePostComment} className="flex gap-2 items-end">
                <textarea
                  ref={commentInputRef}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your insight..."
                  className="flex-1 bg-black/50 border border-gray-700 rounded-xl py-2 px-3 text-base text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none min-h-[40px] max-h-24 custom-scrollbar"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handlePostComment(e);
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="h-10 w-10 rounded-full bg-purple-600 hover:bg-purple-500 flex items-center justify-center text-white transition-colors disabled:opacity-50 shrink-0"
                >
                  <Send size={16} className="ml-0.5" />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function Updates() {
  const { user, userData } = useAuth();
  const [updates, setUpdates] = useState<Update[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'updates'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newUpdates = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Update[];
      setUpdates(newUpdates);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <div className="space-y-6 pb-10">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
          <Activity className="text-cyan-400" size={20} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Social Pulse</h2>
          <p className="text-gray-400 text-sm">Real-time updates and community insights.</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">Loading pulse...</div>
      ) : updates.length === 0 ? (
        <div className="text-center py-10 text-gray-500 bg-gray-900/30 rounded-xl border border-gray-800">
          No activity yet.
        </div>
      ) : (
        <div className="space-y-6">
          {updates.map(update => (
            <PostCard key={update.id} update={update} user={user} userData={userData} />
          ))}
        </div>
      )}
    </div>
  );
}
