import React, { useState, useMemo } from 'react';
import { Task, useTaskStore } from '../context/TaskStore';
import { TaskCard } from './TaskCard';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Kanban, 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  EyeOff, 
  Eye
} from 'lucide-react';

interface KanbanViewProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onAddTask: (status: 'pending' | 'in-progress' | 'completed') => void;
}

interface Column {
  id: string;
  title: string;
  status: 'pending' | 'in-progress' | 'completed';
  color: string;
}

const KANBAN_COLUMNS: Column[] = [
  { id: 'Todo', title: 'Todo', status: 'pending', color: 'bg-slate-400' },
  { id: 'In Progress', title: 'In Progress', status: 'in-progress', color: 'bg-indigo-500' },
  { id: 'Review', title: 'Review', status: 'in-progress', color: 'bg-orange-500' },
  { id: 'Completed', title: 'Completed', status: 'completed', color: 'bg-emerald-500' }
];

export const KanbanView: React.FC<KanbanViewProps> = ({ tasks, onEditTask, onAddTask }) => {
  const { updateTask } = useTaskStore();
  const [collapsedCols, setCollapsedCols] = useState<Record<string, boolean>>({});
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  // Group tasks by their Kanban column
  const groupedTasks = useMemo(() => {
    const groups: Record<string, Task[]> = {
      'Todo': [],
      'In Progress': [],
      'Review': [],
      'Completed': []
    };

    tasks.forEach(task => {
      // Determine columns based on status and metadata override
      let col = 'Todo';
      if (task.status === 'completed') {
        col = 'Completed';
      } else if (task.status === 'in-progress') {
        col = task.meta_data.notes?.includes('[Review]') || task.meta_data.tags?.includes('Review') 
          ? 'Review' 
          : 'In Progress';
      } else {
        col = 'Todo';
      }
      
      if (groups[col]) {
        groups[col].push(task);
      } else {
        groups['Todo'].push(task);
      }
    });

    return groups;
  }, [tasks]);

  const toggleCollapse = (colId: string) => {
    setCollapsedCols(prev => ({ ...prev, [colId]: !prev[colId] }));
  };

  // Drag and Drop Handlers
  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    setDragOverCol(colId);
  };

  const handleDragLeave = () => {
    setDragOverCol(null);
  };

  const handleDrop = async (e: React.DragEvent, targetCol: Column) => {
    e.preventDefault();
    setDragOverCol(null);
    const taskIdStr = e.dataTransfer.getData('text/plain');
    if (!taskIdStr) return;
    
    const taskId = parseInt(taskIdStr, 10);
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Determine new status and notes/tag tags
    let newStatus = targetCol.status;
    let updatedTags = [...(task.meta_data.tags || [])];
    let notesText = task.meta_data.notes || '';

    if (targetCol.id === 'Review') {
      if (!updatedTags.includes('Review')) updatedTags.push('Review');
      if (!notesText.includes('[Review]')) notesText = `[Review] ${notesText}`.trim();
    } else {
      updatedTags = updatedTags.filter(t => t !== 'Review');
      notesText = notesText.replace('[Review]', '').trim();
    }

    await updateTask(taskId, {
      status: newStatus,
      meta_data: {
        ...task.meta_data,
        tags: updatedTags,
        notes: notesText,
        progress: newStatus === 'completed' ? 100 : (targetCol.id === 'In Progress' ? 50 : 0)
      }
    });
  };

  return (
    <div className="flex h-[calc(100vh-12rem)] w-full gap-4 overflow-x-auto pb-4 select-none">
      <AnimatePresence>
        {KANBAN_COLUMNS.map(col => {
          const isCollapsed = collapsedCols[col.id];
          const colTasks = groupedTasks[col.id] || [];
          const isDraggingOver = dragOverCol === col.id;

          if (isCollapsed) {
            return (
              <motion.div
                key={`collapsed-${col.id}`}
                layout
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 48 }}
                exit={{ opacity: 0, width: 0 }}
                className="flex flex-col items-center py-4 bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200/40 dark:border-slate-800/40 rounded-2xl cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-800/30"
                onClick={() => toggleCollapse(col.id)}
              >
                <div className="flex-1 flex flex-col items-center justify-between">
                  <span className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
                  <span className="writing-mode-vertical text-xs font-bold uppercase tracking-wider text-slate-500 transform rotate-180 py-4 select-none">
                    {col.title}
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800">
                    {colTasks.length}
                  </span>
                </div>
              </motion.div>
            );
          }

          return (
            <motion.div
              key={`expanded-${col.id}`}
              layout
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col)}
              className={`flex flex-col flex-shrink-0 w-80 h-full bg-slate-100/40 dark:bg-slate-900/20 border rounded-3xl p-4 transition-colors duration-200 ${
                isDraggingOver 
                  ? 'border-indigo-500/50 bg-indigo-500/5' 
                  : 'border-slate-200/30 dark:border-slate-800/20'
              }`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${col.color}`} />
                  <h3 className="font-bold text-sm text-slate-850 dark:text-slate-200">{col.title}</h3>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-200/60 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400">
                    {colTasks.length}
                  </span>
                </div>
                
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => onAddTask(col.status)}
                    className="p-1 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800/80 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                  <button 
                    onClick={() => toggleCollapse(col.id)}
                    className="p-1 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800/80 text-slate-400 hover:text-slate-650 transition-colors"
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>
              </div>

              {/* Cards Container */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {colTasks.length > 0 ? (
                  colTasks.map(task => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      onEdit={onEditTask} 
                    />
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400">
                    <p className="text-xs">Drag tasks here</p>
                  </div>
                )}
              </div>

            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
