import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTaskStore, Category, CategoryMetadata } from '../context/TaskStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Folder, 
  FolderPlus, 
  Trash2, 
  Edit, 
  CheckCircle, 
  Clock, 
  X 
} from 'lucide-react';
import { toast } from 'react-toastify';

const GRADIENT_PRESETS = [
  'from-blue-500 to-indigo-600',
  'from-emerald-400 to-teal-600',
  'from-purple-500 to-pink-600',
  'from-orange-400 to-red-500',
  'from-yellow-400 to-amber-500',
  'from-pink-500 to-rose-600'
];

export default function CategoriesPage() {
  const navigate = useNavigate();
  const { tasks, categories, createCategory, updateCategory, deleteCategory } = useTaskStore();

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📁');
  const [gradient, setGradient] = useState('from-blue-500 to-indigo-600');
  const [description, setDescription] = useState('');

  // Calculate metrics for each category (offline-first & fast calculation)
  const categoryStats = useMemo(() => {
    return categories.map(cat => {
      const catTasks = tasks.filter(t => t.categories.some(c => c.id === cat.id));
      const total = catTasks.length;
      const completed = catTasks.filter(t => t.status === 'completed').length;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      return {
        ...cat,
        total,
        completed,
        rate
      };
    });
  }, [tasks, categories]);

  const handleOpenCreate = () => {
    setEditId(null);
    setName('');
    setIcon('📁');
    setGradient('from-blue-500 to-indigo-600');
    setDescription('');
    setModalOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditId(cat.id);
    setName(cat.name);
    setIcon(cat.meta_data.icon || '📁');
    setGradient(cat.meta_data.gradient || 'from-blue-500 to-indigo-600');
    setDescription(cat.meta_data.description || '');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const meta: CategoryMetadata = {
      icon,
      gradient,
      color: '#6366f1',
      description: description.trim()
    };

    if (editId) {
      const success = await updateCategory(editId, name.trim(), meta);
      if (success) {
        toast.success('Category updated successfully');
      }
    } else {
      const newCat = await createCategory(name.trim(), meta);
      if (newCat) {
        toast.success('Category created successfully');
      }
    }
    setModalOpen(false);
  };

  const handleDelete = async (catId: number, catName: string) => {
    if (window.confirm(`Are you sure you want to delete category "${catName}"? This will detach it from all tasks.`)) {
      await deleteCategory(catId);
      toast.success('Category deleted');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-slate-200/40 dark:border-slate-800/40 pb-4">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-slate-850 dark:text-white">Categories Grid</h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Organize tasks into spaces, project categories, or goals.</p>
        </div>

        <button 
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-sm hover:shadow-lg hover:shadow-indigo-500/20 transition-all duration-200"
        >
          <FolderPlus size={16} />
          <span>New Category</span>
        </button>
      </div>

      {/* Grid of Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categoryStats.map(cat => (
          <motion.div
            key={cat.id}
            whileHover={{ y: -4, scale: 1.01 }}
            onClick={() => navigate(`/tasks?category=${cat.id}`)}
            className="glass-panel rounded-3xl p-5 relative overflow-hidden flex flex-col justify-between shadow-sm min-h-[190px] cursor-pointer"
          >
            {/* Top row */}
            <div>
              <div className="flex items-start justify-between">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${cat.meta_data.gradient} flex items-center justify-center text-xl text-white shadow-md`}>
                  {cat.meta_data.icon || '📁'}
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                  <button 
                    onClick={() => handleOpenEdit(cat)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-650"
                  >
                    <Edit size={13} />
                  </button>
                  <button 
                    onClick={() => handleDelete(cat.id, cat.name)}
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-955/20 text-slate-400 hover:text-red-500"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Title & Description */}
              <h3 className="font-bold text-base mt-4 text-slate-850 dark:text-white leading-tight">{cat.name}</h3>
              {cat.meta_data.description && (
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {cat.meta_data.description}
                </p>
              )}
            </div>

            {/* Progress indicators */}
            <div className="mt-6 space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
              <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
                <span className="flex items-center gap-1">
                  <CheckCircle size={10} />
                  {cat.completed} of {cat.total} Tasks Completed
                </span>
                <span>{cat.rate}%</span>
              </div>
              <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300"
                  style={{ width: `${cat.rate}%` }}
                />
              </div>
            </div>

          </motion.div>
        ))}
      </div>

      {/* CREATE / EDIT CATEGORY MODAL */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl w-full max-w-md shadow-2xl p-6 relative overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-bold text-lg text-slate-850 dark:text-white">
                  {editId ? 'Edit Category' : 'Create New Category'}
                </h3>
                <button 
                  onClick={() => setModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-650"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-5 mt-4">
                {/* Category Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Category Name</label>
                  <input 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Health, Work, Study"
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
                        onClick={() => setIcon(em)}
                        className={`text-lg p-1.5 rounded-md transition-all ${icon === em ? 'bg-indigo-500 text-white scale-110 shadow-md' : 'hover:bg-slate-200 dark:hover:bg-slate-800'}`}
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
                        onClick={() => setGradient(preset)}
                        className={`h-8 rounded-lg bg-gradient-to-r ${preset} border transition-all ${
                          gradient === preset 
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
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Short summary for this category..."
                    rows={2}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 text-xs outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Save button */}
                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="flex-1 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:shadow-lg"
                  >
                    {editId ? 'Save Changes' : 'Create Category'}
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
