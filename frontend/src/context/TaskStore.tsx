import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth, api } from './AuthContext';

// TypeScript Interfaces for TaskFlow App
export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Comment {
  id: string;
  user: string;
  avatar?: string;
  text: string;
  createdAt: string;
}

export interface TaskMetadata {
  startDate?: string;
  reminder?: string;
  estimatedTime?: number; // in hours
  tags?: string[];
  assignee?: {
    name: string;
    avatar: string;
    email: string;
  };
  attachmentsCount?: number;
  checklist?: ChecklistItem[];
  subtasks?: Subtask[];
  comments?: Comment[];
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'none';
    days?: string[];
  };
  colorTheme?: string; // HEX or CSS class
  emoji?: string;
  dependencies?: number[]; // task IDs
  notes?: string;
  progress?: number; // 0 - 100
}

export interface Task {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
  created_at: string;
  updated_at: string;
  categories: { id: number; name: string }[];
  meta_data: TaskMetadata;
}

export interface CategoryMetadata {
  icon?: string;
  gradient?: string; // gradient CSS string
  color?: string;
  description?: string;
}

export interface Category {
  id: number;
  name: string;
  meta_data: CategoryMetadata;
  task_count?: number;
  completion_rate?: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  timestamp: string;
  taskId?: number;
}

interface TaskFilters {
  status: string;
  priority: string;
  category: string;
  search: string;
  sortBy: 'due_date' | 'created_at' | 'priority' | 'alphabetical';
  sortOrder: 'asc' | 'desc';
}

interface TaskStoreType {
  tasks: Task[];
  categories: Category[];
  notifications: Notification[];
  loading: boolean;
  isOffline: boolean;
  filters: TaskFilters;
  setFilters: React.Dispatch<React.SetStateAction<TaskFilters>>;
  
  // Task Actions
  createTask: (taskData: Partial<Task> & { category_ids?: number[] }) => Promise<Task | null>;
  updateTask: (taskId: number, fields: Partial<Task> & { category_ids?: number[] }) => Promise<boolean>;
  deleteTask: (taskId: number) => Promise<boolean>;
  duplicateTask: (task: Task) => Promise<Task | null>;
  
  // Category Actions
  createCategory: (name: string, meta: CategoryMetadata) => Promise<Category | null>;
  updateCategory: (catId: number, name: string, meta: CategoryMetadata) => Promise<boolean>;
  deleteCategory: (catId: number) => Promise<boolean>;
  
  // Notification Actions
  addNotification: (title: string, message: string, type: Notification['type'], taskId?: number) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotification: (id: string) => void;
  
  // Stats
  refreshData: () => Promise<void>;
}

const TaskStoreContext = createContext<TaskStoreType | null>(null);

// Premium Mock Categories for Offline/Initial Seeding
const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 1001,
    name: 'Work',
    meta_data: {
      icon: '💼',
      gradient: 'from-blue-500 to-indigo-600',
      color: '#4f46e5',
      description: 'Main product engineering and design work tasks.'
    }
  },
  {
    id: 1002,
    name: 'Personal',
    meta_data: {
      icon: '👤',
      gradient: 'from-emerald-400 to-teal-600',
      color: '#059669',
      description: 'Errands, workouts, life admin, and chores.'
    }
  },
  {
    id: 1003,
    name: 'Study',
    meta_data: {
      icon: '📚',
      gradient: 'from-purple-500 to-pink-600',
      color: '#9333ea',
      description: 'Skill development, books, and courses.'
    }
  },
  {
    id: 1004,
    name: 'Projects',
    meta_data: {
      icon: '🚀',
      gradient: 'from-orange-400 to-red-500',
      color: '#ea580c',
      description: 'Side projects, startup research, and builds.'
    }
  },
  {
    id: 1005,
    name: 'Ideas',
    meta_data: {
      icon: '💡',
      gradient: 'from-yellow-400 to-amber-500',
      color: '#d97706',
      description: 'Brainstorms, future feature concepts, and drafts.'
    }
  }
];

// Premium Mock Tasks for Offline/Initial Seeding
const DEFAULT_TASKS: Task[] = [
  {
    id: 2001,
    title: 'Redesign workspace settings panel',
    description: 'Create a modern tabbed layout for settings with a gradient visual appearance list, keyboard shortcut cards, and layout toggles.',
    status: 'in-progress',
    priority: 'high',
    due_date: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days from now
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date().toISOString(),
    categories: [{ id: 1001, name: 'Work' }],
    meta_data: {
      emoji: '🎨',
      estimatedTime: 5,
      assignee: { name: 'Sarah Connor', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', email: 'sarah@taskflow.so' },
      tags: ['Design', 'UI/UX'],
      checklist: [
        { id: 'c1', text: 'Outline visual look with glassmorphism panels', completed: true },
        { id: 'c2', text: 'Build collapsible sidebar setting toggle', completed: false },
        { id: 'c3', text: 'Wire up confetti triggers on setting save', completed: false }
      ],
      subtasks: [
        { id: 's1', title: 'Design system variables sync', completed: true },
        { id: 's2', title: 'Responsive grid validation', completed: false }
      ],
      comments: [
        { id: 'co1', user: 'Marcus Aurelius', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', text: 'I love the glass effect on the cards!', createdAt: new Date(Date.now() - 3600000 * 4).toISOString() }
      ],
      progress: 33,
      notes: 'Make sure it is mobile responsive and matches the 8px layout grid.'
    }
  },
  {
    id: 2002,
    title: 'Implement JWT auth flow',
    description: 'Ensure passwords are encrypted, tokens are issued and saved securely in client cookies or localStorage, and route guards protect authenticated paths.',
    status: 'completed',
    priority: 'high',
    due_date: new Date(Date.now() - 86400000).toISOString(), // yesterday
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date().toISOString(),
    categories: [{ id: 1001, name: 'Work' }],
    meta_data: {
      emoji: '🔒',
      estimatedTime: 8,
      assignee: { name: 'Alex Rivera', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', email: 'alex@taskflow.so' },
      tags: ['Security', 'Backend'],
      checklist: [
        { id: 'c4', text: 'Setup bcrypt password hashing', completed: true },
        { id: 'c5', text: 'Create token sign endpoint', completed: true },
        { id: 'c6', text: 'Verify route redirect guards', completed: true }
      ],
      progress: 100,
      comments: []
    }
  },
  {
    id: 2003,
    title: 'Setup Recharts analytics widgets',
    description: 'Create widgets displaying completion history, priority distributions using donut charts, and a completion speed tracker.',
    status: 'pending',
    priority: 'medium',
    due_date: new Date(Date.now() + 86400000 * 5).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    categories: [{ id: 1004, name: 'Projects' }],
    meta_data: {
      emoji: '📊',
      estimatedTime: 4,
      assignee: { name: 'Sarah Connor', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', email: 'sarah@taskflow.so' },
      tags: ['Analytics', 'Frontend'],
      checklist: [
        { id: 'c7', text: 'Design donut chart for task priorities', completed: false },
        { id: 'c8', text: 'Render weekly activity bar graph', completed: false }
      ],
      progress: 0
    }
  },
  {
    id: 2004,
    title: 'Draft Q3 Product Roadmap proposal',
    description: 'Coordinate key deliverables with product leads. Focus on automation integration, teams boards, and offline support features.',
    status: 'pending',
    priority: 'low',
    due_date: new Date(Date.now() + 86400000 * 10).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    categories: [{ id: 1005, name: 'Ideas' }],
    meta_data: {
      emoji: '📝',
      estimatedTime: 2,
      tags: ['Product', 'Planning'],
      progress: 0
    }
  },
  {
    id: 2005,
    title: 'Fix navigation lag on mobile screens',
    description: 'Optimize page rendering transitions, disable unnecessary re-renders on sidebar close, and throttle heavy window event hooks.',
    status: 'completed',
    priority: 'medium',
    due_date: new Date(Date.now() - 86400000 * 2).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    updated_at: new Date().toISOString(),
    categories: [{ id: 1002, name: 'Personal' }],
    meta_data: {
      emoji: '📱',
      estimatedTime: 3,
      assignee: { name: 'Alex Rivera', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', email: 'alex@taskflow.so' },
      tags: ['Performance', 'Mobile'],
      progress: 100
    }
  }
];

export const TaskStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [filters, setFilters] = useState<TaskFilters>({
    status: '',
    priority: '',
    category: '',
    search: '',
    sortBy: 'due_date',
    sortOrder: 'asc'
  });

  // Notifications
  const addNotification = (title: string, message: string, type: Notification['type'], taskId?: number) => {
    const newNotif: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      message,
      type,
      read: false,
      timestamp: new Date().toISOString(),
      taskId
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Main Loader
  const loadData = async () => {
    setLoading(true);
    // 1. Try to load categories first
    let cats: Category[] = [];
    let localMode = false;
    
    if (user) {
      try {
        const response = await api.get('/categories');
        cats = response.data.map((c: any) => ({
          ...c,
          meta_data: c.meta_data || {}
        }));
        setIsOffline(false);
      } catch (err) {
        console.warn('Backend categories fetch failed, falling back to local mode.', err);
        localMode = true;
        setIsOffline(true);
      }
    } else {
      localMode = true;
    }

    if (localMode) {
      // Local Storage Load
      const storedCats = localStorage.getItem('tf_categories');
      if (storedCats) {
        try {
          cats = JSON.parse(storedCats).map((c: any) => ({
            ...c,
            meta_data: c.meta_data || {}
          }));
        } catch (e) {
          cats = DEFAULT_CATEGORIES;
          localStorage.setItem('tf_categories', JSON.stringify(cats));
        }
      } else {
        cats = DEFAULT_CATEGORIES;
        localStorage.setItem('tf_categories', JSON.stringify(cats));
      }
    }
    setCategories(cats);

    // 2. Load Tasks
    let tskList: Task[] = [];
    if (user && !localMode) {
      try {
        const response = await api.get('/tasks', { params: { size: 100 } });
        // Make sure tasks have correct metadata structure
        tskList = response.data.items.map((t: any) => ({
          ...t,
          meta_data: t.meta_data || {}
        }));
      } catch (err) {
        console.warn('Backend tasks fetch failed, falling back to local mode.', err);
        setIsOffline(true);
        localMode = true;
      }
    }

    if (localMode) {
      const storedTasks = localStorage.getItem('tf_tasks');
      if (storedTasks) {
        try {
          tskList = JSON.parse(storedTasks).map((t: any) => ({
            ...t,
            meta_data: t.meta_data || {}
          }));
        } catch (e) {
          tskList = DEFAULT_TASKS;
          localStorage.setItem('tf_tasks', JSON.stringify(tskList));
        }
      } else {
        tskList = DEFAULT_TASKS;
        localStorage.setItem('tf_tasks', JSON.stringify(tskList));
      }
    }
    setTasks(tskList);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Periodic LocalStorage syncing when Offline
  useEffect(() => {
    if (isOffline && !loading) {
      localStorage.setItem('tf_tasks', JSON.stringify(tasks));
      localStorage.setItem('tf_categories', JSON.stringify(categories));
    }
  }, [tasks, categories, isOffline, loading]);

  // Task Actions
  const createTask = async (taskData: Partial<Task> & { category_ids?: number[] }): Promise<Task | null> => {
    if (user && !isOffline) {
      try {
        const response = await api.post('/tasks', {
          title: taskData.title,
          description: taskData.description,
          status: taskData.status || 'pending',
          priority: taskData.priority || 'medium',
          due_date: taskData.due_date,
          category_ids: taskData.category_ids,
          meta_data: taskData.meta_data || {}
        });
        
        // Fetch created task details or reload
        const newTaskId = response.data.id;
        const taskResponse = await api.get(`/tasks/${newTaskId}`);
        const newTask: Task = {
          ...taskResponse.data,
          meta_data: taskResponse.data.meta_data || {}
        };
        setTasks(prev => [newTask, ...prev]);
        addNotification('Task Created', `"${newTask.title}" has been successfully added.`, 'success', newTask.id);
        return newTask;
      } catch (err) {
        console.error('Backend task create failed. Creating locally.', err);
        // Don't throw, just allow local operation
      }
    }

    // Local/Offline Mode Fallback
    const localCats = categories.filter(c => taskData.category_ids?.includes(c.id));
    const newTask: Task = {
      id: Math.floor(Math.random() * 100000),
      title: taskData.title || 'Untitled Task',
      description: taskData.description || '',
      status: taskData.status as any || 'pending',
      priority: taskData.priority as any || 'medium',
      due_date: taskData.due_date || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      categories: localCats.map(c => ({ id: c.id, name: c.name })),
      meta_data: taskData.meta_data || {}
    };

    setTasks(prev => [newTask, ...prev]);
    addNotification('Task Created (Offline)', `"${newTask.title}" created locally.`, 'info', newTask.id);
    return newTask;
  };

  const updateTask = async (taskId: number, fields: Partial<Task> & { category_ids?: number[] }): Promise<boolean> => {
    const originalTask = tasks.find(t => t.id === taskId);
    if (!originalTask) return false;

    // Trigger notification if task completion status changes to completed
    const wasCompleted = originalTask.status === 'completed';
    const isCompleted = fields.status === 'completed';
    
    // Optimistic Update
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const mergedCats = fields.category_ids 
          ? categories.filter(c => fields.category_ids?.includes(c.id)).map(c => ({ id: c.id, name: c.name }))
          : t.categories;
        return {
          ...t,
          ...fields,
          categories: mergedCats,
          meta_data: { ...t.meta_data, ...(fields.meta_data || {}) },
          updated_at: new Date().toISOString()
        } as Task;
      }
      return t;
    }));

    if (isCompleted && !wasCompleted) {
      addNotification('Task Completed! 🎉', `"${originalTask.title}" has been completed.`, 'success', taskId);
    }

    if (user && !isOffline && taskId < 1000000000) { // check if database-managed ID
      try {
        await api.put(`/tasks/${taskId}`, {
          title: fields.title !== undefined ? fields.title : originalTask.title,
          description: fields.description !== undefined ? fields.description : originalTask.description,
          status: fields.status !== undefined ? fields.status : originalTask.status,
          priority: fields.priority !== undefined ? fields.priority : originalTask.priority,
          due_date: fields.due_date !== undefined ? fields.due_date : originalTask.due_date,
          category_ids: fields.category_ids !== undefined ? fields.category_ids : originalTask.categories.map(c => c.id),
          meta_data: { ...originalTask.meta_data, ...(fields.meta_data || {}) }
        });
        return true;
      } catch (err) {
        console.error('Backend update failed. Task updated locally.', err);
      }
    }
    return true;
  };

  const deleteTask = async (taskId: number): Promise<boolean> => {
    const taskToDelete = tasks.find(t => t.id === taskId);
    if (!taskToDelete) return false;

    setTasks(prev => prev.filter(t => t.id !== taskId));
    addNotification('Task Deleted', `"${taskToDelete.title}" has been removed.`, 'warning');

    if (user && !isOffline && taskId < 1000000000) {
      try {
        await api.delete(`/tasks/${taskId}`);
        return true;
      } catch (err) {
        console.error('Backend delete failed. Task removed locally.', err);
      }
    }
    return true;
  };

  const duplicateTask = async (task: Task): Promise<Task | null> => {
    return createTask({
      title: `${task.title} (Copy)`,
      description: task.description,
      status: task.status,
      priority: task.priority,
      due_date: task.due_date,
      category_ids: task.categories.map(c => c.id),
      meta_data: {
        ...task.meta_data,
        checklist: task.meta_data.checklist?.map(item => ({ ...item, id: Math.random().toString(36).substr(2, 9), completed: false })) || [],
        subtasks: task.meta_data.subtasks?.map(item => ({ ...item, id: Math.random().toString(36).substr(2, 9), completed: false })) || [],
        comments: [],
        progress: 0
      }
    });
  };

  // Category Actions
  const createCategory = async (name: string, meta: CategoryMetadata): Promise<Category | null> => {
    if (user && !isOffline) {
      try {
        const response = await api.post('/categories', {
          name,
          meta_data: meta
        });
        const newCat: Category = response.data;
        setCategories(prev => [...prev, newCat]);
        return newCat;
      } catch (err) {
        console.error('Backend category create failed. Creating locally.', err);
      }
    }

    const newCat: Category = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      name,
      meta_data: meta
    };
    setCategories(prev => [...prev, newCat]);
    return newCat;
  };

  const updateCategory = async (catId: number, name: string, meta: CategoryMetadata): Promise<boolean> => {
    setCategories(prev => prev.map(c => c.id === catId ? { ...c, name, meta_data: { ...c.meta_data, ...meta } } : c));
    
    // Update category name in tasks categories list as well
    setTasks(prev => prev.map(t => ({
      ...t,
      categories: t.categories.map(c => c.id === catId ? { ...c, name } : c)
    })));

    if (user && !isOffline && catId < 1000000000) {
      try {
        await api.put(`/categories/${catId}`, {
          name,
          meta_data: meta
        });
        return true;
      } catch (err) {
        console.error('Backend category update failed.', err);
      }
    }
    return true;
  };

  const deleteCategory = async (catId: number): Promise<boolean> => {
    setCategories(prev => prev.filter(c => c.id !== catId));
    // Remove relation from all tasks
    setTasks(prev => prev.map(t => ({
      ...t,
      categories: t.categories.filter(c => c.id !== catId)
    })));

    if (user && !isOffline && catId < 1000000000) {
      try {
        await api.delete(`/categories/${catId}`);
        return true;
      } catch (err) {
        console.error('Backend category delete failed.', err);
      }
    }
    return true;
  };

  // Re-load trigger
  const refreshData = async () => {
    await loadData();
  };

  // Memoized Filtered & Sorted Tasks
  const value = useMemo(() => ({
    tasks,
    categories,
    notifications,
    loading,
    isOffline,
    filters,
    setFilters,
    createTask,
    updateTask,
    deleteTask,
    duplicateTask,
    createCategory,
    updateCategory,
    deleteCategory,
    addNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotification,
    refreshData
  }), [tasks, categories, notifications, loading, isOffline, filters]);

  return <TaskStoreContext.Provider value={value}>{children}</TaskStoreContext.Provider>;
};

export const useTaskStore = () => {
  const context = useContext(TaskStoreContext);
  if (!context) {
    throw new Error('useTaskStore must be used within a TaskStoreProvider');
  }
  return context;
};
