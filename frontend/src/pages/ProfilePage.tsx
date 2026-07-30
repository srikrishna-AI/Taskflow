import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Settings, 
  Keyboard, 
  Lock, 
  Check, 
  Globe,
  Palette,
  Briefcase
} from 'lucide-react';
import { toast } from 'react-toastify';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'workspace' | 'shortcuts'>('profile');

  // Form states
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('My Workspace');
  const [language, setLanguage] = useState('en');

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password && password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setProfileSaving(true);
    try {
      const data: any = { username, email };
      if (password) {
        data.password = password;
      }
      await updateProfile(data);
      setPassword('');
      setConfirmPassword('');
      toast.success('Profile settings updated successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to update profile settings');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSaveWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Workspace settings updated successfully!');
  };

  const shortcutKeys = [
    { keys: ['⌘', 'K'], desc: 'Open Command Search Palette' },
    { keys: ['Esc'], desc: 'Close open dialogs, drawers, and search modals' },
    { keys: ['N'], desc: 'Quick create a new task (Redirects to creator)' },
    { keys: ['Tab'], desc: 'Cycle through interactive fields and list columns' }
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Header title */}
      <div className="border-b border-slate-200/40 dark:border-slate-800/40 pb-4">
        <h1 className="text-2xl font-bold font-display tracking-tight text-slate-850 dark:text-white">Settings & Preferences</h1>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Customize workspace configurations, profile info, and shortcuts.</p>
      </div>

      {/* Main Grid with Left Menu and Right Form Panel */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Left Side Navigation Menu */}
        <div className="md:col-span-4 flex flex-col gap-1.5 p-1.5 bg-white/70 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl shadow-sm">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
              activeTab === 'profile'
                ? 'bg-indigo-500/10 text-indigo-650 dark:text-indigo-400'
                : 'text-slate-500 hover:bg-slate-100/50 dark:hover:bg-slate-800/30 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <User size={15} />
            <span>Profile Details</span>
          </button>
          
          <button
            onClick={() => setActiveTab('workspace')}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
              activeTab === 'workspace'
                ? 'bg-indigo-500/10 text-indigo-650 dark:text-indigo-400'
                : 'text-slate-500 hover:bg-slate-100/50 dark:hover:bg-slate-800/30 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Briefcase size={15} />
            <span>Workspace & Language</span>
          </button>
          
          <button
            onClick={() => setActiveTab('shortcuts')}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
              activeTab === 'shortcuts'
                ? 'bg-indigo-500/10 text-indigo-650 dark:text-indigo-400'
                : 'text-slate-500 hover:bg-slate-100/50 dark:hover:bg-slate-800/30 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Keyboard size={15} />
            <span>Keyboard Hotkeys</span>
          </button>
        </div>

        {/* Right Side Settings Panel */}
        <div className="md:col-span-8 bg-white/70 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 md:p-8 shadow-sm">
          
          <AnimatePresence mode="wait">
            
            {/* Tab: Profile details */}
            {activeTab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-base font-bold text-slate-850 dark:text-white">Profile Details</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Manage your personal credentials and contact address.</p>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Username</label>
                      <input 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Email Address</label>
                      <input 
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <Lock size={12} />
                        New Password
                      </label>
                      <input 
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Leave blank to keep current"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <Lock size={12} />
                        Confirm New Password
                      </label>
                      <input 
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Leave blank to keep current"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <button 
                      type="submit"
                      disabled={profileSaving}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-semibold hover:shadow-lg shadow-indigo-500/10 transition-all disabled:opacity-50"
                    >
                      {profileSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Tab: Workspace settings */}
            {activeTab === 'workspace' && (
              <motion.div
                key="workspace"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-base font-bold text-slate-850 dark:text-white">Workspace & Preferences</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Customize default workspace details, interface languages, and integrations.</p>
                </div>

                <form onSubmit={handleSaveWorkspace} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Workspace Name</label>
                    <input 
                      value={workspaceName}
                      onChange={(e) => setWorkspaceName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs outline-none focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <Globe size={12} />
                      Display Language
                    </label>
                    <select 
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 text-xs outline-none focus:border-indigo-500"
                    >
                      <option value="en">English (United States)</option>
                      <option value="es">Español (Spanish)</option>
                      <option value="fr">Français (French)</option>
                      <option value="de">Deutsch (German)</option>
                    </select>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <button 
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-semibold hover:shadow-lg shadow-indigo-500/10 transition-all"
                    >
                      Save Preferences
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Tab: Keyboard Shortcuts */}
            {activeTab === 'shortcuts' && (
              <motion.div
                key="shortcuts"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-base font-bold text-slate-850 dark:text-white">Keyboard Hotkeys</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Speed up your navigation across sheets using key combinations.</p>
                </div>

                <div className="space-y-3">
                  {shortcutKeys.map((s, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/50 dark:bg-slate-955/40 border border-slate-100 dark:border-slate-800/80"
                    >
                      <span className="text-xs text-slate-600 dark:text-slate-350">{s.desc}</span>
                      <div className="flex gap-1 select-none">
                        {s.keys.map((key, keyIdx) => (
                          <kbd 
                            key={keyIdx}
                            className="px-2 py-1 text-[10px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm"
                          >
                            {key}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </div>

    </div>
  );
}
