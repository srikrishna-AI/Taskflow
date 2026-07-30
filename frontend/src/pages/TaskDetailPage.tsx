import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTaskStore, Task, Category, ChecklistItem, TaskMetadata } from '../context/TaskStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  CheckSquare, 
  Plus, 
  Trash2, 
  Eye, 
  Tag, 
  User, 
  FolderPlus,
  X,
  FileText
} from 'lucide-react';
import { toast } from 'react-toastify';
import confetti from 'canvas-confetti';

// Pre-seeded Assignee options
const ASSIGNEES = [
  { name: 'Sarah Connor', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', email: 'sarah@taskflow.so' },
  { name: 'Alex Rivera', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', email: 'alex@taskflow.so' },
  { name: 'Marcus Aurelius', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', email: 'marcus@taskflow.so' }
];

const EMOJIS = ['📝', '💼', '👤', '📚', '🚀', '💡', '🎨', '🔒', '📊', '📱', '🎯', '🛠️', '✨', '🔥', '🎉'];

const GRADIENT_PRESETS = [
  'from-blue-500 to-indigo-600',
  'from-emerald-400 to-teal-600',
  'from-purple-500 to-pink-600',
  'from-orange-400 to-red-500',
  'from-yellow-400 to-amber-500',
  'from-pink-500 to-rose-600'
];

export default function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tasks, categories, createTask, updateTask, deleteTask, createCategory } = useTaskStore();

  const isNew = id === 'new';
  const taskToEdit = useMemo(() => {
    if (isNew) return null;
    return tasks.find(t => t.id === parseInt(id || '', 10));
  }, [id, tasks, isNew]);

  // Form Fields State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'pending' | 'in-progress' | 'completed'>('pending');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [dueDate, setDueDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [reminder, setReminder] = useState('');
  const [estimatedTime, setEstimatedTime] = useState<number>(0);
  const [selectedCatIds, setSelectedCatIds] = useState<number[]>([]);
  const [emoji, setEmoji] = useState('📝');
  const [colorTheme, setColorTheme] = useState('#6366f1');
  const [notes, setNotes] = useState('');
  
  // Checklist State
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newCheckItem, setNewCheckItem] = useState('');

  // Category Creator Modal State
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('📁');
  const [newCatGrad, setNewCatGrad] = useState('from-blue-500 to-indigo-600');
  const [newCatDesc, setNewCatDesc] = useState('');

  // Load Task Fields on Edit
  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || '');
      setStatus(taskToEdit.status);
      setPriority(taskToEdit.priority);
      setDueDate(taskToEdit.due_date ? taskToEdit.due_date.substring(0, 10) : '');
      
      const meta = taskToEdit.meta_data || {};
      setStartDate(meta.startDate ? meta.startDate.substring(0, 10) : '');
      setReminder(meta.reminder ? meta.reminder.substring(0, 16) : '');
      setEstimatedTime(meta.estimatedTime || 0);
      setEmoji(meta.emoji || '📝');
      setColorTheme(meta.colorTheme || '#6366f1');
      setNotes(meta.notes || '');
      setChecklist(meta.checklist || []);
      
      if (taskToEdit.categories) {
        setSelectedCatIds(taskToEdit.categories.map(c => c.id));
      }
    }
  }, [taskToEdit]);

  // Handle Checklist Operations
  const handleAddCheckItem = () => {
    if (!newCheckItem.trim()) return;
    const newItem: ChecklistItem = {
      id: Math.random().toString(36).substr(2, 9),
      text: newCheckItem.trim(),
      completed: false
    };
    setChecklist(prev => [...prev, newItem]);
    setNewCheckItem('');
  };

  const handleToggleCheckItem = (itemId: string) => {
    setChecklist(prev => prev.map(item => 
      item.id === itemId ? { ...item, completed: !item.completed } : item
    ));
  };

  const handleRemoveCheckItem = (itemId: string) => {
    setChecklist(prev => prev.filter(item => item.id !== itemId));
  };

  // Toggle Category selection card
  const handleToggleCategory = (catId: number) => {
    setSelectedCatIds(prev => 
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    );
  };

  // Create Category handler
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    
    const newCat = await createCategory(newCatName.trim(), {
      icon: newCatEmoji,
      gradient: newCatGrad,
      color: '#6366f1',
      description: newCatDesc.trim()
    });

    if (newCat) {
      setSelectedCatIds(prev => [...prev, newCat.id]);
      setCatModalOpen(false);
      setNewCatName('');
      setNewCatDesc('');
      toast.success('Category created successfully!');
    }
  };

  // Main Submit handler
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    // Assignee mapping (just pick the first one for mockup if user selected)
    const assignee = ASSIGNEES[0]; // defaults to Sarah for preview

    // Checklist progress calculation
    const completedCheck = checklist.filter(c => c.completed).length;
    const progressVal = checklist.length > 0 ? Math.round((completedCheck / checklist.length) * 100) : 0;

    const taskMeta: TaskMetadata = {
      startDate: startDate || undefined,
      reminder: reminder || undefined,
      estimatedTime: estimatedTime || undefined,
      emoji,
      colorTheme,
      notes: notes || undefined,
      checklist,
      progress: progressVal,
      assignee
    };

    if (isNew) {
      const created = await createTask({
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        category_ids: selectedCatIds,
        meta_data: taskMeta
      });
      if (created) {
        toast.success('Task created successfully!');
        navigate('/tasks');
      }
    } else if (taskToEdit) {
      if (status === 'completed' && taskToEdit.status !== 'completed') {
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.8 } });
      }
      const success = await updateTask(taskToEdit.id, {
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        category_ids: selectedCatIds,
        meta_data: taskMeta
      });
      if (success) {
        toast.success('Task updated successfully!');
        navigate('/tasks');
      }
    }
  };

  const handleDeleteTask = async () => {
    if (taskToEdit && window.confirm('Delete this task?')) {
      const success = await deleteTask(taskToEdit.id);
      if (success) {
        toast.success('Task deleted');
        navigate('/tasks');
      }
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Header Back button */}
      <div className="flex items-center justify-between pb-2">
        <button 
          onClick={() => navigate('/tasks')}
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to Workspace</span>
        </button>

        {!isNew && (
          <button 
            onClick={handleDeleteTask}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200/50 hover:bg-red-50 text-red-500 text-xs font-semibold dark:border-red-950/30 dark:hover:bg-red-950/20 transition-all"
          >
            <Trash2 size={13} />
            <span>Delete Task</span>
          </button>
        )}
      </div>

      {/* Main Split-Screen Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT PANEL: Form Editor (8 cols) */}
        <div className="lg:col-span-8 bg-white/70 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 md:p-8 space-y-8 shadow-sm">
          
          <form onSubmit={handleSave} className="space-y-6">
            
            {/* Title & Emoji Selector row */}
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              {/* Emoji Picker Dropdown */}
              <div className="relative group">
                <button 
                  type="button"
                  className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-2xl flex items-center justify-center border border-slate-200/50 dark:border-slate-700/50 hover:scale-105 active:scale-95 transition-all shadow-sm"
                >
                  {emoji}
                </button>
                <div className="hidden group-hover:grid absolute left-0 mt-1 w-52 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-750 shadow-2xl p-2 z-40 grid-cols-5 gap-1">
                  {EMOJIS.map(em => (
                    <button 
                      key={em}
                      type="button"
                      onClick={() => setEmoji(em)}
                      className="p-1.5 text-base rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title input */}
              <input 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task Title"
                className="flex-1 bg-transparent border-none outline-none text-xl md:text-2xl font-bold font-display placeholder-slate-400 dark:placeholder-slate-500 text-slate-850 dark:text-white"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Description</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this task about?"
                rows={3}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/60 text-sm outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all leading-relaxed"
              />
            </div>

            {/* Priority & Status pills */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Status Selector */}
              <div className="space-y-2.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Status</label>
                <div className="flex gap-1.5">
                  {['pending', 'in-progress', 'completed'].map(st => {
                    const isSel = status === st;
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setStatus(st as any)}
                        className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-all ${
                          isSel 
                            ? 'bg-indigo-500/10 border-indigo-500 text-indigo-600 dark:text-indigo-400 shadow-sm'
                            : 'bg-transparent border-slate-200/50 dark:border-slate-800/50 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-850'
                        }`}
                      >
                        {st === 'pending' ? 'Todo' : st === 'in-progress' ? 'In Progress' : 'Completed'}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Priority Selector */}
              <div className="space-y-2.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Priority</label>
                <div className="flex gap-1.5">
                  {['low', 'medium', 'high'].map(pr => {
                    const isSel = priority === pr;
                    return (
                      <button
                        key={pr}
                        type="button"
                        onClick={() => setPriority(pr as any)}
                        className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-all uppercase tracking-wider ${
                          isSel 
                            ? pr === 'high' ? 'bg-rose-500/15 border-rose-500 text-rose-500' :
                              pr === 'medium' ? 'bg-orange-500/15 border-orange-500 text-orange-500' :
                              'bg-indigo-550/15 border-indigo-500 text-indigo-500'
                            : 'bg-transparent border-slate-200/50 dark:border-slate-800/50 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-850'
                        }`}
                      >
                        {pr}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Date planning details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              {/* Start Date */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Calendar size={12} />
                  Start Date
                </label>
                <input 
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-55 dark:bg-slate-950 text-xs outline-none focus:border-indigo-500"
                />
              </div>

              {/* Due Date */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Calendar size={12} />
                  Due Date
                </label>
                <input 
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-55 dark:bg-slate-950 text-xs outline-none focus:border-indigo-500"
                />
              </div>

              {/* Estimate hours */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Clock size={12} />
                  Estimate (Hrs)
                </label>
                <input 
                  type="number"
                  min="0"
                  value={estimatedTime || ''}
                  onChange={(e) => setEstimatedTime(parseFloat(e.target.value) || 0)}
                  placeholder="Estimated time..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-55 dark:bg-slate-950 text-xs outline-none focus:border-indigo-500"
                />
              </div>

            </div>

            {/* CATEGORIES CARD PICKER */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Select Categories</label>
                <button
                  type="button"
                  onClick={() => setCatModalOpen(true)}
                  className="text-xs font-semibold text-indigo-500 hover:text-indigo-600 flex items-center gap-0.5"
                >
                  <FolderPlus size={14} />
                  <span>Create Category</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {categories.map(cat => {
                  const isSel = selectedCatIds.includes(cat.id);
                  return (
                    <div
                      key={cat.id}
                      onClick={() => handleToggleCategory(cat.id)}
                      className={`relative flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer select-none transition-all duration-300 ${
                        isSel 
                          ? 'border-indigo-500 bg-indigo-500/5 shadow-md shadow-indigo-500/5'
                          : 'border-slate-200/50 dark:border-slate-850 bg-slate-50/40 dark:bg-slate-950/40 hover:bg-slate-55 dark:hover:bg-slate-900/60'
                      }`}
                    >
                      {/* Check icon or Category Icon */}
                      <span className="text-xl">{cat.meta_data.icon || '📁'}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate">{cat.name}</p>
                      </div>
                      
                      {/* Selection dot */}
                      {isSel && (
                        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-500" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CHECKLISTS CREATOR */}
            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <CheckSquare size={12} />
                Subtasks / Checklist
              </label>

              {/* Add checklist input */}
              <div className="flex gap-2">
                <input 
                  value={newCheckItem}
                  onChange={(e) => setNewCheckItem(e.target.value)}
                  placeholder="Add item..."
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-250 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 text-xs outline-none"
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCheckItem(); } }}
                />
                <button
                  type="button"
                  onClick={handleAddCheckItem}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200"
                >
                  Add
                </button>
              </div>

              {/* Checklist items rendering */}
              <div className="space-y-1.5 mt-2">
                {checklist.map(item => (
                  <div 
                    key={item.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-55/50 dark:bg-slate-950/30 border border-slate-200/20"
                  >
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => handleToggleCheckItem(item.id)}
                        className="rounded accent-indigo-500"
                      />
                      <span className={`text-xs ${item.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
                        {item.text}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveCheckItem(item.id)}
                      className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes / Comments placeholder */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Additional Notes</label>
              <textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special remarks or details..."
                rows={2}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-55 dark:bg-slate-950 text-xs outline-none focus:border-indigo-500"
              />
            </div>

            {/* Save Buttons */}
            <div className="pt-4 flex gap-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => navigate('/tasks')}
                className="flex-1 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
              >
                {isNew ? 'Create Task' : 'Save Changes'}
              </button>
            </div>

          </form>

        </div>

        {/* RIGHT PANEL: Sticky Live Mockup Card Preview (4 cols) */}
        <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Eye size={14} />
            <span className="text-xs font-semibold uppercase tracking-wider">Live Premium Preview</span>
          </div>

          <motion.div
            style={{ borderLeftColor: colorTheme, borderLeftWidth: '4px' }}
            className="glass-panel rounded-3xl p-5 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[220px]"
          >
            {/* Header info */}
            <div>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                  priority === 'high' ? 'bg-rose-500/15 text-rose-500' :
                  priority === 'medium' ? 'bg-orange-500/15 text-orange-500' :
                  'bg-slate-400/15 text-slate-400'
                }`}>{priority}</span>

                <div className="flex gap-1.5">
                  {selectedCatIds.map(catId => {
                    const c = categories.find(cat => cat.id === catId);
                    return c ? (
                      <span key={catId} className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-indigo-500/10 text-indigo-500">
                        {c.meta_data.icon} {c.name}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>

              {/* Title & Emojis */}
              <h3 className="text-base font-bold mt-4 flex items-center gap-2">
                <span>{emoji}</span>
                <span className="truncate">{title || 'Untitled Task'}</span>
              </h3>

              {/* Description */}
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                {description || 'Provide details on the left sheet...'}
              </p>
            </div>

            {/* Checklist progress */}
            {checklist.length > 0 && (
              <div className="mt-4 space-y-1">
                <div className="flex items-center justify-between text-[10px] text-slate-450">
                  <span className="font-semibold">Checklist Completion</span>
                  <span>{checklist.filter(c => c.completed).length}/{checklist.length}</span>
                </div>
                <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300"
                    style={{ width: `${(checklist.filter(c => c.completed).length / checklist.length) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Footer details */}
            <div className="flex items-center justify-between border-t border-slate-150/40 dark:border-slate-800/40 pt-4 mt-6">
              {dueDate ? (
                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <Calendar size={11} />
                  <span>{new Date(dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                </div>
              ) : (
                <div />
              )}

              {estimatedTime > 0 && (
                <div className="flex items-center gap-1 text-[11px] text-slate-400 font-semibold">
                  <Clock size={11} />
                  <span>{estimatedTime} hrs</span>
                </div>
              )}
            </div>

          </motion.div>
        </div>

      </div>

      {/* CREATE CATEGORY MODAL DIALOG */}
      <AnimatePresence>
        {catModalOpen && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl w-full max-w-md shadow-2xl p-6 relative overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-bold text-lg text-slate-850 dark:text-white">Create New Category</h3>
                <button 
                  onClick={() => setCatModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateCategory} className="space-y-5 mt-4">
                {/* Category Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Category Name</label>
                  <input 
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="e.g. Finance, Marketing, Health"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                {/* Emoji Select */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Category Icon (Emoji)</label>
                  <div className="flex flex-wrap gap-1.5 p-2 border border-slate-200 dark:border-slate-850 rounded-xl bg-slate-50 dark:bg-slate-950">
                    {['💼', '👤', '📚', '🚀', '💡', '🎨', '🔒', '📊', '📝', '📱', '🎯', '🛠️', '✈️', '🥗', '💬'].map(em => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => setNewCatEmoji(em)}
                        className={`text-lg p-1.5 rounded-md transition-all ${newCatEmoji === em ? 'bg-indigo-500 text-white scale-110 shadow-md' : 'hover:bg-slate-200 dark:hover:bg-slate-800'}`}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Gradient Picker */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Color Gradient Theme</label>
                  <div className="grid grid-cols-6 gap-2">
                    {GRADIENT_PRESETS.map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setNewCatGrad(preset)}
                        className={`h-8 rounded-lg bg-gradient-to-r ${preset} border transition-all ${
                          newCatGrad === preset 
                            ? 'ring-2 ring-indigo-500 ring-offset-2 scale-105 border-transparent' 
                            : 'border-slate-200/50 dark:border-slate-800/50'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Description</label>
                  <textarea 
                    value={newCatDesc}
                    onChange={(e) => setNewCatDesc(e.target.value)}
                    placeholder="Short summary for this category..."
                    rows={2}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 text-xs outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Save button */}
                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setCatModalOpen(false)}
                    className="flex-1 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:shadow-lg"
                  >
                    Save Category
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
