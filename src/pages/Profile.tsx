import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User as UserIcon, Mail, Shield, Tag, Camera, Loader2, Edit2, Check, X } from 'lucide-react';
import { storage, db } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import RankBadge from '../components/RankBadge';

export default function Profile() {
  const { user, userData, logout, isSuperAdmin } = useAuth();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [cooldownMessage, setCooldownMessage] = useState('');

  useEffect(() => {
    if (userData) {
      setDisplayName(userData.displayName || '');
      setBio(userData.bio || '');
    }
  }, [userData]);

  if (!userData || !user) return null;

  const checkCooldown = () => {
    if (isSuperAdmin) return true;
    if (!userData.lastUsernameChange) return true;

    const lastChange = new Date(userData.lastUsernameChange).getTime();
    const now = Date.now();
    const daysSinceChange = (now - lastChange) / (1000 * 60 * 60 * 24);

    if (daysSinceChange < 7) {
      const daysLeft = Math.ceil(7 - daysSinceChange);
      setCooldownMessage(`You can change your name again in ${daysLeft} day${daysLeft > 1 ? 's' : ''}.`);
      return false;
    }
    return true;
  };

  const handleEditClick = () => {
    if (checkCooldown()) {
      setIsEditing(true);
      setCooldownMessage('');
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      const updates: any = { bio };
      
      if (displayName !== userData.displayName) {
        updates.displayName = displayName;
        if (!isSuperAdmin) {
          updates.lastUsernameChange = new Date().toISOString();
        }
      }

      await updateDoc(userRef, updates);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }

    setUploading(true);
    try {
      const storageRef = ref(storage, `avatars/${user.uid}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        photoURL: downloadURL
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-900/60 rounded-3xl p-6 border border-gray-800 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-cyan-900/40 to-purple-900/40"></div>
        
        <div className="relative z-10">
          <div className="relative w-24 h-24 mx-auto mb-4">
            <div className="w-full h-full bg-black rounded-full border-4 border-gray-900 flex items-center justify-center shadow-xl overflow-hidden">
              {userData.photoURL ? (
                <img src={userData.photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <UserIcon size={40} className="text-gray-500" />
              )}
            </div>
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 w-8 h-8 bg-cyan-600 rounded-full flex items-center justify-center border-2 border-black hover:bg-cyan-500 transition-colors disabled:opacity-50"
            >
              {uploading ? <Loader2 size={14} className="animate-spin text-white" /> : <Camera size={14} className="text-white" />}
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />
          </div>
          
          {isEditing ? (
            <div className="space-y-3 mt-4 text-left">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Username</label>
                <input 
                  type="text" 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-black border border-gray-700 rounded-lg p-2 text-white text-sm focus:border-cyan-500 focus:outline-none"
                  placeholder="Your username"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Bio (Max 150 chars)</label>
                <textarea 
                  value={bio}
                  onChange={(e) => setBio(e.target.value.slice(0, 150))}
                  className="w-full bg-black border border-gray-700 rounded-lg p-2 text-white text-sm focus:border-cyan-500 focus:outline-none resize-none h-20"
                  placeholder="Tell us about yourself..."
                />
                <div className="text-right text-xs text-gray-500 mt-1">{bio.length}/150</div>
              </div>
              <div className="flex gap-2 justify-end mt-2">
                <button 
                  onClick={() => {
                    setIsEditing(false);
                    setDisplayName(userData.displayName || '');
                    setBio(userData.bio || '');
                  }}
                  className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white"
                >
                  <X size={16} />
                </button>
                <button 
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="p-2 bg-cyan-600 rounded-lg text-white hover:bg-cyan-500 disabled:opacity-50"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-center gap-2">
                <h2 className="text-2xl font-bold text-white">{userData.displayName || 'Techub Member'}</h2>
                <button onClick={handleEditClick} className="text-gray-500 hover:text-cyan-400 transition-colors">
                  <Edit2 size={14} />
                </button>
              </div>
              {cooldownMessage && (
                <p className="text-xs text-amber-400 mt-1">{cooldownMessage}</p>
              )}
              
              {userData.bio && (
                <p className="text-sm text-gray-300 mt-2 max-w-xs mx-auto italic">"{userData.bio}"</p>
              )}
              
              <div className="flex items-center justify-center gap-2 mt-3 text-gray-400 text-sm">
                <Mail size={14} />
                <span>{userData.email}</span>
              </div>
              
              <div className="mt-4 flex justify-center gap-2">
                <RankBadge rank={userData.rank || 'Tech Apprentice'} />
                {!isSuperAdmin && (
                  <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 border ${
                    userData.role === 'admin' 
                      ? 'bg-purple-900/30 text-purple-300 border-purple-500/30' 
                      : 'bg-cyan-900/30 text-cyan-300 border-cyan-500/30'
                  }`}>
                    <Shield size={12} />
                    {userData.role === 'admin' ? 'Administrator' : 'Member'}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="bg-gray-900/40 rounded-2xl p-5 border border-gray-800">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Tag size={16} /> My Teams
        </h3>
        
        {userData.teams && userData.teams.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {userData.teams.map(team => (
              <span key={team} className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded-lg text-sm border border-gray-700 capitalize">
                {team.replace('-', ' ')}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">You haven't joined any teams yet.</p>
        )}
      </div>

      <button
        onClick={logout}
        className="w-full bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/50 font-medium py-4 rounded-2xl transition-colors flex items-center justify-center gap-2"
      >
        <LogOut size={20} />
        Sign Out
      </button>
    </div>
  );
}
