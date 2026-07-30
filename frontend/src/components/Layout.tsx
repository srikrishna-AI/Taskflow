import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTaskStore, Task } from '../context/TaskStore';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import confetti from 'canvas-confetti';
import {
  LayoutDashboard,
  CheckSquare,
  Tags,
  Calendar as CalendarIcon,
  Kanban,
  BarChart3,
  Users,
  Bell,
  Settings,
  User,
  LogOut,
  Menu,
  ChevronLeft,
  Search,
  Sun,
  Moon,
  Filter,
  X,
  Check,
  Plus,
  Trash2,
  Clock,
  ChevronUp,
  ChevronDown,
  Play,
  Pause
} from 'lucide-react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();

  // Focus Timer State
  const [customTimerModalOpen, setCustomTimerModalOpen] = useState(false);
  const [timerHours, setTimerHours] = useState(0);
  const [timerMinutes, setTimerMinutes] = useState(25);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [timerInitialTotalSeconds, setTimerInitialTotalSeconds] = useState(25 * 60);

  const formatTime = (mins: number, secs: number) => {
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimeFull = (hrs: number, mins: number, secs: number) => {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Adjust timers functions
  const incrementHours = () => {
    if (timerActive) return;
    setTimerHours(h => Math.min(h + 1, 99));
  };
  const decrementHours = () => {
    if (timerActive) return;
    setTimerHours(h => Math.max(h - 1, 0));
  };

  const incrementMinutes = () => {
    if (timerActive) return;
    setTimerMinutes(m => {
      if (m === 59) {
        setTimerHours(h => Math.min(h + 1, 99));
        return 0;
      }
      return m + 1;
    });
  };
  const decrementMinutes = () => {
    if (timerActive) return;
    setTimerMinutes(m => {
      if (m === 0) {
        setTimerHours(h => Math.max(h - 1, 0));
        return 59;
      }
      return m - 1;
    });
  };

  const incrementSeconds = () => {
    if (timerActive) return;
    setTimerSeconds(s => {
      if (s === 59) {
        setTimerMinutes(m => {
          if (m === 59) {
            setTimerHours(h => Math.min(h + 1, 99));
            return 0;
          }
          return m + 1;
        });
        return 0;
      }
      return s + 1;
    });
  };
  const decrementSeconds = () => {
    if (timerActive) return;
    setTimerSeconds(s => {
      if (s === 0) {
        setTimerMinutes(m => {
          if (m === 0) {
            setTimerHours(h => Math.max(h - 1, 0));
            return 59;
          }
          return m - 1;
        });
        return 59;
      }
      return s - 1;
    });
  };

  const handleResetTimer = () => {
    setTimerActive(false);
    setTimerHours(0);
    setTimerMinutes(25);
    setTimerSeconds(0);
    setTimerInitialTotalSeconds(25 * 60);
  };

  const handleStartTimer = () => {
    if (!timerActive) {
      const total = timerHours * 3600 + timerMinutes * 60 + timerSeconds;
      if (total === 0) {
        toast.info('Please set a duration first!');
        return;
      }
      setTimerInitialTotalSeconds(total);
    }
    setTimerActive(!timerActive);
  };

  useEffect(() => {
    let interval: any = null;
    if (timerActive) {
      interval = setInterval(() => {
        const totalRemaining = timerHours * 3600 + timerMinutes * 60 + timerSeconds;
        if (totalRemaining > 0) {
          const nextRemaining = totalRemaining - 1;
          setTimerHours(Math.floor(nextRemaining / 3600));
          setTimerMinutes(Math.floor((nextRemaining % 3600) / 60));
          setTimerSeconds(nextRemaining % 60);
        } else {
          setTimerActive(false);
          clearInterval(interval);
          
          confetti({
            particleCount: 120,
            spread: 90,
            origin: { y: 0.5 }
          });

          toast.success('Timer finished! Good job focusing. 🎉');
          handleResetTimer();
        }
      }, 1000);
    } else {
      if (interval) clearInterval(interval);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [timerActive, timerHours, timerMinutes, timerSeconds]);

  const { 
    tasks, 
    categories, 
    notifications, 
    filters, 
    setFilters,
    markNotificationAsRead, 
    markAllNotificationsAsRead,
    clearNotification 
  } = useTaskStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Layout States
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [searchOpen, setSearchOpen] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [notifDrawerOpen, setNotifDrawerOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const searchInputRef = useRef<HTMLInputElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<HTMLDivElement>(null);

  // Sync Theme with DOM
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Keyboard Shortcuts (Cmd+K for search, Esc to close modals)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setFilterDrawerOpen(false);
        setNotifDrawerOpen(false);
        setProfileDropdownOpen(false);
        setCustomTimerModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus Search Input when opened
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [searchOpen]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Nav Items Definition
  const navigationItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'My Tasks', path: '/tasks', icon: CheckSquare },
    { name: 'Categories', path: '/categories', icon: Tags },
    { name: 'Calendar', path: '/tasks?view=calendar', icon: CalendarIcon },
    { name: 'Kanban Board', path: '/tasks?view=kanban', icon: Kanban },
    { name: 'Analytics', path: '/tasks?view=analytics', icon: BarChart3 },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  // Filter Tasks by Search Query in Cmd+K Command Palette
  const filteredSearchTasks = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return tasks.filter((t: Task) => 
      t.title.toLowerCase().includes(query) || 
      t.description.toLowerCase().includes(query)
    ).slice(0, 5);
  }, [searchQuery, tasks]);

  const unreadNotifCount = notifications.filter(n => !n.read).length;

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center p-4">
        {children}
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-[#0F172A] text-slate-800 dark:text-slate-100 font-sans">
      
      {/* SIDEBAR */}
      <motion.aside 
        animate={{ width: sidebarOpen ? 260 : 70 }}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        className="hidden md:flex flex-col flex-shrink-0 h-full border-r border-slate-200/50 dark:border-slate-800/50 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md z-20 relative"
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200/40 dark:border-slate-800/40">
          <Link to="/" className="flex items-center gap-2 font-display font-bold text-xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-base shadow-lg shadow-indigo-500/20">T</span>
            {sidebarOpen && <span className="text-slate-900 dark:text-white">TaskFlow</span>}
          </Link>
          {sidebarOpen && (
            <button 
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <div className="flex-1 py-6 overflow-y-auto px-3 space-y-1">
          {navigationItems.map(item => {
            const isActive = location.pathname === item.path || (item.path.includes('?') && location.search === item.path.split('?')[1]);
            return (
              <Link 
                key={item.name} 
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                  isActive 
                    ? 'bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-600 dark:text-indigo-400 font-medium' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-800/30'
                }`}
              >
                <item.icon size={20} className={`${isActive ? 'text-indigo-500' : 'text-slate-400 group-hover:text-slate-500 dark:group-hover:text-slate-300'}`} />
                {sidebarOpen && <span>{item.name}</span>}
                {isActive && sidebarOpen && (
                  <motion.div 
                    layoutId="activeIndicator"
                    className="absolute left-0 top-2 bottom-2 w-1 rounded-r-md bg-indigo-500" 
                  />
                )}
              </Link>
            );
          })}
          {/* Sidebar Focus Timer Widget */}
          {sidebarOpen && (
            <div className="pt-6 border-t border-slate-200/30 dark:border-slate-800/30 mt-6 mx-3 p-3.5 rounded-2xl bg-slate-55/40 dark:bg-slate-950/40 border border-slate-200/10">
              <div 
                onClick={() => setCustomTimerModalOpen(true)}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 cursor-pointer hover:text-indigo-500 transition-colors"
              >
                <Clock size={14} className={timerActive ? 'animate-pulse text-emerald-500' : ''} />
                <span>Focus Timer</span>
                {timerActive && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                )}
              </div>
              
              <div className="flex flex-col items-center">
                <span 
                  onClick={() => setCustomTimerModalOpen(true)}
                  className="text-2xl font-bold font-mono tracking-wide mb-1.5 cursor-pointer hover:text-indigo-500 transition-colors"
                >
                  {formatTimeFull(timerHours, timerMinutes, timerSeconds)}
                </span>
                <span className="text-[10px] uppercase font-semibold text-indigo-500 tracking-wider mb-3">
                  {timerActive ? '⏱️ active' : '💤 idle'}
                </span>

                {/* Compact Control Button Row */}
                <div className="flex gap-2 w-full">
                  <button 
                    type="button"
                    onClick={handleStartTimer}
                    className="flex-1 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-650 text-white font-bold text-xs hover:shadow-lg transition-all"
                  >
                    {timerActive ? 'Pause' : 'Start'}
                  </button>
                  <button 
                    type="button"
                    onClick={handleResetTimer}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Quick Categories list in Sidebar */}
          {sidebarOpen && (
            <div className="pt-6 border-t border-slate-200/30 dark:border-slate-800/30 mt-4">
              <p className="px-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Favorite Categories</p>
              <div className="space-y-0.5">
                {categories.slice(0, 4).map(cat => (
                  <Link 
                    key={cat.id} 
                    to={`/tasks?category=${cat.id}`}
                    className="flex items-center justify-between px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100/30 dark:hover:bg-slate-800/20 text-sm hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <span>{cat.meta_data.icon || '📁'}</span>
                      <span className="truncate">{cat.name}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Footer User Info */}
        <div className="p-4 border-t border-slate-200/40 dark:border-slate-800/40">
          <div className="flex items-center justify-between">
            {sidebarOpen ? (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                  {user.username.substring(0, 2).toUpperCase()}
                </div>
                <div className="truncate max-w-[120px]">
                  <p className="text-sm font-semibold truncate leading-tight">{user.username}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{user.email}</p>
                </div>
              </div>
            ) : (
              <div className="w-9 h-9 mx-auto rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                {user.username.substring(0, 2).toUpperCase()}
              </div>
            )}
            {sidebarOpen && (
              <button 
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </motion.aside>

      {/* MOBILE DRAWER SIDEBAR */}
      <AnimatePresence>
        {sidebarOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="absolute inset-0 bg-slate-955/40 backdrop-blur-sm"
            />
            {/* Drawer Content */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-72 max-w-[80vw] h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800/80 shadow-2xl flex flex-col z-10 text-slate-800 dark:text-slate-100"
            >
              {/* Brand Header */}
              <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200/40 dark:border-slate-800/40">
                <Link to="/" onClick={() => setSidebarOpen(false)} className="flex items-center gap-2 font-display font-bold text-xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-650">
                  <span className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-base shadow-lg shadow-indigo-500/20">T</span>
                  <span className="text-slate-900 dark:text-white">TaskFlow</span>
                </Link>
                <button 
                  onClick={() => setSidebarOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-650 dark:hover:text-slate-300 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Navigation scroll list */}
              <div className="flex-1 py-6 overflow-y-auto px-3 space-y-1">
                {navigationItems.map(item => {
                  const isActive = location.pathname === item.path || (item.path.includes('?') && location.search === item.path.split('?')[1]);
                  return (
                    <Link 
                      key={item.name} 
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                        isActive 
                          ? 'bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-650 dark:text-indigo-400 font-medium' 
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-805 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-800/30'
                      }`}
                    >
                      <item.icon size={20} className={`${isActive ? 'text-indigo-500' : 'text-slate-400 group-hover:text-slate-500 dark:group-hover:text-slate-300'}`} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}

                {/* Sidebar Focus Timer Widget inside Mobile Drawer */}
                <div className="pt-6 border-t border-slate-200/30 dark:border-slate-800/30 mt-6 mx-3 p-3.5 rounded-2xl bg-slate-55/40 dark:bg-slate-950/40 border border-slate-200/10">
                  <div 
                    onClick={() => { setSidebarOpen(false); setCustomTimerModalOpen(true); }}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 cursor-pointer hover:text-indigo-500 transition-colors"
                  >
                    <Clock size={14} className={timerActive ? 'animate-pulse text-emerald-500' : ''} />
                    <span>Focus Timer</span>
                    {timerActive && (
                      <span className="ml-auto w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    )}
                  </div>
                  <div className="flex flex-col items-center">
                    <span 
                      onClick={() => { setSidebarOpen(false); setCustomTimerModalOpen(true); }}
                      className="text-2xl font-bold font-mono tracking-wide mb-1.5 cursor-pointer hover:text-indigo-500 transition-colors"
                    >
                      {formatTimeFull(timerHours, timerMinutes, timerSeconds)}
                    </span>
                    <span className="text-[10px] uppercase font-semibold text-indigo-500 tracking-wider mb-3">
                      {timerActive ? '⏱️ active' : '💤 idle'}
                    </span>
                    <div className="flex gap-2 w-full">
                      <button 
                        type="button"
                        onClick={handleStartTimer}
                        className="flex-1 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-650 text-white font-bold text-xs hover:shadow-lg transition-all"
                      >
                        {timerActive ? 'Pause' : 'Start'}
                      </button>
                      <button 
                        type="button"
                        onClick={handleResetTimer}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100/30 dark:hover:bg-slate-900 transition-all"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                </div>

                {/* Favorite Categories */}
                <div className="pt-6 border-t border-slate-200/30 dark:border-slate-800/30 mt-4">
                  <p className="px-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Favorite Categories</p>
                  <div className="space-y-0.5">
                    {categories.slice(0, 4).map(cat => (
                      <Link 
                        key={cat.id} 
                        to={`/tasks?category=${cat.id}`}
                        onClick={() => setSidebarOpen(false)}
                        className="flex items-center justify-between px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100/30 dark:hover:bg-slate-800/20 text-sm hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <span>{cat.meta_data.icon || '📁'}</span>
                          <span className="truncate">{cat.name}</span>
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar Footer User Info */}
              <div className="p-4 border-t border-slate-200/40 dark:border-slate-805/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-650 flex items-center justify-center text-white font-bold text-sm shadow-md">
                      {user.username.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="truncate max-w-[120px]">
                      <p className="text-sm font-semibold truncate leading-tight">{user.username}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-550 truncate">{user.email}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => { setSidebarOpen(false); handleLogout(); }}
                    className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-955/20 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                    title="Logout"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MOBILE TRIGGER SIDEBAR / MOBILE NAV SHELL */}
      {!sidebarOpen && (
        <button 
          onClick={() => setSidebarOpen(true)}
          className="hidden md:flex absolute top-4 left-4 p-2 rounded-xl border border-slate-200/50 dark:border-slate-800/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md text-slate-500 dark:text-slate-400 shadow-sm z-30"
        >
          <Menu size={18} />
        </button>
      )}

      {/* MAIN CONTAINER */}
      <div className="flex flex-col flex-1 h-full min-w-0 overflow-hidden relative">
        
        {/* HEADER */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-slate-200/40 dark:border-slate-800/40 bg-white/60 dark:bg-slate-950/40 backdrop-blur-md z-10">
          
          {/* Left search triggering */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(prev => !prev)}
              className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
            >
              <Menu size={20} />
            </button>
            
            {/* Command Palette Trigger Input */}
            <div 
              onClick={() => setSearchOpen(true)}
              className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200/50 dark:border-slate-800/50 bg-slate-100/50 dark:bg-slate-900/50 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 w-64 cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200"
            >
              <Search size={16} />
              <span className="text-sm">Search...</span>
              <kbd className="ml-auto text-[10px] px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800">⌘K</kbd>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            
            {/* Quick Create Button */}
            <button 
              onClick={() => navigate('/tasks')} 
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium text-sm hover:shadow-lg hover:shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">New Task</span>
            </button>

            {/* Global Search button for mobile */}
            <button 
              onClick={() => setSearchOpen(true)} 
              className="sm:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
            >
              <Search size={20} />
            </button>

            {/* Filter Toggle */}
            <button 
              onClick={() => setFilterDrawerOpen(true)}
              className={`p-2 rounded-xl border border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 hover:text-slate-700 dark:hover:text-slate-200 transition-all relative ${
                (filters.status || filters.priority || filters.category) ? 'border-indigo-500/50 bg-indigo-50/20 text-indigo-500 dark:bg-indigo-950/10' : ''
              }`}
            >
              <Filter size={18} />
              {(filters.status || filters.priority || filters.category) && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              )}
            </button>

            {/* Notification Bell */}
            <button 
              onClick={() => setNotifDrawerOpen(true)}
              className="p-2 rounded-xl border border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 hover:text-slate-700 dark:hover:text-slate-200 transition-all relative"
            >
              <Bell size={18} />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center shadow-md animate-bounce">
                  {unreadNotifCount}
                </span>
              )}
            </button>

            {/* Focus Timer */}
            <button 
              onClick={() => setCustomTimerModalOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-all ${
                timerActive 
                  ? 'border-emerald-500/50 bg-emerald-50/10 text-emerald-500 dark:bg-emerald-950/20' 
                  : 'border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-855 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              title="Focus Timer"
            >
              <Clock size={16} className={timerActive ? 'animate-pulse text-emerald-500' : ''} />
              <span className="text-xs font-semibold font-mono">{formatTimeFull(timerHours, timerMinutes, timerSeconds)}</span>
            </button>

            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-855 hover:text-slate-700 dark:hover:text-slate-200 transition-all"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button 
                onClick={() => setProfileDropdownOpen(prev => !prev)}
                className="w-9 h-9 rounded-xl overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md border-2 border-transparent hover:border-indigo-500 transition-all duration-200"
              >
                {user.username.substring(0, 2).toUpperCase()}
              </button>
              <AnimatePresence>
                {profileDropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200/50 dark:border-slate-800/50 shadow-2xl p-2 z-50 text-slate-800 dark:text-slate-200"
                  >
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                      <p className="text-xs text-slate-450 dark:text-slate-500">Signed in as</p>
                      <p className="text-sm font-semibold truncate text-slate-850 dark:text-white">{user.username}</p>
                    </div>
                    <div className="py-1.5">
                      <Link 
                        to="/profile" 
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <User size={16} />
                        <span>Profile & Settings</span>
                      </Link>
                    </div>
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-1.5">
                      <button 
                        onClick={handleLogout}
                        className="flex items-center gap-2.5 w-full text-left px-3 py-2 text-sm rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                      >
                        <LogOut size={16} />
                        <span>Sign out</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto bg-slate-55 dark:bg-[#0A0F1D] relative">
          <div className="max-w-7xl mx-auto p-6 md:p-8">
            {children}
          </div>
        </main>
      </div>

      {/* GLOBAL SEARCH COMMAND PALETTE (CMD+K) */}
      <AnimatePresence>
        {searchOpen && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-start justify-center pt-24 px-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200/50 dark:border-slate-800/50">
                <Search className="text-slate-400" size={20} />
                <input 
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  type="text" 
                  placeholder="Search tasks, categories, or notes..." 
                  className="bg-transparent border-none outline-none text-slate-850 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 w-full text-base p-0"
                />
                <button 
                  onClick={() => setSearchOpen(false)}
                  className="p-1 rounded bg-slate-105 dark:bg-slate-800 text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="p-3 max-h-96 overflow-y-auto">
                {searchQuery.trim() ? (
                  <div>
                    <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 px-3 uppercase tracking-wider mb-2">Task Results</h3>
                    {filteredSearchTasks.length > 0 ? (
                      <div className="space-y-1">
                        {filteredSearchTasks.map((t: Task) => (
                          <div 
                            key={t.id}
                            onClick={() => {
                              setSearchOpen(false);
                              navigate(`/tasks?search=${t.title}`);
                            }}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-indigo-500/5 dark:hover:bg-indigo-500/10 cursor-pointer border border-transparent hover:border-slate-200/30 dark:hover:border-slate-850 transition-all duration-200"
                          >
                            <span className="text-xl">{t.meta_data.emoji || '📋'}</span>
                            <div>
                              <p className="text-sm font-medium">{t.title}</p>
                              <p className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-[400px]">{t.description}</p>
                            </div>
                            <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              t.priority === 'high' ? 'bg-rose-500/15 text-rose-500' :
                              t.priority === 'medium' ? 'bg-orange-500/15 text-orange-500' :
                              'bg-slate-400/15 text-slate-400'
                            }`}>{t.priority}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-450 dark:text-slate-500 px-3 py-2">No matching tasks found.</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4 py-2">
                    <div>
                      <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 px-3 uppercase tracking-wider mb-2">Suggestions</h3>
                      <div className="grid grid-cols-2 gap-1 px-1">
                        <button 
                          onClick={() => { setSearchOpen(false); navigate('/tasks?view=kanban'); }}
                          className="flex items-center gap-2.5 px-3 py-2 text-sm text-left rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Kanban size={16} className="text-indigo-500" />
                          <span>Open Kanban Board</span>
                        </button>
                        <button 
                          onClick={() => { setSearchOpen(false); navigate('/tasks?view=calendar'); }}
                          className="flex items-center gap-2.5 px-3 py-2 text-sm text-left rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <CalendarIcon size={16} className="text-purple-500" />
                          <span>Open Calendar</span>
                        </button>
                        <button 
                          onClick={() => { setSearchOpen(false); navigate('/categories'); }}
                          className="flex items-center gap-2.5 px-3 py-2 text-sm text-left rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Tags size={16} className="text-emerald-500" />
                          <span>Manage Categories</span>
                        </button>
                        <button 
                          onClick={() => { setSearchOpen(false); navigate('/profile'); }}
                          className="flex items-center gap-2.5 px-3 py-2 text-sm text-left rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Settings size={16} className="text-slate-500" />
                          <span>System Settings</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FILTER DRAWER PANEL */}
      <AnimatePresence>
        {filterDrawerOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div 
              onClick={() => setFilterDrawerOpen(false)}
              className="absolute inset-0 bg-slate-950/20 backdrop-blur-[2px]" 
            />
            {/* Content Drawer */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-sm h-full bg-white dark:bg-slate-900 border-l border-slate-200/50 dark:border-slate-800/50 shadow-2xl p-6 flex flex-col z-10 text-slate-800 dark:text-slate-150"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <Filter size={18} className="text-indigo-500" />
                  <h2 className="font-semibold text-lg">Filter Workspace</h2>
                </div>
                <button 
                  onClick={() => setFilterDrawerOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Filters Form */}
              <div className="flex-1 overflow-y-auto py-6 space-y-6">
                
                {/* Search */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Search Keywords</label>
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                    <input 
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      placeholder="Title or description..."
                      className="pl-9 pr-4 py-2 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-display">Task Status</label>
                  <div className="flex flex-wrap gap-1.5">
                    {['pending', 'in-progress', 'completed'].map(st => {
                      const isSelected = filters.status === st;
                      return (
                        <button
                          key={st}
                          onClick={() => setFilters(prev => ({ ...prev, status: isSelected ? '' : st }))}
                          className={`px-3 py-1.5 rounded-lg text-xs capitalize font-medium border transition-all ${
                            isSelected 
                              ? 'bg-indigo-500/10 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                              : 'bg-white dark:bg-slate-850 border-slate-200/50 dark:border-slate-800/50 hover:bg-slate-100/50 dark:hover:bg-slate-800/30'
                          }`}
                        >
                          {st.replace('-', ' ')}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Priority */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Priority</label>
                  <div className="flex flex-wrap gap-1.5">
                    {['low', 'medium', 'high'].map(pr => {
                      const isSelected = filters.priority === pr;
                      return (
                        <button
                          key={pr}
                          onClick={() => setFilters(prev => ({ ...prev, priority: isSelected ? '' : pr }))}
                          className={`px-3 py-1.5 rounded-lg text-xs capitalize font-medium border transition-all ${
                            isSelected 
                              ? pr === 'high' ? 'bg-rose-500/10 border-rose-500 text-rose-500' :
                                pr === 'medium' ? 'bg-orange-500/10 border-orange-500 text-orange-500' :
                                'bg-indigo-500/10 border-indigo-500 text-indigo-500'
                              : 'bg-white dark:bg-slate-850 border-slate-200/50 dark:border-slate-800/50 hover:bg-slate-100/50 dark:hover:bg-slate-800/30'
                          }`}
                        >
                          {pr}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Category</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {categories.map(cat => {
                      const isSelected = filters.category === cat.id.toString();
                      return (
                        <button
                          key={cat.id}
                          onClick={() => setFilters(prev => ({ ...prev, category: isSelected ? '' : cat.id.toString() }))}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border truncate text-left transition-all ${
                            isSelected 
                              ? 'bg-indigo-500/10 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                              : 'bg-white dark:bg-slate-850 border-slate-200/50 dark:border-slate-800/50 hover:bg-slate-100/50 dark:hover:bg-slate-800/30'
                          }`}
                        >
                          <span>{cat.meta_data.icon || '📁'}</span>
                          <span className="truncate">{cat.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sort By */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Sort By</label>
                  <select 
                    value={filters.sortBy}
                    onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 text-sm outline-none"
                  >
                    <option value="due_date">Due Date</option>
                    <option value="created_at">Creation Date</option>
                    <option value="priority">Priority</option>
                    <option value="alphabetical">Task Name</option>
                  </select>
                </div>

              </div>

              {/* Reset Action */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex gap-2">
                <button 
                  onClick={() => setFilters({
                    status: '',
                    priority: '',
                    category: '',
                    search: '',
                    sortBy: 'due_date',
                    sortOrder: 'asc'
                  })}
                  className="flex-1 py-2 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-55 transition-colors"
                >
                  Clear Filters
                </button>
                <button 
                  onClick={() => setFilterDrawerOpen(false)}
                  className="flex-1 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:shadow-lg shadow-indigo-500/10 transition-all"
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* NOTIFICATION DRAWER CENTER */}
      <AnimatePresence>
        {notifDrawerOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div 
              onClick={() => setNotifDrawerOpen(false)}
              className="absolute inset-0 bg-slate-950/20 backdrop-blur-[2px]" 
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-sm h-full bg-white dark:bg-slate-900 border-l border-slate-200/50 dark:border-slate-800/50 shadow-2xl p-6 flex flex-col z-10 text-slate-800 dark:text-slate-150"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <Bell size={18} className="text-purple-500 animate-pulse" />
                  <h2 className="font-semibold text-lg">Notifications</h2>
                </div>
                <div className="flex items-center gap-1.5">
                  {unreadNotifCount > 0 && (
                    <button 
                      onClick={markAllNotificationsAsRead}
                      className="text-xs text-indigo-500 hover:text-indigo-600 font-medium px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Mark all read
                    </button>
                  )}
                  <button 
                    onClick={() => setNotifDrawerOpen(false)}
                    className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Notifications list */}
              <div className="flex-1 overflow-y-auto py-4 space-y-2">
                {notifications.length > 0 ? (
                  notifications.map(notif => (
                    <div 
                      key={notif.id}
                      className={`p-3.5 rounded-2xl border transition-all duration-300 relative group overflow-hidden ${
                        notif.read 
                          ? 'bg-slate-50/50 dark:bg-slate-900/30 border-slate-100 dark:border-slate-800/50' 
                          : 'bg-indigo-500/5 dark:bg-indigo-500/10 border-indigo-500/30'
                      }`}
                    >
                      {/* Left Badge Indicator */}
                      {!notif.read && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />
                      )}
                      
                      <div className="flex items-start justify-between">
                        <div className="space-y-0.5">
                          <h4 className="text-sm font-semibold text-slate-800 dark:text-white flex items-center gap-1.5">
                            {notif.title}
                          </h4>
                          <p className="text-xs text-slate-450 dark:text-slate-400">{notif.message}</p>
                          <span className="inline-block text-[9px] text-slate-400 pt-1.5">
                            {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          {!notif.read && (
                            <button 
                              onClick={() => markNotificationAsRead(notif.id)}
                              className="p-1 rounded hover:bg-slate-205 dark:hover:bg-slate-800 text-indigo-500"
                              title="Mark Read"
                            >
                              <Check size={14} />
                            </button>
                          )}
                          <button 
                            onClick={() => clearNotification(notif.id)}
                            className="p-1 rounded hover:bg-slate-205 dark:hover:bg-slate-850 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 text-lg">
                      🔕
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-350">All caught up!</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">You have no new notifications.</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PROMETHEAN TIMER DIALOG */}
      <AnimatePresence>
        {customTimerModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            
            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm aspect-square bg-[#1E1B26] border border-violet-950/40 rounded-[32px] p-6 shadow-2xl flex flex-col items-center justify-between overflow-hidden"
            >
              {/* Header Title & Close Button */}
              <div className="flex items-center justify-between w-full text-violet-200/80 border-b border-violet-950/40 pb-3">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-violet-400" />
                  <span className="text-xs font-bold uppercase tracking-wider font-display">Timer</span>
                </div>
                <button 
                  onClick={() => setCustomTimerModalOpen(false)}
                  className="p-1 rounded-xl hover:bg-violet-950/40 text-violet-400 hover:text-violet-200 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Central Circle & Display */}
              <div className="relative w-64 h-64 flex items-center justify-center my-4">
                
                {/* SVG Progress Circle */}
                <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                  {/* Background Circle */}
                  <circle 
                    cx="128" cy="128" r="112"
                    className="stroke-[#2E2938] fill-none"
                    strokeWidth="6"
                  />
                  {/* Elapsed Progress Indicator */}
                  <circle 
                    cx="128" cy="128" r="112"
                    className="stroke-[#C084FC] fill-none transition-all duration-1000 ease-linear"
                    strokeWidth="6"
                    strokeDasharray="703.7"
                    strokeDashoffset={timerActive 
                      ? 703.7 - (703.7 * ((timerHours * 3600 + timerMinutes * 60 + timerSeconds) / timerInitialTotalSeconds))
                      : 0
                    }
                    strokeLinecap="round"
                  />
                </svg>

                {/* HH:MM:SS with Increments/Decrements */}
                <div className="absolute flex flex-col items-center justify-center">
                  
                  {/* Up Chevrons row */}
                  {!timerActive && (
                    <div className="flex gap-4 mb-1 text-violet-400">
                      {/* Hours Up */}
                      <button type="button" onClick={incrementHours} className="p-0.5 rounded hover:bg-violet-950/40 transition-colors">
                        <ChevronUp size={20} />
                      </button>
                      <div className="w-2" />
                      {/* Minutes Up */}
                      <button type="button" onClick={incrementMinutes} className="p-0.5 rounded hover:bg-violet-950/40 transition-colors">
                        <ChevronUp size={20} />
                      </button>
                      <div className="w-2" />
                      {/* Seconds Up */}
                      <button type="button" onClick={incrementSeconds} className="p-0.5 rounded hover:bg-violet-950/40 transition-colors">
                        <ChevronUp size={20} />
                      </button>
                    </div>
                  )}

                  {/* Digital Clock Display */}
                  <div className="flex items-center text-4xl font-bold font-mono text-white tracking-wide">
                    <span>{timerHours.toString().padStart(2, '0')}</span>
                    <span className="text-violet-400 mx-1">:</span>
                    <span>{timerMinutes.toString().padStart(2, '0')}</span>
                    <span className="text-violet-400 mx-1">:</span>
                    <span>{timerSeconds.toString().padStart(2, '0')}</span>
                  </div>

                  {/* Down Chevrons row */}
                  {!timerActive && (
                    <div className="flex gap-4 mt-1 text-violet-400">
                      {/* Hours Down */}
                      <button type="button" onClick={decrementHours} className="p-0.5 rounded hover:bg-violet-950/40 transition-colors">
                        <ChevronDown size={20} />
                      </button>
                      <div className="w-2" />
                      {/* Minutes Down */}
                      <button type="button" onClick={decrementMinutes} className="p-0.5 rounded hover:bg-violet-950/40 transition-colors">
                        <ChevronDown size={20} />
                      </button>
                      <div className="w-2" />
                      {/* Seconds Down */}
                      <button type="button" onClick={decrementSeconds} className="p-0.5 rounded hover:bg-violet-950/40 transition-colors">
                        <ChevronDown size={20} />
                      </button>
                    </div>
                  )}

                  {/* Play / Pause Toggle inside Circle */}
                  <button 
                    type="button"
                    onClick={handleStartTimer}
                    className="mt-4 w-10 h-10 rounded-full bg-violet-650 hover:bg-violet-500 text-white flex items-center justify-center shadow-lg transition-all active:scale-95"
                  >
                    {timerActive ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
                  </button>

                </div>

              </div>

              {/* Presets and Controls Bottom Toolbar */}
              <div className="flex items-center justify-between w-full border-t border-violet-950/40 pt-4">
                {/* Preset shortcuts */}
                <div className="flex gap-1">
                  <button 
                    type="button"
                    onClick={() => { setTimerHours(0); setTimerMinutes(5); setTimerSeconds(0); }}
                    className="px-2 py-0.5 rounded bg-violet-950/40 hover:bg-violet-900/40 text-violet-300 text-[9px] font-bold"
                  >
                    5m
                  </button>
                  <button 
                    type="button"
                    onClick={() => { setTimerHours(0); setTimerMinutes(25); setTimerSeconds(0); }}
                    className="px-2 py-0.5 rounded bg-violet-950/40 hover:bg-violet-900/40 text-violet-300 text-[9px] font-bold"
                  >
                    25m
                  </button>
                  <button 
                    type="button"
                    onClick={() => { setTimerHours(1); setTimerMinutes(0); setTimerSeconds(0); }}
                    className="px-2 py-0.5 rounded bg-violet-950/40 hover:bg-violet-900/40 text-violet-300 text-[9px] font-bold"
                  >
                    1h
                  </button>
                </div>

                <span className="text-[9px] text-violet-400 uppercase font-semibold tracking-wider">
                  {timerActive ? 'Active' : 'Setup'}
                </span>

                <button 
                  type="button"
                  onClick={handleResetTimer}
                  className="px-2.5 py-0.5 rounded border border-violet-850 hover:bg-violet-950/40 text-violet-300 text-[10px] font-bold transition-all"
                >
                  Reset
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
