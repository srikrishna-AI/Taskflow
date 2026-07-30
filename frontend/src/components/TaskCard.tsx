import React from 'react';
import { Task, useTaskStore } from '../context/TaskStore';
import { motion } from 'framer-motion';
import {
  Clock,
  Paperclip,
  MessageSquare,
  CheckSquare,
  Copy,
  Trash2,
  Edit,
  CheckCircle2,
  Circle,
  MoreVertical,
  Calendar
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit }) => {
  const { updateTask, deleteTask, duplicateTask } = useTaskStore();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  React.useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', clickOutside);
    return () => document.removeEventListener('mousedown', clickOutside);
  }, []);

  const handleToggleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    
    if (newStatus === 'completed') {
      // Confetti burst!
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#6366f1', '#a855f7', '#10b981', '#f97316']
      });
    }

    await updateTask(task.id, { 
      status: newStatus,
      meta_data: {
        ...task.meta_data,
        progress: newStatus === 'completed' ? 100 : 0
      }
    });
  };

  const handleToggleCheckItemInline = async (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    const currentChecklist = task.meta_data.checklist || [];
    const updatedChecklist = currentChecklist.map(item => 
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    
    // Calculate new progress
    const completedCount = updatedChecklist.filter(item => item.completed).length;
    const progressVal = updatedChecklist.length > 0 
      ? Math.round((completedCount / updatedChecklist.length) * 100) 
      : 0;

    await updateTask(task.id, {
      meta_data: {
        ...task.meta_data,
        checklist: updatedChecklist,
        progress: progressVal
      }
    });

    if (progressVal === 100 && task.status !== 'completed') {
      confetti({
        particleCount: 40,
        spread: 30,
        origin: { y: 0.85 },
        colors: ['#6366f1', '#a855f7']
      });
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Delete "${task.title}"?`)) {
      await deleteTask(task.id);
    }
  };

  const handleDuplicate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await duplicateTask(task);
    setMenuOpen(false);
  };

  // Drag operations
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', task.id.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  // Subtask/Checklist progress
  const checklistStats = React.useMemo(() => {
    const items = task.meta_data.checklist || [];
    if (items.length === 0) return null;
    const completed = items.filter(i => i.completed).length;
    const percentage = Math.round((completed / items.length) * 100);
    return { completed, total: items.length, percentage };
  }, [task.meta_data.checklist]);

  const priorityColor = {
    high: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20',
    medium: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/20',
    low: 'bg-slate-500/10 text-slate-650 dark:text-slate-400 border-slate-500/10'
  };

  const formattedDate = React.useMemo(() => {
    if (!task.due_date) return null;
    const d = new Date(task.due_date);
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }, [task.due_date]);

  const isOverdue = React.useMemo(() => {
    if (task.status === 'completed' || !task.due_date) return false;
    return new Date(task.due_date) < new Date();
  }, [task.due_date, task.status]);

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={() => onEdit(task)}
      className={`glass-card rounded-2xl p-4.5 cursor-grab active:cursor-grabbing border hover:-translate-y-1 hover:scale-[1.01] transition-all duration-300 ${
        task.status === 'completed' 
          ? 'bg-slate-50/40 dark:bg-slate-900/30 opacity-75 border-slate-200/40 dark:border-slate-800/40' 
          : 'border-slate-200/50 dark:border-slate-800/50'
      }`}
    >
      {/* Card Header (Category, Priority, and More Actions menu) */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {/* Priority */}
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${priorityColor[task.priority]}`}>
            {task.priority}
          </span>
          {/* Category */}
          {task.categories && task.categories.map(cat => (
            <span key={cat.id} className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/10">
              {cat.name}
            </span>
          ))}
        </div>

        {/* More Actions Menu */}
        <div className="relative" ref={menuRef} onClick={e => e.stopPropagation()}>
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <MoreVertical size={14} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-1 w-36 rounded-xl bg-white dark:bg-slate-850 border border-slate-200/50 dark:border-slate-800/50 shadow-xl p-1 z-30">
              <button 
                onClick={() => { onEdit(task); setMenuOpen(false); }}
                className="flex items-center gap-2 w-full text-left px-2.5 py-1.5 text-xs rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-355"
              >
                <Edit size={12} />
                <span>Quick Edit</span>
              </button>
              <button 
                onClick={handleDuplicate}
                className="flex items-center gap-2 w-full text-left px-2.5 py-1.5 text-xs rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-355"
              >
                <Copy size={12} />
                <span>Duplicate</span>
              </button>
              <button 
                onClick={handleDelete}
                className="flex items-center gap-2 w-full text-left px-2.5 py-1.5 text-xs rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
              >
                <Trash2 size={12} />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Task Title & Status Toggle */}
      <div className="flex items-start gap-2.5 mt-3">
        <button 
          onClick={handleToggleComplete}
          className={`flex-shrink-0 mt-0.5 text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors`}
        >
          {task.status === 'completed' ? (
            <CheckCircle2 size={17} className="text-emerald-500" />
          ) : (
            <Circle size={17} />
          )}
        </button>
        <div className="min-w-0 flex-1">
          <h4 className={`text-sm font-semibold truncate text-slate-850 dark:text-slate-100 ${
            task.status === 'completed' ? 'line-through text-slate-400 dark:text-slate-550' : ''
          }`}>
            {task.meta_data.emoji && <span className="mr-1">{task.meta_data.emoji}</span>}
            {task.title}
          </h4>
          {task.description && (
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}
        </div>
      </div>

      {/* Checklist Progress Bar */}
      {checklistStats && (
        <div className="mt-4 space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 dark:text-slate-500">
            <span className="flex items-center gap-1">
              <CheckSquare size={10} />
              Checklist
            </span>
            <span>{checklistStats.completed}/{checklistStats.total} ({checklistStats.percentage}%)</span>
          </div>
          <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300"
              style={{ width: `${checklistStats.percentage}%` }}
            />
          </div>
          
          {/* Subtasks checklist items directly on Card */}
          <div className="mt-2.5 pt-1 space-y-1.5 max-h-24 overflow-y-auto pr-1" onClick={e => e.stopPropagation()}>
            {task.meta_data.checklist?.map(item => (
              <div 
                key={item.id} 
                onClick={(e) => handleToggleCheckItemInline(e, item.id)}
                className="flex items-center gap-2 group/check cursor-pointer"
              >
                <input 
                  type="checkbox" 
                  checked={item.completed} 
                  onChange={() => {}} 
                  className="rounded text-indigo-500 accent-indigo-500 pointer-events-none w-3.5 h-3.5" 
                />
                <span className={`text-[11px] truncate ${item.completed ? 'line-through text-slate-400 dark:text-slate-600' : 'text-slate-600 dark:text-slate-405'}`}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Card Footer (Due Date, Indicators, Assignee Avatar) */}
      <div className="flex items-center justify-between gap-2 mt-4.5 pt-3 border-t border-slate-150/40 dark:border-slate-800/40">
        
        {/* Due Date Indicator */}
        {formattedDate ? (
          <div className={`flex items-center gap-1 text-[11px] font-medium ${
            isOverdue 
              ? 'text-rose-500 font-semibold' 
              : 'text-slate-400 dark:text-slate-500'
          }`}>
            <Calendar size={11} />
            <span>{formattedDate}</span>
          </div>
        ) : (
          <div />
        )}

        {/* Icons & Assignee */}
        <div className="flex items-center gap-3">
          
          {/* Attachments / Comments Indicator */}
          <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
            {task.meta_data.comments && task.meta_data.comments.length > 0 && (
              <span className="flex items-center gap-0.5" title="Comments">
                <MessageSquare size={11} />
                {task.meta_data.comments.length}
              </span>
            )}
            {task.meta_data.attachmentsCount && task.meta_data.attachmentsCount > 0 ? (
              <span className="flex items-center gap-0.5" title="Attachments">
                <Paperclip size={11} />
                {task.meta_data.attachmentsCount}
              </span>
            ) : null}
          </div>

          {/* Assignee Initials Badge */}
          {task.meta_data.assignee ? (
            <div 
              title={`Assigned to ${task.meta_data.assignee.name}`}
              className="w-5.5 h-5.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-[8px] font-bold"
            >
              {task.meta_data.assignee.name.split(' ').map((n: string) => n[0]).join('')}
            </div>
          ) : (
            <div className="w-5.5 h-5.5 rounded-full border border-dashed border-slate-300 dark:border-slate-750 flex items-center justify-center text-[8px] text-slate-450" title="Unassigned">
              +
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
