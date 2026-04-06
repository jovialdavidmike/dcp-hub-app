import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Home, Users, Bell, User as UserIcon, Shield, X, Crown, Folder, Calendar, Bot, Hexagon, Menu } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Layout() {
  const { userData, isAdmin, showMasterAdminWelcome, setShowMasterAdminWelcome } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-[100dvh] bg-black text-white pb-16 pt-safe pl-safe pr-safe">
      {/* Master Admin Welcome Popup */}
      {showMasterAdminWelcome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-gray-900 border border-purple-500/50 rounded-2xl p-6 max-w-sm w-full shadow-[0_0_30px_rgba(168,85,247,0.3)] relative">
            <button 
              onClick={() => setShowMasterAdminWelcome(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="w-16 h-16 bg-purple-900/30 rounded-full flex items-center justify-center mb-4 mx-auto border border-purple-500/50">
              <Crown className="text-purple-400" size={32} />
            </div>
            
            <h2 className="text-2xl font-bold text-center text-white mb-2">Welcome, Lead Administrator</h2>
            <p className="text-gray-300 text-center text-sm leading-relaxed mb-6">
              You have been granted Master Admin privileges. You now have full access to the Admin Dashboard to manage updates, broadcasts, and the community.
            </p>
            
            <button 
              onClick={() => setShowMasterAdminWelcome(false)}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-colors"
            >
              Enter Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-cyan-900/30 p-4 flex justify-between items-center px-safe">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-600/20 border border-cyan-500/30 flex items-center justify-center">
            <Hexagon size={18} className="text-cyan-400" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
            DC Prime Techub
          </h1>
        </div>
        {isAdmin && (
          <span className="px-2 py-1 bg-purple-900/50 text-purple-300 text-xs rounded-full border border-purple-500/30 flex items-center gap-1">
            <Shield size={12} /> Admin
          </span>
        )}
      </header>

      {/* Main Content */}
      <main className="p-6 max-w-lg mx-auto px-safe">
        <Outlet />
      </main>

      {/* Full Screen Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl animate-in slide-in-from-bottom-8 fade-in duration-300 flex flex-col pt-safe pb-safe">
          <div className="flex justify-between items-center p-6 border-b border-gray-800/50">
            <h2 className="text-2xl font-bold text-white">Explore</h2>
            <button 
              onClick={() => setIsMenuOpen(false)}
              className="p-2 bg-gray-900 rounded-full text-gray-400 hover:text-white border border-gray-800 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
          
          <div className="p-6 grid grid-cols-2 gap-4 overflow-y-auto custom-scrollbar content-start flex-1">
            <NavLink 
              to="/vault" 
              onClick={() => setIsMenuOpen(false)} 
              className={({ isActive }) => `p-6 rounded-3xl border flex flex-col items-center justify-center gap-4 transition-all shadow-lg ${isActive ? 'bg-cyan-900/20 border-cyan-500/50 text-cyan-400' : 'bg-gray-900/50 border-gray-800 text-gray-300 hover:bg-gray-800 hover:border-gray-700'}`}
            >
              <Folder size={36} />
              <span className="font-bold text-lg">Vault</span>
            </NavLink>
            
            <NavLink 
              to="/events" 
              onClick={() => setIsMenuOpen(false)} 
              className={({ isActive }) => `p-6 rounded-3xl border flex flex-col items-center justify-center gap-4 transition-all shadow-lg ${isActive ? 'bg-cyan-900/20 border-cyan-500/50 text-cyan-400' : 'bg-gray-900/50 border-gray-800 text-gray-300 hover:bg-gray-800 hover:border-gray-700'}`}
            >
              <Calendar size={36} />
              <span className="font-bold text-lg">Events</span>
            </NavLink>
            
            <NavLink 
              to="/assistant" 
              onClick={() => setIsMenuOpen(false)} 
              className={({ isActive }) => `p-6 rounded-3xl border flex flex-col items-center justify-center gap-4 transition-all shadow-lg ${isActive ? 'bg-purple-900/20 border-purple-500/50 text-purple-400' : 'bg-gray-900/50 border-gray-800 text-gray-300 hover:bg-gray-800 hover:border-gray-700'}`}
            >
              <Bot size={36} />
              <span className="font-bold text-lg">Assistant</span>
            </NavLink>
            
            {isAdmin && (
              <NavLink 
                to="/admin" 
                onClick={() => setIsMenuOpen(false)} 
                className={({ isActive }) => `p-6 rounded-3xl border flex flex-col items-center justify-center gap-4 transition-all shadow-lg ${isActive ? 'bg-purple-900/20 border-purple-500/50 text-purple-400' : 'bg-gray-900/50 border-gray-800 text-gray-300 hover:bg-gray-800 hover:border-gray-700'}`}
              >
                <Shield size={36} />
                <span className="font-bold text-lg">Admin</span>
              </NavLink>
            )}
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-lg border-t border-cyan-900/30 pb-safe z-40 px-safe">
        <div className="flex justify-around items-center p-2 max-w-lg mx-auto">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex flex-col items-center p-2 min-w-[64px] transition-colors ${isActive ? 'text-cyan-400' : 'text-gray-500 hover:text-gray-300'}`
            }
          >
            <Home size={24} />
            <span className="text-[10px] mt-1.5 font-medium">Home</span>
          </NavLink>
          
          <NavLink
            to="/teams"
            className={({ isActive }) =>
              `flex flex-col items-center p-2 min-w-[64px] transition-colors ${isActive ? 'text-cyan-400' : 'text-gray-500 hover:text-gray-300'}`
            }
          >
            <Users size={24} />
            <span className="text-[10px] mt-1.5 font-medium">Teams</span>
          </NavLink>
          
          <NavLink
            to="/updates"
            className={({ isActive }) =>
              `flex flex-col items-center p-2 min-w-[64px] transition-colors ${isActive ? 'text-cyan-400' : 'text-gray-500 hover:text-gray-300'}`
            }
          >
            <Bell size={24} />
            <span className="text-[10px] mt-1.5 font-medium">Updates</span>
          </NavLink>
          
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex flex-col items-center p-2 min-w-[64px] transition-colors ${isActive ? 'text-cyan-400' : 'text-gray-500 hover:text-gray-300'}`
            }
          >
            <UserIcon size={24} />
            <span className="text-[10px] mt-1.5 font-medium">Profile</span>
          </NavLink>

          <button
            onClick={() => setIsMenuOpen(true)}
            className="flex flex-col items-center p-2 min-w-[64px] text-gray-500 hover:text-gray-300 transition-colors"
          >
            <Menu size={24} />
            <span className="text-[10px] mt-1.5 font-medium">Menu</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
