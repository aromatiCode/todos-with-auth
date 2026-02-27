import React, { useState, useRef, useEffect } from 'react';
import styles from './TodoItem.module.css';

/**
 * @param {{ todo: object, onToggle: fn, onEdit: fn, onDelete: fn }} props
 */
export default function TodoItem({ todo, onToggle, onEdit, onDelete }) {
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
    </li>
  );
}
