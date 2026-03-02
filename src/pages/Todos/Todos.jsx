import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar/Navbar';
import TodoItem from '../../components/TodoItem/TodoItem';
import { getTodos, createTodo, updateTodo, deleteTodo } from '../../lib/todosApi';
import styles from './Todos.module.css';
import itemStyles from '../../components/TodoItem/TodoItem.module.css';

export default function Todos() {
  const { user } = useAuth();
  const [todos, setTodos] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'active' | 'completed'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openModalTodoId, setOpenModalTodoId] = useState(null); // Track which todo has modal open
  const [reminderModalData, setReminderModalData] = useState(null); // Store todo data for modal

  // Toggle body class when modal is open
  useEffect(() => {
    if (openModalTodoId) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [openModalTodoId]);

  // Fetch todos from the API
  const fetchTodos = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await getTodos();
      // Transform to match expected format
      setTodos(data.map(t => ({
        id: t.id,
        title: t.title,
        completed: t.completed,
        createdAt: t.created_at,
        reminder_at: t.reminder_at,
        notification_sent: t.notification_sent
      })));
    } catch (err) {
      console.error('Error fetching todos:', err);
      setError('Failed to load todos. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  async function handleAdd(e) {
    e.preventDefault();
    const trimmed = newTitle.trim();
    if (!trimmed) return;

    try {
      const newTodo = await createTodo(trimmed, false);
      setTodos(prev => [{
        id: newTodo.id,
        title: newTodo.title,
        completed: newTodo.completed,
        createdAt: newTodo.created_at,
        reminder_at: newTodo.reminder_at,
        notification_sent: newTodo.notification_sent
      }, ...prev]);
      setNewTitle('');
    } catch (err) {
      console.error('Error creating todo:', err);
      setError('Failed to create todo. Please try again.');
    }
  }

  async function handleToggle(id) {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    try {
      await updateTodo(id, { completed: !todo.completed });
      setTodos(prev =>
        prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
      );
    } catch (err) {
      console.error('Error updating todo:', err);
      setError('Failed to update todo. Please try again.');
    }
  }

  async function handleEdit(id, newTitle) {
    const trimmed = newTitle.trim();
    if (!trimmed) return;

    try {
      await updateTodo(id, { title: trimmed });
      setTodos(prev =>
        prev.map(t => t.id === id ? { ...t, title: trimmed } : t)
      );
    } catch (err) {
      console.error('Error updating todo:', err);
      setError('Failed to update todo. Please try again.');
    }
  }

  async function handleDelete(id) {
    try {
      await deleteTodo(id);
      setTodos(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error('Error deleting todo:', err);
      setError('Failed to delete todo. Please try again.');
    }
  }

  // Handle reminder update
  async function handleUpdateReminder(id, reminderAt) {
    try {
      await updateTodo(id, { reminder_at: reminderAt });
      setTodos(prev =>
        prev.map(t => t.id === id ? { 
          ...t, 
          reminder_at: reminderAt,
          notification_sent: false // Reset notification_sent when reminder is updated
        } : t)
      );
    } catch (err) {
      console.error('Error updating reminder:', err);
      setError('Failed to update reminder. Please try again.');
    }
  }

  async function handleClearCompleted() {
    const completedTodos = todos.filter(t => t.completed);
    
    try {
      await Promise.all(completedTodos.map(t => deleteTodo(t.id)));
      setTodos(prev => prev.filter(t => !t.completed));
    } catch (err) {
      console.error('Error clearing completed:', err);
      setError('Failed to clear completed todos. Please try again.');
    }
  }

  const filteredTodos = todos.filter(t => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const activeCount = todos.filter(t => !t.completed).length;
  const completedCount = todos.filter(t => t.completed).length;

  const emptyMessages = {
    all: { icon: '📋', text: 'No todos yet. Add one above!' },
    active: { icon: '🎉', text: 'All caught up! No active todos.' },
    completed: { icon: '📭', text: 'No completed todos yet.' },
  };

  // Format reminder date for display
  function formatReminderDate(reminderAt) {
    if (!reminderAt) return null;
    const date = new Date(reminderAt);
    return date.toLocaleString();
  }

  // Convert reminder_at to datetime-local format
  function getReminderDateTimeLocal(reminderAt) {
    if (!reminderAt) return '';
    const date = new Date(reminderAt);
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60000);
    return localDate.toISOString().slice(0, 16);
  }

  return (
    <div className={styles.page}>
      <Navbar />

      <main className={styles.main}>
        <div className={styles.container}>
          {/* Error message */}
          {error && (
            <div className={styles.error}>
              {error}
              <button onClick={() => setError(null)}>×</button>
            </div>
          )}

          {/* Header */}
          <div className={styles.header}>
            <h2 className={styles.heading}>My Todos</h2>
            <p className={styles.subheading}>
              {loading
                ? 'Loading...'
                : todos.length === 0
                  ? 'Start by adding your first task'
                  : `${activeCount} task${activeCount !== 1 ? 's' : ''} remaining`}
            </p>
          </div>

          {/* Stats badges */}
          {todos.length > 0 && (
            <div className={styles.stats}>
              <span className={styles.statBadge}>
                <strong>{todos.length}</strong> total
              </span>
              <span className={styles.statBadge}>
                <strong>{activeCount}</strong> active
              </span>
              <span className={styles.statBadge}>
                <strong>{completedCount}</strong> done
              </span>
            </div>
          )}

          {/* Add todo form */}
          <form onSubmit={handleAdd} className={styles.addForm}>
            <input
              type="text"
              className={styles.addInput}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="What needs to be done?"
              aria-label="New todo title"
              disabled={loading}
            />
            <button type="submit" className={styles.addBtn} disabled={!newTitle.trim() || loading}>
              + Add
            </button>
          </form>

          {/* Filter tabs */}
          {todos.length > 0 && (
            <div className={styles.filters}>
              {['all', 'active', 'completed'].map((f) => (
                <button
                  key={f}
                  className={`${styles.filterBtn} ${filter === f ? styles.activeFilter : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          )}

          {/* Loading state */}
          {loading && todos.length === 0 ? (
            <div className={styles.empty}>
              <span>Loading todos...</span>
            </div>
          ) : filteredTodos.length === 0 ? (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>{emptyMessages[filter].icon}</span>
              <span>{emptyMessages[filter].text}</span>
            </div>
          ) : (
            <ul className={styles.list}>
              {filteredTodos.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onToggle={handleToggle}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onUpdateReminder={handleUpdateReminder}
                  isModalOpen={openModalTodoId === todo.id}
                  anyModalOpen={openModalTodoId !== null}
                  onModalOpen={() => {
                    setOpenModalTodoId(todo.id);
                    setReminderModalData(todo);
                  }}
                  onModalClose={() => setOpenModalTodoId(null)}
                />
              ))}
            </ul>
          )}

          {/* Reminder Modal - rendered at parent level to prevent flickering */}
          {openModalTodoId && reminderModalData && (
            <div className={itemStyles.modalBackdrop} onClick={() => setOpenModalTodoId(null)}>
              <div className={itemStyles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={itemStyles.modalHeader}>
                  <h3>Set Reminder</h3>
                  <button 
                    className={itemStyles.modalClose}
                    onClick={() => setOpenModalTodoId(null)}
                  >
                    ×
                  </button>
                </div>
                <div className={itemStyles.modalBody}>
                  <label className={itemStyles.reminderLabel}>
                    <span>Select date and time:</span>
                    <input
                      type="datetime-local"
                      className={itemStyles.reminderInput}
                      value={getReminderDateTimeLocal(reminderModalData.reminder_at)}
                      onChange={(e) => {
                        const newReminder = e.target.value ? new Date(e.target.value).toISOString() : null;
                        handleUpdateReminder(reminderModalData.id, newReminder);
                        setOpenModalTodoId(null);
                      }}
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </label>
                  {reminderModalData.reminder_at && (
                    <p className={itemStyles.currentReminder}>
                      Current reminder: {formatReminderDate(reminderModalData.reminder_at)}
                    </p>
                  )}
                </div>
                <div className={itemStyles.modalFooter}>
                  {reminderModalData.reminder_at && (
                    <button
                      className={itemStyles.clearReminderBtn}
                      onClick={() => {
                        handleUpdateReminder(reminderModalData.id, null);
                        setOpenModalTodoId(null);
                      }}
                    >
                      Clear Reminder
                    </button>
                  )}
                  <button
                    className={itemStyles.modalDoneBtn}
                    onClick={() => setOpenModalTodoId(null)}
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Footer stats */}
          {todos.length > 0 && (
            <div className={styles.footer}>
              <span className={styles.count}>
                {activeCount} item{activeCount !== 1 ? 's' : ''} left
              </span>
              {completedCount > 0 && (
                <button
                  className={styles.clearBtn}
                  onClick={handleClearCompleted}
                >
                  Clear completed ({completedCount})
                </button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
