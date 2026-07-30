import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTaskStore } from '../context/TaskStore';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import {
  ListTodo,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  TrendingUp,
  Clock,
  Plus,
  ArrowRight,
  ChevronRight,
  PieChart as PieIcon,
  Activity
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tasks, categories, notifications, createTask } = useTaskStore();

  // Metrics Calculations
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    const inProgress = tasks.filter(t => t.status === 'in-progress').length;
    
    // Overdue tasks: status != completed and due_date < now
    const now = new Date();
    const overdue = tasks.filter(t => {
      if (t.status === 'completed' || !t.due_date) return false;
      return new Date(t.due_date) < now;
    }).length;

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, pending, inProgress, overdue, completionRate };
  }, [tasks]);

  // Weekly Productivity (Last 7 days completion count)
  const weeklyData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const data = days.map((day, idx) => {
      // Calculate how many tasks were updated/completed on this day of the week
      const count = tasks.filter(t => {
        if (t.status !== 'completed') return false;
        const compDate = new Date(t.updated_at || t.created_at);
        return compDate.getDay() === idx;
      }).length;
      
      return { name: day, completed: count };
    });
    
    // Rotate array so today is at the end
    const todayIdx = new Date().getDay();
    const rotated = [...data.slice(todayIdx + 1), ...data.slice(0, todayIdx + 1)];
    return rotated;
  }, [tasks]);

  // Priority distribution for Donut Chart
  const priorityData = useMemo(() => {
    const low = tasks.filter(t => t.priority === 'low').length;
    const medium = tasks.filter(t => t.priority === 'medium').length;
    const high = tasks.filter(t => t.priority === 'high').length;
    
    return [
      { name: 'Low', value: low, color: '#94a3b8' },
      { name: 'Medium', value: medium, color: '#f97316' },
      { name: 'High', value: high, color: '#f43f5e' }
    ].filter(item => item.value > 0);
  }, [tasks]);

  // Activity Timeline (e.g. notifications list)
  const timelineActivities = useMemo(() => {
    return notifications.slice(0, 4);
  }, [notifications]);

  // Recent Tasks
  const recentTasks = useMemo(() => {
    return tasks.slice(0, 4);
  }, [tasks]);

  // Quick Action
  const handleQuickAdd = async () => {
    const newTask = await createTask({
      title: 'New Quick Task',
      description: 'Add details here',
      status: 'pending',
      priority: 'medium',
      meta_data: { emoji: '⚡', progress: 0 }
    });
    if (newTask) {
      navigate(`/tasks?edit=${newTask.id}`);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-900 dark:from-white dark:via-indigo-200 dark:to-purple-300 text-transparent bg-clip-text">
            Welcome back, {user?.username}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Here is a summary of your workspace performance today.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={handleQuickAdd}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-sm hover:shadow-lg hover:shadow-indigo-500/20 transition-all duration-200"
          >
            <Plus size={16} />
            <span>Quick Task</span>
          </button>
        </div>
      </div>

      {/* STATISTICS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        
        {/* Today's Tasks */}
        <motion.div 
          variants={cardVariants}
          whileHover={{ y: -5, scale: 1.01 }}
          className="glass-card rounded-2xl p-5 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-2xl group-hover:scale-150 transition-all duration-500" />
          <div className="flex items-center justify-between">
            <span className="text-slate-400 dark:text-slate-500 text-xs font-semibold uppercase tracking-wider">Active Tasks</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-500 flex items-center justify-center">
              <ListTodo size={18} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-display font-bold">{stats.pending + stats.inProgress}</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 flex items-center gap-1">
              <span className="text-indigo-500 font-medium">{stats.inProgress}</span> in progress
            </p>
          </div>
        </motion.div>

        {/* Completed */}
        <motion.div 
          variants={cardVariants}
          whileHover={{ y: -5, scale: 1.01 }}
          className="glass-card rounded-2xl p-5 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-2xl group-hover:scale-150 transition-all duration-500" />
          <div className="flex items-center justify-between">
            <span className="text-slate-400 dark:text-slate-500 text-xs font-semibold uppercase tracking-wider">Completed</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-display font-bold">{stats.completed}</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 flex items-center gap-1">
              <span className="text-emerald-500 font-semibold">{stats.completionRate}%</span> completion rate
            </p>
          </div>
        </motion.div>

        {/* Upcoming */}
        <motion.div 
          variants={cardVariants}
          whileHover={{ y: -5, scale: 1.01 }}
          className="glass-card rounded-2xl p-5 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-2xl group-hover:scale-150 transition-all duration-500" />
          <div className="flex items-center justify-between">
            <span className="text-slate-400 dark:text-slate-500 text-xs font-semibold uppercase tracking-wider">Total Tasks</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 text-purple-500 flex items-center justify-center">
              <Calendar size={18} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-display font-bold">{stats.total}</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">Across all workspaces</p>
          </div>
        </motion.div>

        {/* Overdue */}
        <motion.div 
          variants={cardVariants}
          whileHover={{ y: -5, scale: 1.01 }}
          className="glass-card rounded-2xl p-5 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 dark:bg-rose-500/10 rounded-full blur-2xl group-hover:scale-150 transition-all duration-500" />
          <div className="flex items-center justify-between">
            <span className="text-slate-400 dark:text-slate-500 text-xs font-semibold uppercase tracking-wider">Overdue</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 dark:bg-rose-500/20 text-rose-500 flex items-center justify-center">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-display font-bold text-rose-500">{stats.overdue}</h3>
            <p className="text-xs text-slate-450 dark:text-slate-500 mt-1.5">Require immediate attention</p>
          </div>
        </motion.div>

      </div>

      {/* DASHBOARD CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Progress Ring & Priority Distribution Card */}
        <motion.div 
          variants={cardVariants} 
          className="glass-card rounded-3xl p-6 lg:col-span-1 flex flex-col justify-between"
        >
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Activity size={18} className="text-indigo-500" />
              <span>Workspace Progress</span>
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Overall task completions</p>
          </div>

          {/* SVG Progress Ring */}
          <div className="flex items-center justify-center my-8 relative">
            <svg className="w-36 h-36 transform -rotate-90">
              <circle
                cx="72"
                cy="72"
                r="60"
                className="stroke-slate-100 dark:stroke-slate-800"
                strokeWidth="10"
                fill="transparent"
              />
              <motion.circle
                cx="72"
                cy="72"
                r="60"
                className="stroke-indigo-500"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={377}
                initial={{ strokeDashoffset: 377 }}
                animate={{ strokeDashoffset: 377 - (377 * stats.completionRate) / 100 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-3xl font-display font-bold">{stats.completionRate}%</span>
              <p className="text-[10px] uppercase font-semibold text-slate-400 mt-0.5">Done</p>
            </div>
          </div>

          {/* Mini Donut Chart Priority */}
          <div className="border-t border-slate-150 dark:border-slate-800 pt-4">
            <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Priority Distribution</h3>
            {priorityData.length > 0 ? (
              <div className="flex items-center justify-between">
                <div className="w-16 h-16">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={priorityData}
                        innerRadius={18}
                        outerRadius={28}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {priorityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 grid grid-cols-3 gap-2 pl-4">
                  {priorityData.map(item => (
                    <div key={item.name} className="text-center">
                      <p className="text-xs font-bold" style={{ color: item.color }}>{item.value}</p>
                      <p className="text-[9px] uppercase font-semibold text-slate-400 mt-0.5">{item.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-2">No priority data available.</p>
            )}
          </div>
        </motion.div>

        {/* Weekly Productivity Bar Graph */}
        <motion.div 
          variants={cardVariants} 
          className="glass-card rounded-3xl p-6 lg:col-span-2 flex flex-col justify-between"
        >
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <TrendingUp size={18} className="text-purple-500" />
              <span>Weekly Productivity</span>
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Task completions per day</p>
          </div>

          <div className="h-64 mt-6 weekly-grid rounded-2xl p-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.2} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 11 }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 11 }} 
                  allowDecimals={false}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(139, 92, 246, 0.05)', radius: 10 }}
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    borderRadius: '12px', 
                    border: '1px solid #334155',
                    color: '#fff',
                    fontSize: '12px'
                  }} 
                />
                <Bar 
                  dataKey="completed" 
                  fill="url(#barGrad)" 
                  radius={[8, 8, 0, 0]} 
                  maxBarSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

      </div>

      {/* RECENT TASKS & ACTIVITY TIMELINE ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Tasks */}
        <motion.div variants={cardVariants} className="glass-card rounded-3xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold">Recent Tasks</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Quick lookup of active items</p>
            </div>
            <button 
              onClick={() => navigate('/tasks')} 
              className="text-xs text-indigo-500 hover:text-indigo-600 font-semibold flex items-center gap-1 transition-colors"
            >
              <span>View All</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="space-y-3.5">
            {recentTasks.length > 0 ? (
              recentTasks.map(task => (
                <div 
                  key={task.id}
                  onClick={() => navigate(`/tasks?search=${task.title}`)}
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 cursor-pointer transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{task.meta_data.emoji || '📋'}</span>
                    <div>
                      <h4 className="text-sm font-semibold truncate group-hover:text-indigo-500 transition-colors max-w-[200px] sm:max-w-[300px]">{task.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${
                          task.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                          task.status === 'in-progress' ? 'bg-indigo-550/10 text-indigo-500' :
                          'bg-amber-500/10 text-amber-500'
                        }`}>{task.status.replace('-', ' ')}</span>
                        {task.due_date && (
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Clock size={10} />
                            {new Date(task.due_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-4px] group-hover:translate-x-0" />
                </div>
              ))
            ) : (
              <div className="text-center py-10 space-y-2">
                <p className="text-sm text-slate-400">No tasks created yet.</p>
                <button 
                  onClick={handleQuickAdd} 
                  className="text-xs text-indigo-500 hover:underline"
                >
                  Create your first task
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Activity Timeline */}
        <motion.div variants={cardVariants} className="glass-card rounded-3xl p-6">
          <div className="mb-5">
            <h2 className="text-lg font-bold">Activity Log</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Chronological listing of updates</p>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100 dark:before:bg-slate-800">
            {timelineActivities.length > 0 ? (
              timelineActivities.map(act => (
                <div key={act.id} className="relative group">
                  {/* Bullet */}
                  <div className={`absolute -left-[22px] top-1 w-[10px] h-[10px] rounded-full border-2 border-white dark:border-slate-900 shadow-sm ${
                    act.type === 'success' ? 'bg-emerald-500' :
                    act.type === 'warning' ? 'bg-orange-500' :
                    'bg-indigo-500'
                  }`} />
                  <div>
                    <h4 className="text-sm font-semibold text-slate-850 dark:text-white leading-tight">{act.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{act.message}</p>
                    <span className="text-[10px] text-slate-400 block mt-1.5">
                      {new Date(act.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {' '}
                      {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10">
                <p className="text-sm text-slate-400">Timeline is quiet. Complete tasks to log activity!</p>
              </div>
            )}
          </div>
        </motion.div>

      </div>

    </motion.div>
  );
}
