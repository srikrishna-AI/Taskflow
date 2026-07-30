import React, { useState, useMemo } from 'react';
import { Task, useTaskStore } from '../context/TaskStore';
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday, 
  addMonths, 
  subMonths, 
  format 
} from 'date-fns';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalIcon,
  Plus,
  Clock
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CalendarViewProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onAddTask: (date: Date) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ tasks, onEditTask, onAddTask }) => {
  const { updateTask } = useTaskStore();
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // Navigation
  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handleGoToToday = () => setCurrentMonth(new Date());

  // Generate Calendar Days list using date-fns
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  // Handle Drag Over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Handle Drop on Day Cell
  const handleDropOnDay = async (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault();
    const taskIdStr = e.dataTransfer.getData('text/plain');
    if (!taskIdStr) return;

    const taskId = parseInt(taskIdStr, 10);
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    await updateTask(taskId, {
      due_date: targetDate.toISOString()
    });

    // Trigger subtle success sound/confetti
    confetti({
      particleCount: 15,
      spread: 20,
      origin: { y: 0.8 },
      colors: ['#6366f1', '#a855f7']
    });
  };

  // Drag Start for tasks inside calendar
  const handleDragStart = (e: React.DragEvent, task: Task) => {
    e.dataTransfer.setData('text/plain', task.id.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  // Group tasks by exact day for fast calendar cell lookup
  const tasksByDay = useMemo(() => {
    const map: Record<string, Task[]> = {};
    tasks.forEach(task => {
      if (!task.due_date) return;
      const key = format(new Date(task.due_date), 'yyyy-MM-dd');
      if (!map[key]) map[key] = [];
      map[key].push(task);
    });
    return map;
  }, [tasks]);

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-16rem)] min-h-[550px] w-full overflow-y-auto pb-4">
      
      {/* Calendar Grid Section */}
      <div className="flex-1 bg-white/70 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-5 flex flex-col h-full shadow-sm">
        
        {/* Header toolbar */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <CalIcon className="text-indigo-500" size={20} />
            <h2 className="text-lg font-bold tracking-tight font-display text-slate-850 dark:text-white">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handleGoToToday}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Today
            </button>
            <button 
              onClick={handlePrevMonth}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-650"
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              onClick={handleNextMonth}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-655"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1 text-center py-3 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d}>{d}</div>
          ))}
        </div>

        {/* Monthly Grid */}
        <div className="grid grid-cols-7 auto-rows-fr gap-1 flex-1 mt-2">
          {calendarDays.map((day, idx) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayTasks = tasksByDay[dateKey] || [];
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isTodayDay = isToday(day);

            return (
              <div
                key={idx}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDropOnDay(e, day)}
                className={`relative min-h-[70px] border border-slate-100 dark:border-slate-850 rounded-xl p-1.5 flex flex-col justify-between hover:bg-slate-50/50 dark:hover:bg-slate-900/30 group transition-colors ${
                  isCurrentMonth ? '' : 'opacity-40'
                } ${
                  isTodayDay 
                    ? 'bg-indigo-500/5 dark:bg-indigo-500/10 border-indigo-500/30 ring-1 ring-indigo-500/10' 
                    : 'bg-white dark:bg-slate-950'
                }`}
              >
                {/* Cell Header */}
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center ${
                    isTodayDay 
                      ? 'bg-indigo-500 text-white shadow-md' 
                      : 'text-slate-400 dark:text-slate-500'
                  }`}>
                    {day.getDate()}
                  </span>
                  
                  {/* Plus button to add task directly to day */}
                  <button
                    onClick={() => onAddTask(day)}
                    className="p-0.5 rounded bg-slate-105 dark:bg-slate-800 text-slate-400 opacity-0 group-hover:opacity-100 hover:text-indigo-500 transition-opacity"
                    title="Add task to this day"
                  >
                    <Plus size={10} />
                  </button>
                </div>

                {/* Day Tasks List */}
                <div className="flex-1 overflow-y-auto mt-1 space-y-1 select-none scrollbar-none max-h-[60px]">
                  {dayTasks.map(task => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task)}
                      onClick={(e) => { e.stopPropagation(); onEditTask(task); }}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-medium truncate cursor-pointer transition-all border ${
                        task.status === 'completed'
                          ? 'bg-slate-50/40 text-slate-400 line-through border-slate-200/50 dark:border-slate-800/40'
                          : 'bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:scale-[1.02]'
                      }`}
                    >
                      {task.meta_data.emoji && <span className="mr-0.5">{task.meta_data.emoji}</span>}
                      {task.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Sidebar - Upcoming events summary */}
      <div className="w-full lg:w-72 bg-white/70 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-5 flex flex-col h-full shadow-sm">
        <h3 className="font-bold text-sm text-slate-850 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <Clock size={16} className="text-purple-500" />
          <span>Upcoming Agenda</span>
        </h3>
        
        <div className="flex-1 overflow-y-auto space-y-3">
          {tasks.filter(t => t.due_date && t.status !== 'completed').slice(0, 5).map(task => (
            <div 
              key={task.id} 
              onClick={() => onEditTask(task)}
              className="p-3 rounded-2xl border border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-950/60 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/60 hover:border-indigo-500/30 transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-1">
                <span className="text-xs font-semibold leading-tight line-clamp-1">{task.title}</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-500 shrink-0">
                  {task.priority}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1">
                <CalIcon size={10} />
                {task.due_date ? format(new Date(task.due_date), 'PPP') : 'No Date'}
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
