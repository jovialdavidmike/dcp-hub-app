import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, storage } from '../firebase';
import { collection, addDoc, query, getDocs, deleteDoc, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Navigate } from 'react-router-dom';
import { GoogleGenAI } from '@google/genai';
import { Send, Image, Link as LinkIcon, Trash2, Users, Camera, Loader2, Radio, Youtube, Zap, ShieldAlert, Edit, Plus, X, Sparkles } from 'lucide-react';

const AVAILABLE_TEAMS = ['robotics', 'ai', 'cybersecurity', 'web-dev'];

export default function AdminDashboard() {
  const { userData, isSuperAdmin, isAdmin } = useAuth();
  const [updateContent, setUpdateContent] = useState('');
  const [updateImage, setUpdateImage] = useState<File | null>(null);
  const [updateVideoUrl, setUpdateVideoUrl] = useState('');
  const [adTitle, setAdTitle] = useState('');
  const [adImage, setAdImage] = useState('');
  const [adLink, setAdLink] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [members, setMembers] = useState<any[]>([]);
  const [mostImpactful, setMostImpactful] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [generatingUpdate, setGeneratingUpdate] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // User Management State
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editRole, setEditRole] = useState('');

  useEffect(() => {
    if (isAdmin) {
      fetchMembers();
      fetchMostImpactful();
    }
  }, [isAdmin]);

  const fetchMembers = async () => {
    try {
      const q = query(collection(db, 'users'));
      const snapshot = await getDocs(q);
      setMembers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching members", error);
    }
  };

  const fetchMostImpactful = async () => {
    try {
      const q = query(collection(db, 'updates'));
      const snapshot = await getDocs(q);
      let maxLikes = -1;
      let bestPost = null;
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const likesCount = data.likes ? data.likes.length : 0;
        if (likesCount > maxLikes) {
          maxLikes = likesCount;
          bestPost = { id: doc.id, ...data };
        }
      });
      setMostImpactful(bestPost);
    } catch (error) {
      console.error("Error fetching most impactful post", error);
    }
  };

  const handleGenerateUpdate = async () => {
    setGeneratingUpdate(true);
    try {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: 'Generate a 3-sentence, high-energy tech update tailored for a Nigerian Techub (DC Prime Techub in Abuja).',
      });
      if (response.text) {
        setUpdateContent(response.text);
        showMessage('AI update generated successfully!', 'success');
      }
    } catch (error: any) {
      console.error('Error generating update:', error);
      showMessage(error.message || 'Error generating update', 'error');
    } finally {
      setGeneratingUpdate(false);
    }
  };

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const handlePostUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateContent.trim() && !updateImage && !updateVideoUrl.trim()) return;
    
    setLoading(true);
    try {
      let imageUrl = null;
      if (updateImage) {
        const storageRef = ref(storage, `updates/${Date.now()}_${updateImage.name}`);
        await uploadBytes(storageRef, updateImage);
        imageUrl = await getDownloadURL(storageRef);
      }

      await addDoc(collection(db, 'updates'), {
        content: updateContent,
        authorId: userData.uid,
        authorName: userData.displayName || 'Admin',
        authorRank: userData.rank || 'The Pioneer',
        imageUrl: imageUrl,
        videoUrl: updateVideoUrl.trim() || null,
        likes: [],
        createdAt: new Date().toISOString()
      });
      setUpdateContent('');
      setUpdateImage(null);
      setUpdateVideoUrl('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      showMessage('Update posted successfully!', 'success');
      fetchMostImpactful(); // Refresh stats
    } catch (error: any) {
      showMessage(error.message || 'Error posting update', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePostAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adTitle.trim() || !adImage.trim()) return;
    
    setLoading(true);
    try {
      await addDoc(collection(db, 'ads'), {
        title: adTitle,
        imageUrl: adImage,
        link: adLink,
        active: true,
        createdAt: new Date().toISOString()
      });
      setAdTitle('');
      setAdImage('');
      setAdLink('');
      showMessage('Ad posted successfully!', 'success');
    } catch (error: any) {
      showMessage(error.message || 'Error posting ad', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;
    
    setLoading(true);
    try {
      await addDoc(collection(db, 'broadcasts'), {
        message: broadcastMessage,
        createdBy: userData.uid,
        createdAt: new Date().toISOString()
      });
      setBroadcastMessage('');
      showMessage('Global Alert triggered successfully!', 'success');
    } catch (error: any) {
      showMessage(error.message || 'Error triggering broadcast', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUserRole = async (userId: string) => {
    if (!isSuperAdmin) return;
    try {
      await updateDoc(doc(db, 'users', userId), { role: editRole });
      showMessage('User role updated successfully', 'success');
      setEditingUser(null);
      fetchMembers();
    } catch (error: any) {
      showMessage(error.message || 'Error updating user role', 'error');
    }
  };

  const handleToggleTeam = async (userId: string, team: string, currentTeams: string[]) => {
    if (!isSuperAdmin) return;
    try {
      const userRef = doc(db, 'users', userId);
      if (currentTeams.includes(team)) {
        await updateDoc(userRef, { teams: arrayRemove(team) });
      } else {
        await updateDoc(userRef, { teams: arrayUnion(team) });
      }
      fetchMembers();
    } catch (error: any) {
      showMessage(error.message || 'Error updating teams', 'error');
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Admin Dashboard</h2>
        <p className="text-purple-400 text-sm mt-1">Manage platform content and users.</p>
      </div>

      {message.text && (
        <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-900/50 text-green-300 border border-green-500/30' : 'bg-red-900/50 text-red-300 border border-red-500/30'}`}>
          {message.text}
        </div>
      )}

      {/* Global Alert */}
      {isSuperAdmin && (
        <section className="bg-red-900/20 p-5 rounded-2xl border border-red-900/50 shadow-[0_0_15px_rgba(220,38,38,0.1)]">
          <h3 className="text-lg font-medium text-red-400 mb-4 flex items-center gap-2">
            <ShieldAlert size={18} /> Global Alert (System Wide)
          </h3>
          <form onSubmit={handleBroadcast} className="space-y-3">
            <textarea
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              placeholder="Enter message to push to ALL users..."
              className="w-full bg-black border border-red-900/50 rounded-xl p-3 text-white placeholder-gray-600 focus:outline-none focus:border-red-500 min-h-[80px] resize-none"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-medium py-2.5 rounded-xl transition-colors disabled:opacity-50 shadow-[0_0_10px_rgba(220,38,38,0.3)]"
            >
              {loading ? 'Sending...' : 'Send Global Push Notification'}
            </button>
            <p className="text-[10px] text-red-400/70 text-center">Warning: This sends a push notification to everyone in the app, regardless of their team.</p>
          </form>
        </section>
      )}

      {/* Social Pulse Stats */}
      <section className="bg-gray-900/60 p-5 rounded-2xl border border-cyan-900/30">
        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
          <Zap size={18} className="text-cyan-400" /> Social Pulse Stats
        </h3>
        <div className="bg-black border border-gray-800 rounded-xl p-4">
          <p className="text-sm text-gray-400 mb-2">Most Impactful Post</p>
          {mostImpactful ? (
            <div>
              <p className="text-white font-medium line-clamp-2 mb-2">"{mostImpactful.content}"</p>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-cyan-400 flex items-center gap-1"><Zap size={12} className="fill-current" /> {mostImpactful.likes?.length || 0} Impacts</span>
                <span className="text-gray-500">By {mostImpactful.authorName}</span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No posts yet.</p>
          )}
        </div>
      </section>

      {/* Post Update */}
      <section className="bg-gray-900/60 p-5 rounded-2xl border border-purple-900/30">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-white flex items-center gap-2">
            <Send size={18} className="text-purple-400" /> Post Daily Update
          </h3>
          <button
            type="button"
            onClick={handleGenerateUpdate}
            disabled={generatingUpdate}
            className="flex items-center gap-2 px-3 py-1.5 bg-purple-900/40 hover:bg-purple-900/60 text-purple-300 rounded-lg transition-colors border border-purple-500/30 text-sm"
          >
            {generatingUpdate ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            Draft Tech Update with AI
          </button>
        </div>
        <form onSubmit={handlePostUpdate} className="space-y-3">
          <textarea
            value={updateContent}
            onChange={(e) => setUpdateContent(e.target.value)}
            placeholder="What's happening in the hub today?"
            className="w-full bg-black border border-gray-800 rounded-xl p-3 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 min-h-[100px] resize-none"
            required={!updateImage && !updateVideoUrl}
          />
          <div className="relative">
            <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
            <input
              type="url"
              value={updateVideoUrl}
              onChange={(e) => setUpdateVideoUrl(e.target.value)}
              placeholder="YouTube Video URL (optional)"
              className="w-full bg-black border border-gray-800 rounded-xl py-3 pl-10 pr-3 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors border border-gray-700"
            >
              <Camera size={18} />
              {updateImage ? 'Change Image' : 'Add Image'}
            </button>
            {updateImage && (
              <span className="text-xs text-gray-400 truncate max-w-[150px]">
                {updateImage.name}
              </span>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => setUpdateImage(e.target.files?.[0] || null)}
              accept="image/*"
              className="hidden"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-medium py-2.5 rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? 'Posting...' : 'Publish Update'}
          </button>
        </form>
      </section>

      {/* Manage Ads */}
      <section className="bg-gray-900/60 p-5 rounded-2xl border border-cyan-900/30">
        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
          <Image size={18} className="text-cyan-400" /> Manage Sponsored Ads
        </h3>
        <form onSubmit={handlePostAd} className="space-y-3">
          <input
            type="text"
            value={adTitle}
            onChange={(e) => setAdTitle(e.target.value)}
            placeholder="Ad Title / Sponsor Name"
            className="w-full bg-black border border-gray-800 rounded-xl p-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500"
            required
          />
          <div className="relative">
            <Image className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
            <input
              type="url"
              value={adImage}
              onChange={(e) => setAdImage(e.target.value)}
              placeholder="Image URL"
              className="w-full bg-black border border-gray-800 rounded-xl py-3 pl-10 pr-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500"
              required
            />
          </div>
          <div className="relative">
            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
            <input
              type="url"
              value={adLink}
              onChange={(e) => setAdLink(e.target.value)}
              placeholder="Target Link URL (optional)"
              className="w-full bg-black border border-gray-800 rounded-xl py-3 pl-10 pr-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-medium py-2.5 rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Sponsored Ad'}
          </button>
        </form>
      </section>

      {/* Member Directory */}
      <section className="bg-gray-900/60 p-5 rounded-2xl border border-gray-800">
        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
          <Users size={18} className="text-gray-400" /> Member Directory
        </h3>
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
          {members.map(member => (
            <div key={member.id} className="bg-black p-4 rounded-xl border border-gray-800 flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-bold text-white">{member.displayName || 'Unnamed User'}</p>
                  <p className="text-xs text-gray-500">{member.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-1 rounded-full ${
                    member.role === 'admin' ? 'bg-purple-900/30 text-purple-400 border border-purple-500/30' : 
                    member.role === 'banned' ? 'bg-red-900/30 text-red-400 border border-red-500/30' :
                    'bg-gray-800 text-gray-400 border border-gray-700'
                  }`}>
                    {member.role}
                  </span>
                  {isSuperAdmin && (
                    <button 
                      onClick={() => {
                        setEditingUser(editingUser === member.id ? null : member.id);
                        setEditRole(member.role);
                      }}
                      className="p-1 text-gray-500 hover:text-cyan-400 transition-colors"
                    >
                      <Edit size={14} />
                    </button>
                  )}
                </div>
              </div>
              
              {editingUser === member.id && isSuperAdmin && (
                <div className="bg-gray-900/80 p-3 rounded-lg border border-cyan-900/50 mt-2 flex flex-col gap-3">
                  <div className="flex gap-2 items-center">
                    <span className="text-xs text-gray-400 w-12">Role:</span>
                    <select 
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value)}
                      className="bg-black border border-gray-700 text-white text-xs rounded p-1.5 focus:outline-none focus:border-cyan-500 flex-1"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                      <option value="banned">Banned</option>
                    </select>
                    <button 
                      onClick={() => handleUpdateUserRole(member.id)}
                      className="text-[10px] bg-cyan-600 hover:bg-cyan-500 text-white px-2 py-1.5 rounded transition-colors"
                    >
                      Save Role
                    </button>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <span className="text-xs text-gray-400">Manage Teams:</span>
                    <div className="flex flex-wrap gap-2">
                      {AVAILABLE_TEAMS.map(team => {
                        const isMember = (member.teams || []).includes(team);
                        return (
                          <button
                            key={team}
                            onClick={() => handleToggleTeam(member.id, team, member.teams || [])}
                            className={`text-[10px] px-2 py-1 rounded flex items-center gap-1 border transition-colors ${
                              isMember 
                                ? 'bg-cyan-900/40 text-cyan-300 border-cyan-500/50 hover:bg-red-900/40 hover:text-red-300 hover:border-red-500/50' 
                                : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-cyan-900/20 hover:text-cyan-400 hover:border-cyan-900/50'
                            }`}
                          >
                            {isMember ? <X size={10} /> : <Plus size={10} />}
                            <span className="capitalize">{team.replace('-', ' ')}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
              
              {member.bio && (
                <div className="bg-gray-900/50 p-2 rounded-lg border border-gray-800/50">
                  <p className="text-xs text-gray-400 italic">"{member.bio}"</p>
                </div>
              )}
              
              <div className="flex flex-wrap gap-1 mt-1">
                {member.teams && member.teams.length > 0 ? (
                  member.teams.map((team: string) => (
                    <span key={team} className="text-[9px] px-1.5 py-0.5 bg-cyan-900/20 text-cyan-400 rounded border border-cyan-900/50 capitalize">
                      {team.replace('-', ' ')}
                    </span>
                  ))
                ) : (
                  <span className="text-[9px] text-gray-600">No teams joined</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
