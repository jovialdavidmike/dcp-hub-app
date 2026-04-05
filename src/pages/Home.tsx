import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Play } from 'lucide-react';

interface Update {
  id: string;
  content: string;
  authorName: string;
  createdAt: string;
}

interface Ad {
  id: string;
  title: string;
  imageUrl: string;
  link: string;
}

export default function Home() {
  const [updates, setUpdates] = useState<Update[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);

  useEffect(() => {
    const updatesQuery = query(
      collection(db, 'updates'),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubscribeUpdates = onSnapshot(updatesQuery, (snapshot) => {
      const newUpdates = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Update[];
      setUpdates(newUpdates);
    });

    const adsQuery = query(
      collection(db, 'ads'),
      orderBy('createdAt', 'desc'),
      limit(2)
    );

    const unsubscribeAds = onSnapshot(adsQuery, (snapshot) => {
      const newAds = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Ad[];
      setAds(newAds.filter(ad => (ad as any).active !== false));
    });

    return () => {
      unsubscribeUpdates();
      unsubscribeAds();
    };
  }, []);

  return (
    <div className="space-y-6 pb-8">
      {/* Getting Started Video */}
      <section className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 relative group cursor-pointer">
        <div className="aspect-video bg-black relative">
          <img 
            src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800" 
            alt="Hub Intro" 
            className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-cyan-500/50 group-hover:scale-110 transition-transform">
              <Play className="text-cyan-400 ml-1" size={32} />
            </div>
          </div>
        </div>
        <div className="p-4">
          <h2 className="text-lg font-bold text-white">Welcome to DC Prime</h2>
          <p className="text-sm text-gray-400">Watch the getting started guide</p>
        </div>
      </section>

      {/* Sponsored Ads */}
      {ads.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Sponsored</h3>
          <div className="grid gap-3">
            {ads.map(ad => (
              <a key={ad.id} href={ad.link} target="_blank" rel="noopener noreferrer" className="block relative h-24 rounded-xl overflow-hidden border border-purple-900/50">
                <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-3">
                  <span className="text-sm font-medium text-white">{ad.title}</span>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Recent Updates */}
      <section className="space-y-3">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Latest Updates</h3>
        <div className="space-y-3">
          {updates.map(update => (
            <div key={update.id} className="bg-gray-900/50 p-4 rounded-xl border border-gray-800">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-medium text-cyan-400">{update.authorName || 'Admin'}</span>
                <span className="text-xs text-gray-500">
                  {new Date(update.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-gray-300 text-sm whitespace-pre-wrap">{update.content}</p>
            </div>
          ))}
          {updates.length === 0 && (
            <div className="text-center py-8 text-gray-500 text-sm">
              No updates yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
