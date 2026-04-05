import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, addDoc, deleteDoc } from 'firebase/firestore';
import { Calendar as CalendarIcon, MapPin, Clock, Users, Plus, Trash2, Check, ExternalLink } from 'lucide-react';

interface HubEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  mapsLink: string;
  rsvps: string[];
  createdAt: string;
}

export default function Events() {
  const { user, isSuperAdmin } = useAuth();
  const [events, setEvents] = useState<HubEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State
  const [title, setTitle] = useState('Next Physical Meeting');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('10:00');
  const [location, setLocation] = useState('Abuja Landmark');
  const [mapsLink, setMapsLink] = useState('https://maps.google.com');

  useEffect(() => {
    const q = query(collection(db, 'events'), orderBy('date', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as HubEvent[]);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !time || !location) return;

    try {
      await addDoc(collection(db, 'events'), {
        title,
        date,
        time,
        location,
        mapsLink,
        rsvps: [],
        createdAt: new Date().toISOString()
      });
      setShowAddForm(false);
    } catch (error) {
      console.error("Error adding event:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this event?')) return;
    try {
      await deleteDoc(doc(db, 'events', id));
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  const toggleRSVP = async (event: HubEvent) => {
    if (!user) return;
    const eventRef = doc(db, 'events', event.id);
    const hasRSVPd = event.rsvps?.includes(user.uid);

    try {
      if (hasRSVPd) {
        await updateDoc(eventRef, { rsvps: arrayRemove(user.uid) });
      } else {
        await updateDoc(eventRef, { rsvps: arrayUnion(user.uid) });
      }
    } catch (error) {
      console.error("Error toggling RSVP:", error);
    }
  };

  // Neon Clock Countdown Component
  const Countdown = ({ targetDate, targetTime }: { targetDate: string, targetTime: string }) => {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
      const target = new Date(`${targetDate}T${targetTime}`).getTime();

      const interval = setInterval(() => {
        const now = new Date().getTime();
        const distance = target - now;

        if (distance < 0) {
          clearInterval(interval);
          setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
          return;
        }

        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
      }, 1000);

      return () => clearInterval(interval);
    }, [targetDate, targetTime]);

    return (
      <div className="flex justify-center gap-4 my-6">
        {[
          { label: 'DAYS', value: timeLeft.days },
          { label: 'HOURS', value: timeLeft.hours },
          { label: 'MINS', value: timeLeft.minutes },
          { label: 'SECS', value: timeLeft.seconds }
        ].map((item, idx) => (
          <div key={idx} className="flex flex-col items-center">
            <div className="w-14 h-16 bg-black border border-cyan-500/50 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.3)] relative overflow-hidden">
              <div className="absolute inset-0 bg-cyan-500/10"></div>
              <span className="text-2xl font-mono font-bold text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] relative z-10">
                {item.value.toString().padStart(2, '0')}
              </span>
            </div>
            <span className="text-[10px] font-bold text-cyan-500/70 mt-2 tracking-widest">{item.label}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <CalendarIcon className="text-cyan-400" /> Hub Calendar
          </h2>
          <p className="text-gray-400 text-sm mt-1">Upcoming Events & Meetings</p>
        </div>
        {isSuperAdmin && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Plus size={16} /> Add Event
          </button>
        )}
      </div>

      {isSuperAdmin && showAddForm && (
        <div className="bg-gray-900/60 p-5 rounded-2xl border border-cyan-900/50 mb-6 animate-in fade-in slide-in-from-top-4">
          <h3 className="text-lg font-bold text-white mb-4">Create New Event</h3>
          <form onSubmit={handleAddEvent} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Event Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-black border border-gray-800 rounded-xl p-2.5 text-white text-sm focus:border-cyan-500 focus:outline-none"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-black border border-gray-800 rounded-xl p-2.5 text-white text-sm focus:border-cyan-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Time</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-black border border-gray-800 rounded-xl p-2.5 text-white text-sm focus:border-cyan-500 focus:outline-none"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-black border border-gray-800 rounded-xl p-2.5 text-white text-sm focus:border-cyan-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Google Maps Link</label>
              <input
                type="url"
                value={mapsLink}
                onChange={(e) => setMapsLink(e.target.value)}
                className="w-full bg-black border border-gray-800 rounded-xl p-2.5 text-white text-sm focus:border-cyan-500 focus:outline-none"
                required
              />
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                Save Event
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-10 text-gray-500">Loading calendar...</div>
      ) : events.length === 0 ? (
        <div className="text-center py-10 text-gray-500 bg-gray-900/30 rounded-xl border border-gray-800">
          No upcoming events.
        </div>
      ) : (
        <div className="space-y-6">
          {events.map((event, index) => {
            const hasRSVPd = user ? (event.rsvps || []).includes(user.uid) : false;
            const isNextEvent = index === 0;

            return (
              <div key={event.id} className={`bg-gray-900/40 border rounded-2xl p-6 relative overflow-hidden ${isNextEvent ? 'border-cyan-500/50 shadow-[0_0_20px_rgba(34,211,238,0.15)]' : 'border-gray-800'}`}>
                {isNextEvent && (
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-purple-500"></div>
                )}
                
                <div className="flex justify-between items-start mb-4">
                  <div>
                    {isNextEvent && (
                      <span className="inline-block px-2 py-1 bg-cyan-900/40 text-cyan-400 text-[10px] font-bold rounded uppercase tracking-wider mb-2 border border-cyan-500/30">
                        Next Event
                      </span>
                    )}
                    <h3 className="text-xl font-bold text-white">{event.title}</h3>
                  </div>
                  {isSuperAdmin && (
                    <button onClick={() => handleDelete(event.id)} className="text-gray-600 hover:text-red-400 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>

                {isNextEvent && <Countdown targetDate={event.date} targetTime={event.time} />}

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-gray-300">
                    <div className="w-8 h-8 rounded-full bg-purple-900/30 flex items-center justify-center text-purple-400 border border-purple-500/30">
                      <CalendarIcon size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-gray-300">
                    <div className="w-8 h-8 rounded-full bg-cyan-900/30 flex items-center justify-center text-cyan-400 border border-cyan-500/30">
                      <Clock size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{event.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-gray-300">
                    <div className="w-8 h-8 rounded-full bg-pink-900/30 flex items-center justify-center text-pink-400 border border-pink-500/30">
                      <MapPin size={16} />
                    </div>
                    <div className="flex-1 flex justify-between items-center">
                      <p className="text-sm font-medium">{event.location}</p>
                      <a href={event.mapsLink} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                        View Map <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-800/50">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Users size={16} />
                    <span className="text-sm font-medium">
                      {(event.rsvps || []).length} {isSuperAdmin ? 'Attending' : 'Going'}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => toggleRSVP(event)}
                    className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                      hasRSVPd 
                        ? 'bg-purple-900/40 text-purple-300 border border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.3)]' 
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                    }`}
                  >
                    {hasRSVPd ? <><Check size={16} /> RSVP'd</> : 'Join Meeting'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
