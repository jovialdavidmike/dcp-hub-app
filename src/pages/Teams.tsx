import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { Code, Smartphone, Cpu, Users, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TEAMS = [
  { id: 'creative-tech', name: 'Creative Technology', icon: Code, color: 'text-pink-400', bg: 'bg-pink-400/10', border: 'border-pink-400/30' },
  { id: 'digital-product', name: 'Digital Product', icon: Smartphone, color: 'text-cyan-400', bg: 'bg-cyan-400/10', border: 'border-cyan-400/30' },
  { id: 'robotics', name: 'Robotics', icon: Cpu, color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/30' },
  { id: 'core-leaders', name: 'Core Leaders', icon: Users, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/30' },
];

export default function Teams() {
  const { user, userData } = useAuth();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const navigate = useNavigate();

  const toggleTeam = async (teamId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !userData) return;
    setLoadingId(teamId);
    
    const userRef = doc(db, 'users', user.uid);
    const isMember = userData.teams?.includes(teamId);

    try {
      if (isMember) {
        await updateDoc(userRef, {
          teams: arrayRemove(teamId)
        });
      } else {
        await updateDoc(userRef, {
          teams: arrayUnion(teamId)
        });
      }
    } catch (error) {
      console.error("Error updating team", error);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white tracking-tight">Hub Teams</h2>
        <p className="text-gray-400 text-base mt-2">Join specialized teams to collaborate and learn.</p>
      </div>

      <div className="grid gap-5">
        {TEAMS.map((team) => {
          const Icon = team.icon;
          const isMember = userData?.teams?.includes(team.id);
          
          return (
            <div 
              key={team.id} 
              onClick={() => isMember && navigate(`/chat/${team.id}`)}
              className={`p-5 rounded-3xl border ${team.border} bg-gray-900/50 flex items-center justify-between transition-all shadow-sm ${isMember ? 'ring-1 ring-white/20 cursor-pointer hover:bg-gray-800/50' : ''}`}
            >
              <div className="flex items-center gap-5">
                <div className={`w-14 h-14 rounded-2xl ${team.bg} flex items-center justify-center`}>
                  <Icon className={team.color} size={28} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">{team.name}</h3>
                  <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
                    {isMember ? <><MessageSquare size={14} className="text-cyan-400" /> Tap to open chat</> : 'Tap Join to access chat'}
                  </p>
                </div>
              </div>
              
              <button
                onClick={(e) => toggleTeam(team.id, e)}
                disabled={loadingId === team.id}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                  isMember 
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                    : 'bg-cyan-600/20 text-cyan-400 hover:bg-cyan-600/30 border border-cyan-500/30'
                }`}
              >
                {loadingId === team.id ? '...' : isMember ? 'Leave' : 'Join'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Platform Credits */}
      <div className="mt-12 pt-8 border-t border-gray-800/50">
        <h3 className="text-xl font-bold text-white mb-6">Platform Leadership</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="bg-gray-900/40 p-6 rounded-3xl border border-gray-800 flex flex-col items-center text-center shadow-sm">
            <div className="w-16 h-16 rounded-full bg-cyan-900/30 border border-cyan-500/30 flex items-center justify-center mb-3">
              <span className="text-cyan-400 font-bold text-2xl">E</span>
            </div>
            <p className="text-white font-bold text-lg">Eli</p>
            <p className="text-sm text-cyan-400 mt-1">Community Founder</p>
          </div>
          <div className="bg-gray-900/40 p-6 rounded-3xl border border-gray-800 flex flex-col items-center text-center shadow-sm">
            <div className="w-16 h-16 rounded-full bg-purple-900/30 border border-purple-500/30 flex items-center justify-center mb-3">
              <span className="text-purple-400 font-bold text-2xl">DM</span>
            </div>
            <p className="text-white font-bold text-lg">David Mike</p>
            <p className="text-sm text-purple-400 mt-1">Lead Developer & Architect</p>
          </div>
        </div>
      </div>
    </div>
  );
}
