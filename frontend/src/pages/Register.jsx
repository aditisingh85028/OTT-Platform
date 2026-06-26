import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, AlertCircle, Play } from 'lucide-react';

const Register = () => {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const res = await register(name, email, password);
    setSubmitting(false);

    if (res.success) {
      navigate('/');
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 bg-radial-glow">
      <div className="w-full max-w-md rounded-2xl p-8 glass-panel shadow-2xl relative overflow-hidden">
        {/* Decorative corner glows */}
        <div className="absolute -top-12 -left-12 h-24 w-24 bg-coral/30 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-12 -right-12 h-24 w-24 bg-electric-violet/30 rounded-full blur-2xl"></div>

        <div className="text-center relative">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-coral/10 text-coral mb-4">
            <Play className="h-6 w-6 fill-current ml-0.5" />
          </div>
          <h2 className="text-2xl font-extrabold text-white">Get Started</h2>
          <p className="mt-1 text-sm text-silver">Create an account to join the watch parties</p>
        </div>

        {error && (
          <div className="mt-6 flex items-center space-x-2 rounded-lg bg-red-950/20 border border-red-500/20 p-3 text-sm text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4 relative">
          <div>
            <label className="block text-xs font-bold text-silver uppercase tracking-wider">Full Name</label>
            <div className="relative mt-1">
              <User className="absolute left-3 top-3 h-5 w-5 text-silver/60" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg py-2.5 pl-10 pr-4 text-sm glass-input"
                placeholder="John Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-silver uppercase tracking-wider">Email Address</label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-silver/60" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg py-2.5 pl-10 pr-4 text-sm glass-input"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-silver uppercase tracking-wider">Password</label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-silver/60" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg py-2.5 pl-10 pr-4 text-sm glass-input"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-coral py-2.5 text-sm font-bold text-white shadow-lg shadow-coral/20 transition-all hover:bg-coral-hover focus:outline-none disabled:opacity-50 mt-2"
          >
            {submitting ? 'Registering...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-silver relative">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-coral hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
