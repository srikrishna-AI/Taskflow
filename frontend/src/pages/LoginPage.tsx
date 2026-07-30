import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { User, Lock, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!username || !password) {
      toast.error('All fields are required');
      return;
    }
    setLoading(true);
    try {
      await login(username, password);
      toast.success('Welcome back to TaskFlow!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };


  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="w-full max-w-md bg-white/70 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-lg rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden"
    >
      {/* Background Gradient Orbs */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-3xl" />

      {/* Header Logo */}
      <div className="text-center space-y-2 mb-8 relative">
        <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-650 items-center justify-center text-white text-xl font-bold shadow-lg shadow-indigo-500/10 mx-auto">
          T
        </div>
        <h2 className="text-2xl font-bold font-display tracking-tight text-slate-850 dark:text-white">Sign in to TaskFlow</h2>
        <p className="text-xs text-slate-400 dark:text-slate-500">Enter your credentials to access your workspace</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 relative">
        {/* Username */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Username</label>
          <div className="relative">
            <User size={16} className="absolute left-3 top-3.5 text-slate-400" />
            <input 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              placeholder="e.g. administrator" 
              className="pl-9 pr-4 py-2.5 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-55/50 dark:bg-slate-950/60 text-xs outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-800 dark:text-white"
              required
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Password</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-3.5 text-slate-400" />
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••" 
              className="pl-9 pr-4 py-2.5 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-55/50 dark:bg-slate-950/60 text-xs outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-850 dark:text-white"
              required
            />
          </div>
        </div>

        {/* Submit */}
        <button 
          type="submit" 
          disabled={loading}
          className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-xs hover:shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {loading ? 'Authenticating...' : 'Sign In'}
          <ArrowRight size={14} />
        </button>


      </form>

      {/* Redirect Footer */}
      <div className="mt-6 border-t border-slate-150/40 dark:border-slate-800/40 pt-4 text-center">
        <p className="text-xs text-slate-400">
          New to TaskFlow?{' '}
          <Link to="/register" className="text-indigo-500 font-semibold hover:underline">
            Create an account
          </Link>
        </p>
      </div>

    </motion.div>
  );
}
