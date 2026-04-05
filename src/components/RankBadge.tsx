import React from 'react';
import { Shield, Star, Zap, Crown } from 'lucide-react';

interface RankBadgeProps {
  rank: string;
}

export default function RankBadge({ rank }: RankBadgeProps) {
  if (rank === 'The Pioneer') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-900/40 text-yellow-300 border border-yellow-500/50 shadow-[0_0_10px_rgba(234,179,8,0.5)]">
        <Crown size={12} className="fill-current" />
        The Pioneer
      </span>
    );
  }

  switch (rank) {
    case 'Tech Legend':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-900/40 text-purple-300 border border-purple-500/50">
          <Star size={12} className="fill-current" />
          Tech Legend
        </span>
      );
    case 'Hub Master':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-900/40 text-cyan-300 border border-cyan-500/50">
          <Shield size={12} className="fill-current" />
          Hub Master
        </span>
      );
    case 'Tech Specialist':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-900/40 text-blue-300 border border-blue-500/50">
          <Zap size={12} className="fill-current" />
          Tech Specialist
        </span>
      );
    case 'Tech Apprentice':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-800 text-gray-400 border border-gray-700">
          Tech Apprentice
        </span>
      );
  }
}
