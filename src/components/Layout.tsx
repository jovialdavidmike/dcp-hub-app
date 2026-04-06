import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Home, Users, Bell, User as UserIcon, Shield, X, Crown, Folder, Calendar, Bot } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Layout() {
  const { userData, isAdmin, showMasterAdminWelcome, setShowMasterAdminWelcome } = useAuth();

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
        <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
          DC Prime Techub
        </h1>
        {isAdmin && (
          <span className="px-2 py-1 bg-purple-900/50 text-purple-300 text-xs rounded-full border border-purple-500/30 flex items-center gap-1">
            <Shield size={12} /> Admin
          </span>
        )}
      </header>

      {/* Main Content */}
      <main className="p-4 max-w-md mx-auto px-safe">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-cyan-900/30 pb-safe z-40 px-safe">
        <div className="flex justify-around items-center p-2 max-w-md mx-auto overflow-x-auto hide-scrollbar">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex flex-col items-center p-2 min-w-[48px] ${isActive ? 'text-cyan-400' : 'text-gray-500 hover:text-gray-300'}`
            }
          >
            <Home size={20} />
            <span className="text-[10px] mt-1">Home</span>
          </NavLink>
          <NavLink
            to="/teams"
            className={({ isActive }) =>
              `flex flex-col items-center p-2 min-w-[48px] ${isActive ? 'text-cyan-400' : 'text-gray-500 hover:text-gray-300'}`
            }
          >
            <Users size={20} />
            <span className="text-[10px] mt-1">Teams</span>
          </NavLink>
          <NavLink
            to="/updates"
            className={({ isActive }) =>
              `flex flex-col items-center p-2 min-w-[48px] ${isActive ? 'text-cyan-400' : 'text-gray-500 hover:text-gray-300'}`
            }
          >
            <Bell size={20} />
            <span className="text-[10px] mt-1">Updates</span>
          </NavLink>
          <NavLink
            to="/vault"
            className={({ isActive }) =>
              `flex flex-col items-center p-2 min-w-[48px] ${isActive ? 'text-cyan-400' : 'text-gray-500 hover:text-gray-300'}`
            }
          >
            <Folder size={20} />
            <span className="text-[10px] mt-1">Vault</span>
          </NavLink>
          <NavLink
            to="/events"
            className={({ isActive }) =>
              `flex flex-col items-center p-2 min-w-[48px] ${isActive ? 'text-cyan-400' : 'text-gray-500 hover:text-gray-300'}`
            }
          >
            <Calendar size={20} />
            <span className="text-[10px] mt-1">Events</span>
          </NavLink>
          <NavLink
            to="/assistant"
            className={({ isActive }) =>
              `flex flex-col items-center p-2 min-w-[48px] ${isActive ? 'text-purple-400' : 'text-gray-500 hover:text-purple-300'}`
            }
          >
            <Bot size={20} />
            <span className="text-[10px] mt-1">Assistant</span>
          </NavLink>
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex flex-col items-center p-2 min-w-[48px] ${isActive ? 'text-cyan-400' : 'text-gray-500 hover:text-gray-300'}`
            }
          >
            <UserIcon size={20} />
            <span className="text-[10px] mt-1">Profile</span>
          </NavLink>
          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `flex flex-col items-center p-2 min-w-[48px] ${isActive ? 'text-purple-400' : 'text-gray-500 hover:text-gray-300'}`
              }
            >
              <Shield size={20} />
              <span className="text-[10px] mt-1">Admin</span>
            </NavLink>
          )}
        </div>
      </nav>
    </div>
  );
}
