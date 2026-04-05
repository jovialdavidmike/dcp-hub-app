import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, storage } from '../firebase';
import { collection, addDoc, query, getDocs, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { FileText, Link as LinkIcon, Download, ExternalLink, Plus, Loader2, Trash2, Folder, File } from 'lucide-react';

interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  type: 'file' | 'link';
  url: string;
  fileName?: string;
  createdAt: string;
}

const CATEGORIES = ['robotics', 'ai', 'cybersecurity', 'web-dev', 'general'];

export default function Vault() {
  const { isSuperAdmin } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Upload Form State
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [type, setType] = useState<'file' | 'link'>('file');
  const [linkUrl, setLinkUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'vault'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setResources(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Resource[]);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    if (type === 'file' && !file) return;
    if (type === 'link' && !linkUrl.trim()) return;

    setUploading(true);
    try {
      let url = linkUrl;
      let fileName = '';

      if (type === 'file' && file) {
        const storageRef = ref(storage, `vault/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        url = await getDownloadURL(storageRef);
        fileName = file.name;
      }

      await addDoc(collection(db, 'vault'), {
        title,
        description,
        category,
        type,
        url,
        fileName: type === 'file' ? fileName : null,
        createdAt: new Date().toISOString()
      });

      setTitle('');
      setDescription('');
      setCategory('general');
      setType('file');
      setLinkUrl('');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setShowUploadForm(false);
    } catch (error) {
      console.error("Error uploading resource:", error);
      alert("Failed to upload resource.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!isSuperAdmin || !window.confirm('Are you sure you want to delete this resource?')) return;
    try {
      await deleteDoc(doc(db, 'vault', id));
    } catch (error) {
      console.error("Error deleting resource:", error);
    }
  };

  const filteredResources = selectedCategory === 'all' 
    ? resources 
    : resources.filter(r => r.category === selectedCategory);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Folder className="text-cyan-400" /> The Vault
          </h2>
          <p className="text-gray-400 text-sm mt-1">Resource Library & Assets</p>
        </div>
        {isSuperAdmin && (
          <button
            onClick={() => setShowUploadForm(!showUploadForm)}
            className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Plus size={16} /> Add Resource
          </button>
        )}
      </div>

      {isSuperAdmin && showUploadForm && (
        <div className="bg-gray-900/60 p-5 rounded-2xl border border-cyan-900/50 mb-6 animate-in fade-in slide-in-from-top-4">
          <h3 className="text-lg font-bold text-white mb-4">Upload New Resource</h3>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-black border border-gray-800 rounded-xl p-2.5 text-white text-sm focus:border-cyan-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-black border border-gray-800 rounded-xl p-2.5 text-white text-sm focus:border-cyan-500 focus:outline-none capitalize"
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c.replace('-', ' ')}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-black border border-gray-800 rounded-xl p-2.5 text-white text-sm focus:border-cyan-500 focus:outline-none resize-none h-20"
                required
              />
            </div>

            <div className="flex gap-4 mb-2">
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input
                  type="radio"
                  checked={type === 'file'}
                  onChange={() => setType('file')}
                  className="text-cyan-500 focus:ring-cyan-500 bg-black border-gray-700"
                />
                Upload File (PDF, Doc, etc.)
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input
                  type="radio"
                  checked={type === 'link'}
                  onChange={() => setType('link')}
                  className="text-cyan-500 focus:ring-cyan-500 bg-black border-gray-700"
                />
                External Link (Figma, GitHub)
              </label>
            </div>

            {type === 'file' ? (
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-900/30 file:text-cyan-400 hover:file:bg-cyan-900/50"
                  required
                />
              </div>
            ) : (
              <div>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-black border border-gray-800 rounded-xl p-2.5 text-white text-sm focus:border-cyan-500 focus:outline-none"
                  required
                />
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={uploading}
                className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {uploading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                {uploading ? 'Uploading...' : 'Save Resource'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Category Filter */}
      <div className="flex overflow-x-auto gap-2 pb-2 custom-scrollbar">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
            selectedCategory === 'all' ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          All Resources
        </button>
        {CATEGORIES.map(c => (
          <button
            key={c}
            onClick={() => setSelectedCategory(c)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap capitalize transition-colors ${
              selectedCategory === c ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {c.replace('-', ' ')}
          </button>
        ))}
      </div>

      {/* Vault Grid */}
      {loading ? (
        <div className="text-center py-10 text-gray-500">Loading vault...</div>
      ) : filteredResources.length === 0 ? (
        <div className="text-center py-10 text-gray-500 bg-gray-900/30 rounded-xl border border-gray-800">
          No resources found in this category.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResources.map(resource => (
            <div key={resource.id} className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5 flex flex-col hover:border-cyan-900/50 transition-colors group">
              <div className="flex justify-between items-start mb-3">
                <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                  {resource.type === 'file' ? <FileText size={20} /> : <LinkIcon size={20} />}
                </div>
                {isSuperAdmin && (
                  <button onClick={() => handleDelete(resource.id)} className="text-gray-600 hover:text-red-400 transition-colors">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              
              <h3 className="text-white font-bold text-lg mb-1 line-clamp-1">{resource.title}</h3>
              <p className="text-gray-400 text-xs mb-4 line-clamp-2 flex-1">{resource.description}</p>
              
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-800/50">
                <span className="text-[10px] px-2 py-1 bg-gray-800 text-gray-400 rounded capitalize">
                  {resource.category.replace('-', ' ')}
                </span>
                
                <a 
                  href={resource.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  {resource.type === 'file' ? (
                    <><Download size={14} /> Download</>
                  ) : (
                    <><ExternalLink size={14} /> Open Link</>
                  )}
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
