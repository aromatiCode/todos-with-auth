import React, { useState, useRef, useEffect } from 'react';
import styles from './TodoItem.module.css';

/**
 * @param {{ todo: object, onToggle: fn, onEdit: fn, onDelete: fn, onUpdateReminder?: fn }} props
 */
export default function TodoItem({ todo, onToggle, onEdit, onDelete, onUpdateReminder }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(todo.title);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const inputRef = useRef(null);
  const checkId = `check-${todo.id}`;

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

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

  // Handle reminder change
  function handleReminderChange(e) {
    const newReminder = e.target.value ? new Date(e.target.value).toISOString() : null;
    if (onUpdateReminder) {
      onUpdateReminder(todo.id, newReminder);
    }
    setShowReminderModal(false);
  }

  // Close modal when clicking outside
  function handleModalBackdropClick(e) {
    if (e.target === e.currentTarget) {
      setShowReminderModal(false);
    }
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
    <li className={`${styles.item} ${todo.completed ? styles.completed : ''}`}>
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
          className={`${styles.reminderBtn} ${todo.reminder_at ? styles.reminderActive : ''}`}
          onClick={() => setShowReminderModal(true)}
          aria-label="Set reminder"
          title={todo.reminder_at ? `Reminder: ${formatReminderDate(todo.reminder_at)}` : 'Set reminder'}
        >
          {todo.notification_sent ? '🔔' : '⏰'}
        </button>
        
        {!isEditing && (
          <button
            className={styles.editBtn}
            onClick={handleEditStart}
            aria-label="Edit todo"
            title="Edit"
          >
            ✏️
          </button>
        )}
        <button
          className={styles.deleteBtn}
          onClick={() => onDelete(todo.id)}
          aria-label="Delete todo"
          title="Delete"
        >
          🗑️
        </button>
      </div>

      {/* Reminder Modal */}
      {showReminderModal && (
        <div className={styles.modalBackdrop} onClick={handleModalBackdropClick}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Set Reminder</h3>
              <button 
                className={styles.modalClose}
                onClick={() => setShowReminderModal(false)}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <label className={styles.reminderLabel}>
                <span>Select date and time:</span>
                <input
                  type="datetime-local"
                  className={styles.reminderInput}
                  value={getReminderDateTimeLocal(todo.reminder_at)}
                  onChange={handleReminderChange}
                  min={new Date().toISOString().slice(0, 16)}
                />
              </label>
              {todo.reminder_at && (
                <p className={styles.currentReminder}>
                  Current reminder: {formatReminderDate(todo.reminder_at)}
                </p>
              )}
            </div>
            <div className={styles.modalFooter}>
              {todo.reminder_at && (
                <button
                  className={styles.clearReminderBtn}
                  onClick={() => {
                    if (onUpdateReminder) {
                      onUpdateReminder(todo.id, null);
                    }
                    setShowReminderModal(false);
                  }}
                >
                  Clear Reminder
                </button>
              )}
              <button
                className={styles.modalDoneBtn}
                onClick={() => setShowReminderModal(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </li>
  );
}
