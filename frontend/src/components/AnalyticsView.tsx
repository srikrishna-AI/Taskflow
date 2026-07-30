import React, { useMemo } from 'react';
import { Task, Category } from '../context/TaskStore';
import { motion } from 'framer-motion';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { 
  BarChart3, 
  Clock, 
  TrendingUp, 
  CheckCircle, 
  AlertTriangle 
} from 'lucide-react';

interface AnalyticsViewProps {
  tasks: Task[];
  categories: Category[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ tasks, categories }) => {

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    
    // Total estimated hours
    const totalHours = tasks.reduce((sum, t) => sum + (t.meta_data.estimatedTime || 0), 0);
    const completedHours = tasks
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + (t.meta_data.estimatedTime || 0), 0);

    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, totalHours, completedHours, rate };
  }, [tasks]);

  // 1. Completion Rate Timeline (Past 7 days)
  const timelineData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const data = days.map((day, idx) => {
      const created = tasks.filter(t => new Date(t.created_at).getDay() === idx).length;
      const completed = tasks.filter(t => t.status === 'completed' && new Date(t.updated_at || t.created_at).getDay() === idx).length;
      return { name: day, Created: created, Completed: completed };
    });

    const todayIdx = new Date().getDay();
    return [...data.slice(todayIdx + 1), ...data.slice(0, todayIdx + 1)];
  }, [tasks]);

  // 2. Category Performance (Tasks completed vs total)
  const categoryData = useMemo(() => {
    return categories.map(cat => {
      const catTasks = tasks.filter(t => t.categories.some(c => c.id === cat.id));
      const total = catTasks.length;
      const completed = catTasks.filter(t => t.status === 'completed').length;
      return {
        name: cat.name,
        Total: total,
        Completed: completed
      };
    }).filter(c => c.Total > 0);
  }, [tasks, categories]);

  // 3. Priority distribution
  const priorityData = useMemo(() => {
    const low = tasks.filter(t => t.priority === 'low').length;
    const medium = tasks.filter(t => t.priority === 'medium').length;
    const high = tasks.filter(t => t.priority === 'high').length;
    
    return [
      { name: 'Low Priority', value: low, color: '#94a3b8' },
      { name: 'Medium Priority', value: medium, color: '#f97316' },
      { name: 'High Priority', value: high, color: '#f43f5e' }
    ].filter(p => p.value > 0);
  }, [tasks]);

  return (
    <div className="space-y-6">
      
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        
        {/* Total Tasks */}
        <div className="glass-card rounded-2xl p-5 flex items-center justify-between">
          <div>
            <span className="text-slate-400 dark:text-slate-500 text-xs font-semibold uppercase tracking-wider">Completion Rate</span>
            <h3 className="text-2xl font-display font-bold mt-1">{stats.rate}%</h3>
            <p className="text-[10px] text-slate-400 mt-1">{stats.completed} of {stats.total} completed</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-500 flex items-center justify-center">
            <CheckCircle size={20} />
          </div>
        </div>

        {/* Total Estimate */}
        <div className="glass-card rounded-2xl p-5 flex items-center justify-between">
          <div>
            <span className="text-slate-400 dark:text-slate-500 text-xs font-semibold uppercase tracking-wider">Estimated Hours</span>
            <h3 className="text-2xl font-display font-bold mt-1">{stats.totalHours} hrs</h3>
            <p className="text-[10px] text-slate-400 mt-1">{stats.completedHours} hrs completed</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-500 flex items-center justify-center">
            <Clock size={20} />
          </div>
        </div>

        {/* Avg Task Completion Time */}
        <div className="glass-card rounded-2xl p-5 flex items-center justify-between">
          <div>
            <span className="text-slate-400 dark:text-slate-500 text-xs font-semibold uppercase tracking-wider">Avg Estimate</span>
            <h3 className="text-2xl font-display font-bold mt-1">
              {stats.total > 0 ? (stats.totalHours / stats.total).toFixed(1) : 0} hrs
            </h3>
            <p className="text-[10px] text-slate-400 mt-1">Hours budgeted per task</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
            <TrendingUp size={20} />
          </div>
        </div>

        {/* Critical/High items */}
        <div className="glass-card rounded-2xl p-5 flex items-center justify-between">
          <div>
            <span className="text-slate-400 dark:text-slate-500 text-xs font-semibold uppercase tracking-wider">High Priority</span>
            <h3 className="text-2xl font-display font-bold mt-1 text-rose-500">
              {tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length}
            </h3>
            <p className="text-[10px] text-slate-400 mt-1">High priority tasks active</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-500 flex items-center justify-center">
            <AlertTriangle size={20} />
          </div>
        </div>

      </div>

      {/* Chart Rows */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Productivity Velocity Area Chart */}
        <div className="glass-card rounded-3xl p-6">
          <h3 className="font-bold text-sm text-slate-850 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <BarChart3 size={16} className="text-indigo-500" />
            <span>Productivity Velocity</span>
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                <Area type="monotone" dataKey="Created" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorCreated)" />
                <Area type="monotone" dataKey="Completed" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorCompleted)" />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Performance Bar Chart */}
        <div className="glass-card rounded-3xl p-6">
          <h3 className="font-bold text-sm text-slate-850 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <BarChart3 size={16} className="text-purple-500" />
            <span>Category breakdown</span>
          </h3>
          <div className="h-64">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                  <Bar dataKey="Total" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={20} />
                  <Bar dataKey="Completed" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={20} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                <p className="text-xs">Attach categories to tasks to see comparisons.</p>
              </div>
            )}
          </div>
        </div>

        {/* Donut Chart Priority Distribution */}
        {priorityData.length > 0 && (
          <div className="glass-card rounded-3xl p-6 lg:col-span-2">
            <h3 className="font-bold text-sm text-slate-850 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <BarChart3 size={16} className="text-orange-500" />
              <span>Priority composition</span>
            </h3>
            <div className="h-64 flex flex-col md:flex-row items-center justify-around gap-4">
              <div className="w-48 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={priorityData}
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {priorityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {priorityData.map(item => (
                  <div key={item.name} className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 w-28">{item.name}</span>
                    <span className="text-sm font-bold">{item.value} tasks</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
