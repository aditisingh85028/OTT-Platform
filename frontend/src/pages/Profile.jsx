import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { User, Lock, Award, History, CheckCircle, HelpCircle, Save } from 'lucide-react';
import { Link } from 'react-router-dom';

const Profile = () => {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name);
      
      const fetchTransactions = async () => {
        try {
          const res = await api.get('/plans/transactions');
          setTransactions(res.data);
        } catch (err) {
          console.error('Error fetching billing history:', err);
        }
      };
      
      fetchTransactions();
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (password && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setUpdating(true);
    try {
      const payload = { name };
      if (password) payload.password = password;

      await api.put('/auth/profile', payload);
      setMessage('Profile updated successfully!');
      setPassword('');
      setConfirmPassword('');
      await refreshUser();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  if (!user) return null;

  const subscriptionActive = user.subscription?.status === 'active';
  const planName = user.subscription?.plan?.name || 'Free Tier';

  return (
    <div className="min-h-screen bg-cosmic-dark pb-20 px-4 sm:px-6 lg:px-8 pt-8">
      <div className="mx-auto max-w-5xl space-y-8">
        
        <h1 className="text-2xl font-bold text-white tracking-wider flex items-center">
          <User className="h-6 w-6 text-coral mr-2" /> Account Configuration
        </h1>

        <div className="grid gap-8 md:grid-cols-3">
          
          {/* 1. Profile Info & Update Form */}
          <div className="md:col-span-2 glass-panel rounded-2xl p-6 space-y-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2">
              Update Profile Details
            </h3>

            {message && <div className="rounded-lg bg-green-950/20 border border-green-500/20 p-3 text-xs text-green-400">{message}</div>}
            {error && <div className="rounded-lg bg-red-950/20 border border-red-500/20 p-3 text-xs text-red-400">{error}</div>}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-silver uppercase tracking-wider mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg py-2 px-3 text-xs glass-input"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-silver uppercase tracking-wider mb-1">Email Address</label>
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="w-full rounded-lg py-2 px-3 text-xs glass-input opacity-50 cursor-not-allowed"
                />
                <span className="text-[9px] text-silver/60 mt-1 block">Email address cannot be changed</span>
              </div>

              <div className="border-t border-white/5 pt-4">
                <h4 className="text-xs font-bold text-white mb-3 flex items-center">
                  <Lock className="h-3.5 w-3.5 mr-1.5 text-coral" /> Change Password
                </h4>
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-[10px] font-bold text-silver uppercase tracking-wider mb-1">New Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-lg py-2 px-3 text-xs glass-input"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-silver uppercase tracking-wider mb-1">Confirm Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-lg py-2 px-3 text-xs glass-input"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={updating}
                className="flex items-center rounded-lg bg-coral px-4 py-2 text-xs font-bold text-white transition-all hover:bg-coral-hover disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5 mr-1.5" /> Save Changes
              </button>
            </form>
          </div>

          {/* 2. Subscription Status Panel */}
          <div className="glass-panel rounded-2xl p-6 h-fit space-y-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2">
              Streaming Plan
            </h3>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Award className="h-8 w-8 text-coral animate-pulse" />
                <div>
                  <h4 className="text-sm font-bold text-white">{planName}</h4>
                  <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold ${
                    subscriptionActive ? 'bg-green-950/45 text-green-400 border border-green-500/20' : 'bg-red-950/45 text-red-400 border border-red-500/20'
                  }`}>
                    {subscriptionActive ? 'Active Subscription' : 'No Active Plan'}
                  </span>
                </div>
              </div>

              {subscriptionActive && user.subscription.endDate && (
                <div className="text-[11px] text-silver space-y-1 pt-2 border-t border-white/5">
                  <p>Started: {new Date(user.subscription.startDate).toLocaleDateString()}</p>
                  <p>Renews/Expires: {new Date(user.subscription.endDate).toLocaleDateString()}</p>
                </div>
              )}

              <Link
                to="/plans"
                className="block w-full rounded-xl bg-coral py-2.5 text-center text-xs font-bold text-white transition-all hover:bg-coral-hover shadow-md shadow-coral/15"
              >
                {subscriptionActive ? 'Upgrade / Renew' : 'Unlock Premium'}
              </Link>
            </div>
          </div>
        </div>

        {/* 3. Transaction History */}
        <div className="glass-panel rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2 mb-4 flex items-center">
            <History className="h-4 w-4 text-coral mr-2" /> Billing & Payment History
          </h3>

          <div className="overflow-x-auto">
            {transactions.length === 0 ? (
              <p className="text-xs text-silver py-6 text-center">No payment history found.</p>
            ) : (
              <table className="w-full text-left text-xs text-silver">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] font-bold text-white uppercase tracking-wider">
                    <th className="py-3 px-4">Transaction ID</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Plan Name</th>
                    <th className="py-3 px-4">Price Paid</th>
                    <th className="py-3 px-4">Payment</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {transactions.map((txn) => (
                    <tr key={txn._id} className="hover:bg-cosmic-light/20 transition-colors">
                      <td className="py-3 px-4 font-mono text-white text-[11px]">{txn.transactionId}</td>
                      <td className="py-3 px-4">{new Date(txn.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 px-4 font-bold text-white">{txn.plan?.name || 'Deleted Plan'}</td>
                      <td className="py-3 px-4">₹{txn.amount}</td>
                      <td className="py-3 px-4 capitalize">{txn.paymentMethod.replace('_', ' ')}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center rounded-full bg-green-950/20 px-2 py-0.5 text-[10px] font-semibold text-green-400 border border-green-500/10">
                          <CheckCircle className="h-3 w-3 mr-1" /> Successful
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;
