import React, { useState, useRef, useEffect } from 'react';
import styles from './TodoItem.module.css';

/**
 * @param {{ todo: object, onToggle: fn, onEdit: fn, onDelete: fn, onUpdateReminder?: fn, isModalOpen?: boolean, anyModalOpen?: boolean, onModalOpen?: fn, onModalClose?: fn }} props
 */
export default function TodoItem({ todo, onToggle, onEdit, onDelete, onUpdateReminder, isModalOpen = false, anyModalOpen = false, onModalOpen, onModalClose }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(todo.title);
  const inputRef = useRef(null);
  const checkId = `check-${todo.id}`;

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  // Handle modal open - notify parent
  function handleReminderModalOpen() {
    if (onModalOpen) onModalOpen();
  }

  function handleEditStart() {
    setEditValue(todo.title);
    setIsEditing(true);
  }

  function handleEditSave() {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== todo.title) {
      onEdit(todo.id, trimmed);
    }
    setIsEditing(false);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleEditSave();
    if (e.key === 'Escape') setIsEditing(false);
  }

  // Format reminder date for display
  function formatReminderDate(reminderAt) {
    if (!reminderAt) return null;
    const date = new Date(reminderAt);
    return date.toLocaleString();
  }

  return (
    <li 
      className={`${styles.item} ${todo.completed ? styles.completed : ''} ${!isModalOpen && anyModalOpen ? styles.itemDisabled : ''}`}
      tabIndex={!isModalOpen && anyModalOpen ? -1 : 0}
      onFocus={(e) => {
        if (!isModalOpen && anyModalOpen) {
          e.target.blur();
        }
      }}
    >
      {/* Custom checkbox */}
      <div className={styles.checkboxWrap}>
        <input
          type="checkbox"
          id={checkId}
          className={styles.checkbox}
          checked={todo.completed}
          onChange={() => onToggle(todo.id)}
        />
        <label htmlFor={checkId} className={styles.checkmark}>
          {todo.completed && '✓'}
        </label>
      </div>

      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          className={styles.editInput}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleEditSave}
          onKeyDown={handleKeyDown}
        />
      ) : (
        <span
          className={styles.title}
          onDoubleClick={handleEditStart}
          title="Double-click to edit"
        >
          {todo.title}
        </span>
      )}

      <div className={styles.actions}>
        {/* Reminder button */}
        <button
          className={`${styles.reminderBtn} ${todo.reminder_at ? styles.reminderActive : ''} ${todo.completed ? styles.disabled : ''}`}
          onClick={() => !todo.completed && handleReminderModalOpen()}
          aria-label="Set reminder"
          title={todo.reminder_at ? `Reminder: ${formatReminderDate(todo.reminder_at)}` : 'Set reminder'}
          disabled={todo.completed}
        >
          {todo.notification_sent ? '🔔' : '⏰'}
        </button>
        
        {!isEditing && (
          <button
            className={`${styles.editBtn} ${todo.completed ? styles.disabled : ''}`}
            onClick={handleEditStart}
            aria-label="Edit todo"
            title="Edit"
            disabled={todo.completed}
          >
            ✏️
          </button>
        )}
        <button
          className={`${styles.deleteBtn} ${todo.completed ? styles.disabled : ''}`}
          onClick={() => onDelete(todo.id)}
          aria-label="Delete todo"
          title="Delete"
          disabled={todo.completed}
        >
          🗑️
        </button>
      </div>
    </li>
  );
}
