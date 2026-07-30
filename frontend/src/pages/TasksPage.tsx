import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTaskStore, Task } from '../context/TaskStore';
import { useAuth } from '../context/AuthContext';
import { KanbanView } from '../components/KanbanView';
import { CalendarView } from '../components/CalendarView';
import { AnalyticsView } from '../components/AnalyticsView';
import { TaskCard } from '../components/TaskCard';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { toast } from 'react-toastify';
import { 
  List, 
  Kanban, 
  Calendar as CalIcon, 
  BarChart3, 
  Plus, 
  Search, 
  SlidersHorizontal,
  X,
  PlusCircle,
  FileText,
  Clock,
  CheckCircle2,
  MessageSquare,
  Paperclip,
  AlertTriangle,
  User,
  Copy,
  Trash2,
  Edit3,
  CheckSquare
} from 'lucide-react';

export default function TasksPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { tasks, categories, filters, setFilters, createTask, updateTask, deleteTask, duplicateTask } = useTaskStore();


  // Tab View State: list, kanban, calendar, analytics
  const activeView = (searchParams.get('view') as 'list' | 'kanban' | 'calendar' | 'analytics') || 'list';

  // Apply filters in memory (offline-first & fast search sync)
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // 1. Status Filter
      if (filters.status && task.status !== filters.status) return false;
      
      // 2. Priority Filter
      if (filters.priority && task.priority !== filters.priority) return false;
      
      // 3. Category Filter
      if (filters.category) {
        const catId = parseInt(filters.category, 10);
        if (!task.categories.some(c => c.id === catId)) return false;
      }
      
      // 4. Search query
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesDesc = task.description.toLowerCase().includes(q);
        const matchesTags = task.meta_data.tags?.some(t => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesDesc && !matchesTags) return false;
      }

      return true;
    }).sort((a, b) => {
      // Sorting
      if (filters.sortBy === 'due_date') {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
      if (filters.sortBy === 'priority') {
        const val = { high: 3, medium: 2, low: 1 };
        return val[b.priority] - val[a.priority];
      }
      if (filters.sortBy === 'alphabetical') {
        return a.title.localeCompare(b.title);
      }
      // default: created_at desc
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [tasks, filters]);

  // Group tasks by status for List View
  const listGroups = useMemo(() => {
    return {
      'pending': filteredTasks.filter(t => t.status === 'pending'),
      'in-progress': filteredTasks.filter(t => t.status === 'in-progress'),
      'completed': filteredTasks.filter(t => t.status === 'completed')
    };
  }, [filteredTasks]);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [newCommentText, setNewCommentText] = useState('');

  const handleSetView = (view: 'list' | 'kanban' | 'calendar' | 'analytics') => {
    setSearchParams({ view });
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
  };

  const handleToggleCheckItemDetail = async (taskId: number, itemId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const currentChecklist = task.meta_data.checklist || [];
    const updatedChecklist = currentChecklist.map(item => 
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    
    // Calculate new progress
    const completedCount = updatedChecklist.filter(item => item.completed).length;
    const progressVal = updatedChecklist.length > 0 
      ? Math.round((completedCount / updatedChecklist.length) * 100) 
      : 0;

    const success = await updateTask(taskId, {
      meta_data: {
        ...task.meta_data,
        checklist: updatedChecklist,
        progress: progressVal
      }
    });

    if (success) {
      setSelectedTask(prev => prev ? {
        ...prev,
        meta_data: {
          ...prev.meta_data,
          checklist: updatedChecklist,
          progress: progressVal
        }
      } : null);
    }
  };

  const handleAddComment = async (taskId: number) => {
    if (!newCommentText.trim()) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const newComment = {
      id: Math.random().toString(36).substr(2, 9),
      user: user?.username || 'Demo User',
      text: newCommentText.trim(),
      createdAt: new Date().toISOString()
    };
    
    const currentComments = task.meta_data.comments || [];
    const updatedComments = [...currentComments, newComment];

    const success = await updateTask(taskId, {
      meta_data: {
        ...task.meta_data,
        comments: updatedComments
      }
    });

    if (success) {
      setNewCommentText('');
      setSelectedTask(prev => prev ? {
        ...prev,
        meta_data: {
          ...prev.meta_data,
          comments: updatedComments
        }
      } : null);
      toast.success('Comment added!');
    }
  };

  const handleDeleteDetail = async (taskId: number) => {
    if (window.confirm('Delete this task?')) {
      const success = await deleteTask(taskId);
      if (success) {
        setSelectedTask(null);
        toast.success('Task deleted successfully');
      }
    }
  };

  const handleDuplicateDetail = async (task: Task) => {
    const duplicated = await duplicateTask(task);
    if (duplicated) {
      setSelectedTask(null);
      toast.success('Task duplicated successfully');
    }
  };

  const handleAddTask = async (defaultStatus?: 'pending' | 'in-progress' | 'completed', defaultDate?: Date) => {
    navigate('/tasks/new');
  };

  // Sync Search query param with filter
  useEffect(() => {
    const q = searchParams.get('search');
    if (q) {
      setFilters(prev => ({ ...prev, search: q }));
    }
    const cat = searchParams.get('category');
    if (cat) {
      setFilters(prev => ({ ...prev, category: cat }));
    }
  }, [searchParams]);

  return (
    <div className="space-y-6">
      
      {/* Workspace Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/40 dark:border-slate-800/40 pb-4">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-slate-850 dark:text-white">Tasks Workspace</h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Manage tasks in List, Kanban, Calendar, or Analytics views.</p>
        </div>

        {/* View Toggle Switches */}
        <div className="flex items-center gap-1 p-1 bg-slate-100/60 dark:bg-slate-900/60 backdrop-blur-md rounded-xl border border-slate-200/30 dark:border-slate-800/30 shrink-0">
          <button 
            onClick={() => handleSetView('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              activeView === 'list' 
                ? 'bg-white dark:bg-slate-800 text-indigo-500 dark:text-white shadow-sm' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <List size={13} />
            <span className="hidden sm:inline">List</span>
          </button>
          <button 
            onClick={() => handleSetView('kanban')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              activeView === 'kanban' 
                ? 'bg-white dark:bg-slate-800 text-indigo-500 dark:text-white shadow-sm' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Kanban size={13} />
            <span className="hidden sm:inline">Board</span>
          </button>
          <button 
            onClick={() => handleSetView('calendar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              activeView === 'calendar' 
                ? 'bg-white dark:bg-slate-800 text-indigo-500 dark:text-white shadow-sm' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <CalIcon size={13} />
            <span className="hidden sm:inline">Calendar</span>
          </button>
          <button 
            onClick={() => handleSetView('analytics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              activeView === 'analytics' 
                ? 'bg-white dark:bg-slate-800 text-indigo-500 dark:text-white shadow-sm' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <BarChart3 size={13} />
            <span className="hidden sm:inline">Charts</span>
          </button>
        </div>
      </div>

      {/* FILTER PILLS ROW */}
      {(filters.status || filters.priority || filters.category || filters.search) && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] uppercase font-bold text-slate-400">Active Filters:</span>
          {filters.search && (
            <span className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              Search: "{filters.search}"
              <X size={10} className="cursor-pointer text-slate-400 hover:text-slate-650" onClick={() => setFilters(p => ({ ...p, search: '' }))} />
            </span>
          )}
          {filters.status && (
            <span className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 capitalize">
              Status: {filters.status.replace('-', ' ')}
              <X size={10} className="cursor-pointer text-slate-400 hover:text-slate-650" onClick={() => setFilters(p => ({ ...p, status: '' }))} />
            </span>
          )}
          {filters.priority && (
            <span className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-full bg-rose-500/10 text-rose-500 capitalize">
              Priority: {filters.priority}
              <X size={10} className="cursor-pointer text-rose-400 hover:text-rose-650" onClick={() => setFilters(p => ({ ...p, priority: '' }))} />
            </span>
          )}
          {filters.category && (
            <span className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              Category: {categories.find(c => c.id.toString() === filters.category)?.name || 'Custom'}
              <X size={10} className="cursor-pointer text-emerald-400 hover:text-emerald-650" onClick={() => setFilters(p => ({ ...p, category: '' }))} />
            </span>
          )}
          <button 
            onClick={() => setFilters({
              status: '',
              priority: '',
              category: '',
              search: '',
              sortBy: 'due_date',
              sortOrder: 'asc'
            })}
            className="text-xs text-slate-400 hover:text-indigo-500 font-semibold"
          >
            Reset all
          </button>
        </div>
      )}

      {/* VIEW SWAP CONTENT */}
      <div>
        {activeView === 'list' && (
          <div className="space-y-6">
            
            {/* Status groupings */}
            {['pending', 'in-progress', 'completed'].map(grp => {
              const grpTasks = listGroups[grp as 'pending' | 'in-progress' | 'completed'] || [];
              const groupTitle = grp === 'pending' ? 'Todo' : grp === 'in-progress' ? 'In Progress' : 'Completed';
              const groupColor = grp === 'pending' ? 'border-slate-400 text-slate-500 bg-slate-100 dark:bg-slate-800' : grp === 'in-progress' ? 'border-indigo-500 text-indigo-500 bg-indigo-500/10' : 'border-emerald-500 text-emerald-500 bg-emerald-500/10';

              return (
                <div key={grp} className="space-y-3">
                  {/* Category Section title header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${groupColor}`}>{groupTitle}</span>
                      <span className="text-xs font-bold text-slate-400">{grpTasks.length}</span>
                    </div>
                    {grp === 'pending' && (
                      <button 
                        onClick={() => handleAddTask('pending')}
                        className="text-xs font-semibold text-indigo-500 hover:text-indigo-600 flex items-center gap-0.5 transition-colors"
                      >
                        <Plus size={14} />
                        <span>Add Task</span>
                      </button>
                    )}
                  </div>

                  {/* List Tasks cards */}
                  {grpTasks.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {grpTasks.map(task => (
                        <TaskCard 
                          key={task.id} 
                          task={task} 
                          onEdit={handleEditTask} 
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5 p-4 border border-dashed border-slate-200 dark:border-slate-850 rounded-2xl text-slate-400 dark:text-slate-500">
                      <FileText size={16} />
                      <span className="text-xs">No tasks in this section.</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {activeView === 'kanban' && (
          <KanbanView 
            tasks={filteredTasks} 
            onEditTask={handleEditTask}
            onAddTask={(status) => handleAddTask(status)} 
          />
        )}

        {activeView === 'calendar' && (
          <CalendarView 
            tasks={filteredTasks} 
            onEditTask={handleEditTask}
            onAddTask={(date) => handleAddTask('pending', date)} 
          />
        )}

        {activeView === 'analytics' && (
          <AnalyticsView 
            tasks={filteredTasks} 
            categories={categories} 
          />
        )}
      </div>

      {/* TASK DETAIL READ-ONLY MODAL (WITH EDIT TRIGGERS) */}
      <AnimatePresence>
        {selectedTask && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl w-full max-w-2xl shadow-2xl p-6 md:p-8 relative overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{selectedTask.meta_data.emoji || '📋'}</span>
                  <h2 className="font-bold text-lg text-slate-850 dark:text-white truncate max-w-[320px]">
                    {selectedTask.title}
                  </h2>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const taskId = selectedTask.id;
                      setSelectedTask(null);
                      navigate(`/tasks/${taskId}`);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-650 text-white text-xs font-semibold hover:shadow-lg transition-all"
                  >
                    <Edit3 size={13} />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => setSelectedTask(null)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-650"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Scrollable details container */}
              <div className="flex-1 overflow-y-auto py-5 space-y-6 text-slate-800 dark:text-slate-150">
                
                {/* Meta details grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-955/40 border border-slate-100 dark:border-slate-800/80">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Status</span>
                    <p className="text-xs font-semibold mt-1 capitalize text-indigo-500">{selectedTask.status.replace('-', ' ')}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Priority</span>
                    <p className={`text-xs font-bold mt-1 capitalize ${
                      selectedTask.priority === 'high' ? 'text-rose-500' :
                      selectedTask.priority === 'medium' ? 'text-orange-500' : 'text-slate-550'
                    }`}>{selectedTask.priority}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Due Date</span>
                    <p className="text-xs font-semibold mt-1 text-slate-600 dark:text-slate-350">
                      {selectedTask.due_date ? new Date(selectedTask.due_date).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'No due date'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Estimate</span>
                    <p className="text-xs font-semibold mt-1 text-slate-600 dark:text-slate-350">
                      {selectedTask.meta_data.estimatedTime ? `${selectedTask.meta_data.estimatedTime} hrs` : 'None'}
                    </p>
                  </div>
                </div>

                {/* Description */}
                {selectedTask.description && (
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Description</h3>
                    <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      {selectedTask.description}
                    </p>
                  </div>
                )}

                {/* Subtask Checklist */}
                {selectedTask.meta_data.checklist && selectedTask.meta_data.checklist.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckSquare size={13} />
                      Subtasks Checklist
                    </h3>
                    <div className="space-y-2">
                      {selectedTask.meta_data.checklist.map(item => (
                        <div 
                          key={item.id}
                          className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50/50 dark:bg-slate-955/20 border border-slate-200/10 cursor-pointer select-none"
                          onClick={() => handleToggleCheckItemDetail(selectedTask.id, item.id)}
                        >
                          <input 
                            type="checkbox"
                            checked={item.completed}
                            onChange={() => {}} 
                            className="rounded accent-indigo-500 text-indigo-500 pointer-events-none"
                          />
                          <span className={`text-xs ${item.completed ? 'line-through text-slate-400 dark:text-slate-600' : 'text-slate-700 dark:text-slate-300'}`}>
                            {item.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Additional Notes */}
                {selectedTask.meta_data.notes && (
                  <div className="space-y-1.5 p-4 rounded-2xl bg-amber-50/5 dark:bg-amber-950/5 border border-amber-500/10 text-xs text-amber-700 dark:text-amber-400/80">
                    <h4 className="font-bold">Creator Notes:</h4>
                    <p className="mt-1 leading-relaxed">{selectedTask.meta_data.notes}</p>
                  </div>
                )}

                {/* Comments Section */}
                <div className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-5">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare size={13} />
                    Comments ({selectedTask.meta_data.comments?.length || 0})
                  </h3>
                  
                  {/* Comments List */}
                  <div className="space-y-3 max-h-40 overflow-y-auto pr-1">
                    {selectedTask.meta_data.comments && selectedTask.meta_data.comments.length > 0 ? (
                      selectedTask.meta_data.comments.map(c => (
                        <div key={c.id} className="p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200/20 text-xs">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-indigo-600 dark:text-indigo-400">{c.user}</span>
                            <span className="text-[10px] text-slate-450">
                              {new Date(c.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{c.text}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 dark:text-slate-500 italic py-1">No comments posted yet.</p>
                    )}
                  </div>

                  {/* Add Comment Input */}
                  <div className="flex gap-2">
                    <input 
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      placeholder="Add a comment..."
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-955 text-xs outline-none focus:border-indigo-500"
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddComment(selectedTask.id); } }}
                    />
                    <button
                      type="button"
                      onClick={() => handleAddComment(selectedTask.id)}
                      className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 transition-colors"
                    >
                      Post
                    </button>
                  </div>
                </div>

              </div>

              {/* Modal Footer Controls */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handleDuplicateDetail(selectedTask)}
                  className="flex items-center gap-1 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 transition-colors"
                >
                  <Copy size={13} />
                  <span>Duplicate</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteDetail(selectedTask.id)}
                  className="flex items-center gap-1 px-3.5 py-2 text-xs font-semibold rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-955/20 transition-all"
                >
                  <Trash2 size={13} />
                  <span>Delete</span>
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
