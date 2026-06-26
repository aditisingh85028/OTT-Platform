import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Settings, BarChart2, Users as UsersIcon, Film, Plus, Edit2, Trash2, ShieldAlert, Upload, Sparkles } from 'lucide-react';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics', 'users', 'content'

  // Analytics states
  const [summary, setSummary] = useState(null);
  const [planDistribution, setPlanDistribution] = useState([]);
  const [topContent, setTopContent] = useState([]);
  const [recentTxns, setRecentTxns] = useState([]);

  // Users list states
  const [usersList, setUsersList] = useState([]);

  // Content states
  const [contents, setContents] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingContentId, setEditingContentId] = useState(null);

  // Content form inputs
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contentType, setContentType] = useState('movie');
  const [genres, setGenres] = useState('');
  const [duration, setDuration] = useState('');
  const [releaseYear, setReleaseYear] = useState(new Date().getFullYear());
  const [cast, setCast] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailUrl, setThumbnailUrl] = useState(''); // fallback link if they don't upload file
  
  // Episode helper (Series mode)
  const [episodes, setEpisodes] = useState([]);
  const [epTitle, setEpTitle] = useState('');
  const [epDesc, setEpDesc] = useState('');
  const [epVideoUrl, setEpVideoUrl] = useState('');
  const [epDuration, setEpDuration] = useState('');

  const [savingContent, setSavingContent] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const fetchData = async () => {
    setLoadingData(true);
    try {
      if (activeTab === 'analytics') {
        const res = await api.get('/analytics');
        setSummary(res.data.summary);
        setPlanDistribution(res.data.planDistribution);
        setTopContent(res.data.topContent);
        setRecentTxns(res.data.recentTransactions);
      } else if (activeTab === 'users') {
        const res = await api.get('/analytics/users');
        setUsersList(res.data);
      } else if (activeTab === 'content') {
        const res = await api.get('/content');
        setContents(res.data);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // --- USER OPERATION HANDLERS ---
  const handleUpdateUserRole = async (userId, role) => {
    try {
      await api.put(`/analytics/users/${userId}`, { role });
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating role');
    }
  };

  const handleUpdateUserSubscription = async (userId, planId) => {
    try {
      await api.put(`/analytics/users/${userId}`, { planId });
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating subscription');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user permanently?')) {
      try {
        await api.delete(`/analytics/users/${userId}`);
        await fetchData();
      } catch (err) {
        alert(err.response?.data?.message || 'Error deleting user');
      }
    }
  };

  // --- CONTENT OPERATION HANDLERS ---
  const handleAddEpisode = () => {
    if (!epTitle || !epVideoUrl) {
      alert('Please fill episode title and video URL');
      return;
    }
    const epNum = episodes.length + 1;
    setEpisodes([
      ...episodes,
      {
        episodeNumber: epNum,
        title: epTitle,
        description: epDesc,
        videoUrl: epVideoUrl,
        duration: Number(epDuration) || 0,
      },
    ]);
    // Reset inputs
    setEpTitle('');
    setEpDesc('');
    setEpVideoUrl('');
    setEpDuration('');
  };

  const handleRemoveEpisode = (idx) => {
    setEpisodes(episodes.filter((_, i) => i !== idx).map((ep, i) => ({ ...ep, episodeNumber: i + 1 })));
  };

  const handleSaveContent = async (e) => {
    e.preventDefault();
    setSavingContent(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('type', contentType);
      formData.append('genres', genres);
      formData.append('releaseYear', releaseYear);
      formData.append('cast', cast);
      formData.append('isFeatured', isFeatured);

      if (contentType === 'movie') {
        formData.append('videoUrl', videoUrl);
        formData.append('duration', duration);
      } else {
        const seasonsData = [
          {
            seasonNumber: 1,
            episodes,
          },
        ];
        formData.append('seasons', JSON.stringify(seasonsData));
      }

      if (thumbnailFile) {
        formData.append('thumbnail', thumbnailFile);
      } else if (thumbnailUrl) {
        formData.append('thumbnailUrl', thumbnailUrl);
      } else if (!editingContentId) {
        alert('Please select a thumbnail image file or specify an image URL');
        setSavingContent(false);
        return;
      }

      const headers = {
        'Content-Type': 'multipart/form-data',
      };

      if (editingContentId) {
        await api.put(`/content/${editingContentId}`, formData, { headers });
      } else {
        await api.post('/content', formData, { headers });
      }

      // Reset form
      setShowAddForm(false);
      setEditingContentId(null);
      setTitle('');
      setDescription('');
      setContentType('movie');
      setGenres('');
      setDuration('');
      setReleaseYear(new Date().getFullYear());
      setCast('');
      setVideoUrl('');
      setIsFeatured(false);
      setThumbnailFile(null);
      setThumbnailUrl('');
      setEpisodes([]);

      await fetchData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error saving content');
    } finally {
      setSavingContent(false);
    }
  };

  const handleEditContentClick = (item) => {
    setEditingContentId(item._id);
    setTitle(item.title);
    setDescription(item.description);
    setContentType(item.type);
    setGenres(item.genres.join(', '));
    setReleaseYear(item.releaseYear);
    setCast(item.cast.join(', '));
    setIsFeatured(item.isFeatured);
    
    if (item.type === 'movie') {
      setVideoUrl(item.videoUrl || '');
      setDuration(item.duration || '');
      setEpisodes([]);
    } else {
      setVideoUrl('');
      setDuration('');
      if (item.seasons?.length > 0) {
        setEpisodes(item.seasons[0].episodes || []);
      }
    }
    
    setThumbnailUrl(item.thumbnailUrl);
    setShowAddForm(true);
  };

  const handleDeleteContent = async (contentId) => {
    if (window.confirm('Are you sure you want to remove this video item permanently?')) {
      try {
        await api.delete(`/content/${contentId}`);
        await fetchData();
      } catch (err) {
        alert('Error deleting content');
      }
    }
  };

  return (
    <div className="min-h-screen bg-cosmic-dark pb-20 px-4 sm:px-6 lg:px-8 pt-8">
      <div className="mx-auto max-w-7xl space-y-6">
        
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-white/5 pb-4 space-y-4 sm:space-y-0">
          <h1 className="text-2xl font-bold text-white tracking-wider flex items-center">
            <Settings className="h-6 w-6 text-coral mr-2" /> Admin Dashboard
          </h1>

          {/* Tab Selection */}
          <div className="flex rounded-lg bg-cosmic-card p-1 border border-white/5 text-xs text-silver">
            <button
              onClick={() => { setActiveTab('analytics'); setShowAddForm(false); }}
              className={`flex items-center rounded-md px-4 py-2 font-semibold transition-all ${
                activeTab === 'analytics' ? 'bg-coral text-white' : 'hover:text-white'
              }`}
            >
              <BarChart2 className="h-4 w-4 mr-1.5" /> Analytics Overview
            </button>
            <button
              onClick={() => { setActiveTab('users'); setShowAddForm(false); }}
              className={`flex items-center rounded-md px-4 py-2 font-semibold transition-all ${
                activeTab === 'users' ? 'bg-coral text-white' : 'hover:text-white'
              }`}
            >
              <UsersIcon className="h-4 w-4 mr-1.5" /> User Management
            </button>
            <button
              onClick={() => { setActiveTab('content'); setShowAddForm(false); }}
              className={`flex items-center rounded-md px-4 py-2 font-semibold transition-all ${
                activeTab === 'content' ? 'bg-coral text-white' : 'hover:text-white'
              }`}
            >
              <Film className="h-4 w-4 mr-1.5" /> Content Management
            </button>
          </div>
        </div>

        {/* LOADING STATE */}
        {loadingData && !showAddForm ? (
          <div className="flex justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-t-2 border-coral"></div>
          </div>
        ) : (
          <div>
            
            {/* ============================================================== */}
            {/* ANALYTICS TAB */}
            {/* ============================================================== */}
            {activeTab === 'analytics' && summary && (
              <div className="space-y-8">
                {/* 4 Summary Cards */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
                    <span className="text-[10px] font-bold text-silver uppercase tracking-wider block">Total Members</span>
                    <span className="text-3xl font-extrabold text-white mt-1 block">{summary.totalUsers}</span>
                    <div className="absolute top-2 right-2 h-8 w-8 bg-coral/15 text-coral rounded-full flex items-center justify-center text-xs font-bold">U</div>
                  </div>
                  <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
                    <span className="text-[10px] font-bold text-silver uppercase tracking-wider block">Active Subscribers</span>
                    <span className="text-3xl font-extrabold text-white mt-1 block">{summary.activeSubscribers}</span>
                    <div className="absolute top-2 right-2 h-8 w-8 bg-green-500/15 text-green-400 rounded-full flex items-center justify-center text-xs font-bold">S</div>
                  </div>
                  <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
                    <span className="text-[10px] font-bold text-silver uppercase tracking-wider block">Estimated Revenue</span>
                    <span className="text-3xl font-extrabold text-white mt-1 block">₹{summary.totalRevenue}</span>
                    <div className="absolute top-2 right-2 h-8 w-8 bg-yellow-500/15 text-yellow-400 rounded-full flex items-center justify-center text-xs font-bold">R</div>
                  </div>
                  <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
                    <span className="text-[10px] font-bold text-silver uppercase tracking-wider block">Total Catalog Items</span>
                    <span className="text-3xl font-extrabold text-white mt-1 block">{summary.totalContent}</span>
                    <div className="absolute top-2 right-2 h-8 w-8 bg-electric-violet/15 text-electric-violet rounded-full flex items-center justify-center text-xs font-bold">C</div>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  {/* Plan Distribution List */}
                  <div className="glass-panel rounded-2xl p-6">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2 mb-4">
                      Subscription Plan Breakdown
                    </h3>
                    <div className="space-y-4">
                      {planDistribution.map((dist, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <span className="text-silver font-semibold">{dist.planName}</span>
                          <span className="text-white font-extrabold">{dist.count} active users</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top content by views */}
                  <div className="glass-panel rounded-2xl p-6">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2 mb-4">
                      Top 5 Most Watched Contents
                    </h3>
                    <div className="space-y-3">
                      {topContent.map((item) => (
                        <div key={item._id} className="flex items-center justify-between text-xs">
                          <span className="text-white truncate font-bold">{item.title}</span>
                          <span className="text-coral shrink-0 font-semibold">{item.views} views</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Recent Transactions List */}
                <div className="glass-panel rounded-2xl p-6">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2 mb-4">
                    Recent Subscription Purchases
                  </h3>
                  <div className="overflow-x-auto text-xs text-silver">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-[10px] font-bold text-white uppercase tracking-wider border-b border-white/5">
                          <th className="py-2">User</th>
                          <th className="py-2">Plan</th>
                          <th className="py-2">Amount Paid</th>
                          <th className="py-2">Transaction ID</th>
                          <th className="py-2">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentTxns.map((txn) => (
                          <tr key={txn._id} className="border-b border-white/5 last:border-0">
                            <td className="py-2">{txn.user?.name} ({txn.user?.email})</td>
                            <td className="py-2 font-bold text-white">{txn.plan?.name}</td>
                            <td className="py-2 text-white">₹{txn.amount}</td>
                            <td className="py-2 font-mono">{txn.transactionId}</td>
                            <td className="py-2">{new Date(txn.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* USER MANAGEMENT TAB */}
            {/* ============================================================== */}
            {activeTab === 'users' && (
              <div className="glass-panel rounded-2xl p-6 overflow-x-auto text-xs text-silver">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-bold text-white uppercase tracking-wider border-b border-white/5">
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Active Plan</th>
                      <th className="py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {usersList.map((usr) => (
                      <tr key={usr._id} className="hover:bg-cosmic-light/10 transition-colors">
                        <td className="py-3 px-4 text-white font-bold">{usr.name}</td>
                        <td className="py-3 px-4">{usr.email}</td>
                        <td className="py-3 px-4">
                          <select
                            value={usr.role}
                            onChange={(e) => handleUpdateUserRole(usr._id, e.target.value)}
                            className="bg-cosmic-card text-white py-1 px-2 rounded outline-none border border-white/10"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-white">
                            {usr.subscription?.status === 'active' ? usr.subscription?.plan?.name : 'Free Tier'}
                          </span>
                        </td>
                        <td className="py-3 px-4 space-x-2">
                          <button
                            onClick={() => handleUpdateUserSubscription(usr._id, '666f726d617474696e676964' /* mock dummy / let them choose active */)}
                            className="text-coral hover:underline"
                            title="Mock Change Subscription"
                          >
                            Set VIP
                          </button>
                          {usr.role !== 'admin' && (
                            <button
                              onClick={() => handleDeleteUser(usr._id)}
                              className="text-red-400 hover:text-red-300 ml-3"
                            >
                              <Trash2 className="h-4 w-4 inline" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ============================================================== */}
            {/* CONTENT MANAGEMENT TAB */}
            {/* ============================================================== */}
            {activeTab === 'content' && (
              <div className="space-y-6">
                
                {/* Header button add */}
                {!showAddForm && (
                  <button
                    onClick={() => { setShowAddForm(true); setEditingContentId(null); }}
                    className="flex items-center rounded-lg bg-coral px-4 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-coral-hover transition-all"
                  >
                    <Plus className="h-4 w-4 mr-1.5" /> Add New Video/Series
                  </button>
                )}

                {/* ADD/EDIT FORM */}
                {showAddForm && (
                  <div className="glass-panel rounded-2xl p-6 relative">
                    <button
                      onClick={() => setShowAddForm(false)}
                      className="absolute top-4 right-4 text-xs font-bold text-silver hover:text-white"
                    >
                      Cancel
                    </button>
                    
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2 mb-4">
                      {editingContentId ? 'Edit Content Details' : 'Publish New Content'}
                    </h3>

                    <form onSubmit={handleSaveContent} className="space-y-4 text-xs text-silver">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">Title</label>
                          <input
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Inception"
                            className="w-full rounded-lg py-2 px-3 glass-input"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">Release Year</label>
                          <input
                            type="number"
                            required
                            value={releaseYear}
                            onChange={(e) => setReleaseYear(Number(e.target.value))}
                            className="w-full rounded-lg py-2 px-3 glass-input"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">Description</label>
                        <textarea
                          required
                          rows="3"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Provide movie summary synopsis..."
                          className="w-full rounded-lg py-2 px-3 glass-input"
                        ></textarea>
                      </div>

                      <div className="grid gap-4 md:grid-cols-3">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">Content Type</label>
                          <select
                            value={contentType}
                            onChange={(e) => setContentType(e.target.value)}
                            className="w-full rounded-lg py-2 px-3 glass-input outline-none"
                          >
                            <option value="movie">Movie</option>
                            <option value="series">Web Series</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">Genres (comma separated)</label>
                          <input
                            type="text"
                            required
                            value={genres}
                            onChange={(e) => setGenres(e.target.value)}
                            placeholder="Action, Sci-Fi, Thriller"
                            className="w-full rounded-lg py-2 px-3 glass-input"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">Featured</label>
                          <div className="flex items-center mt-2.5">
                            <input
                              type="checkbox"
                              checked={isFeatured}
                              onChange={(e) => setIsFeatured(e.target.checked)}
                              className="h-4 w-4 rounded border-white/10 bg-cosmic-card text-coral accent-coral"
                            />
                            <span className="ml-2 font-semibold text-white">Show on Hero Carousel</span>
                          </div>
                        </div>
                      </div>

                      {/* Cover Thumbnail Image File Upload to Cloudinary */}
                      <div className="border border-white/5 bg-cosmic-darker/30 p-4 rounded-xl space-y-4">
                        <h4 className="font-bold text-white flex items-center">
                          <Upload className="h-4 w-4 text-coral mr-1.5" /> Thumbnail Cover Image
                        </h4>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <label className="block text-[9px] font-bold uppercase tracking-wider mb-1">Upload File (Cloudinary)</label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => setThumbnailFile(e.target.files[0])}
                              className="text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold uppercase tracking-wider mb-1">Fallback Image URL</label>
                            <input
                              type="text"
                              value={thumbnailUrl}
                              onChange={(e) => setThumbnailUrl(e.target.value)}
                              placeholder="Or paste direct image https://..."
                              className="w-full rounded-lg py-2 px-3 glass-input"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Cast */}
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">Cast Members (comma separated)</label>
                        <input
                          type="text"
                          value={cast}
                          onChange={(e) => setCast(e.target.value)}
                          placeholder="Leonardo DiCaprio, Elliot Page, Tom Hardy"
                          className="w-full rounded-lg py-2 px-3 glass-input"
                        />
                      </div>

                      {/* MOVIE SPECIFIC CONFIGS */}
                      {contentType === 'movie' ? (
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">Duration (minutes)</label>
                            <input
                              type="number"
                              required={contentType === 'movie'}
                              value={duration}
                              onChange={(e) => setDuration(e.target.value)}
                              className="w-full rounded-lg py-2 px-3 glass-input"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">Movie Stream Video URL</label>
                            <input
                              type="text"
                              required={contentType === 'movie'}
                              value={videoUrl}
                              onChange={(e) => setVideoUrl(e.target.value)}
                              placeholder="https://...mp4 or youtube.com link"
                              className="w-full rounded-lg py-2 px-3 glass-input"
                            />
                          </div>
                        </div>
                      ) : (
                        // SERIES MODE: DYNAMIC EPISODES INSERTER
                        <div className="border border-white/5 bg-cosmic-darker/20 p-4 rounded-xl space-y-4">
                          <h4 className="font-bold text-white">Episodes Setup (Season 1)</h4>
                          
                          {/* Saved episodes preview */}
                          {episodes.length > 0 && (
                            <div className="space-y-2 border-b border-white/5 pb-4">
                              {episodes.map((ep, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-cosmic-light/40 p-2 rounded border border-white/5 text-xs text-white">
                                  <span>{ep.episodeNumber}. {ep.title} ({ep.duration} mins)</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveEpisode(idx)}
                                    className="text-red-400 hover:text-red-300"
                                  >
                                    Remove
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Inputs to append new episode */}
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                              <label className="block text-[9px] font-bold uppercase tracking-wider mb-1">Episode Title</label>
                              <input
                                type="text"
                                value={epTitle}
                                onChange={(e) => setEpTitle(e.target.value)}
                                className="w-full rounded-lg py-2 px-3 glass-input"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold uppercase tracking-wider mb-1">Duration (minutes)</label>
                              <input
                                type="number"
                                value={epDuration}
                                onChange={(e) => setEpDuration(e.target.value)}
                                className="w-full rounded-lg py-2 px-3 glass-input"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold uppercase tracking-wider mb-1">Video Stream URL</label>
                            <input
                              type="text"
                              value={epVideoUrl}
                              onChange={(e) => setEpVideoUrl(e.target.value)}
                              placeholder="https://...mp4 or youtube.com link"
                              className="w-full rounded-lg py-2 px-3 glass-input"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold uppercase tracking-wider mb-1">Brief Description</label>
                            <input
                              type="text"
                              value={epDesc}
                              onChange={(e) => setEpDesc(e.target.value)}
                              className="w-full rounded-lg py-2 px-3 glass-input"
                            />
                          </div>
                          
                          <button
                            type="button"
                            onClick={handleAddEpisode}
                            className="rounded bg-cosmic-plum hover:bg-cosmic-light text-white px-3 py-1.5 text-xs font-semibold border border-white/10"
                          >
                            + Add Episode to List
                          </button>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={savingContent}
                        className="rounded-lg bg-coral px-6 py-2.5 text-xs font-bold text-white transition-all hover:bg-coral-hover disabled:opacity-50"
                      >
                        {savingContent ? 'Uploading Assets & Saving...' : 'Save Catalog Item'}
                      </button>
                    </form>
                  </div>
                )}

                {/* CONTENT LIST TABLE */}
                {!showAddForm && (
                  <div className="glass-panel rounded-2xl p-6 overflow-x-auto text-xs text-silver">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-[10px] font-bold text-white uppercase tracking-wider border-b border-white/5">
                          <th className="py-3 px-4">Cover</th>
                          <th className="py-3 px-4">Title</th>
                          <th className="py-3 px-4">Type</th>
                          <th className="py-3 px-4">Year</th>
                          <th className="py-3 px-4">Views</th>
                          <th className="py-3 px-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {contents.map((item) => (
                          <tr key={item._id} className="hover:bg-cosmic-light/10 transition-colors">
                            <td className="py-3 px-4">
                              <img src={item.thumbnailUrl} alt={item.title} className="h-9 w-16 object-cover rounded-md border border-white/5" />
                            </td>
                            <td className="py-3 px-4 text-white font-bold">{item.title}</td>
                            <td className="py-3 px-4 capitalize">{item.type}</td>
                            <td className="py-3 px-4">{item.releaseYear}</td>
                            <td className="py-3 px-4">{item.views}</td>
                            <td className="py-3 px-4 space-x-3">
                              <button
                                onClick={() => handleEditContentClick(item)}
                                className="text-blue-400 hover:text-blue-300"
                              >
                                <Edit2 className="h-4 w-4 inline" />
                              </button>
                              <button
                                onClick={() => handleDeleteContent(item._id)}
                                className="text-red-400 hover:text-red-300"
                              >
                                <Trash2 className="h-4 w-4 inline" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
