import { useState, useEffect } from 'react';

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast toast-${type}`} onClick={onClose}>
      <div className="flex items-center gap-2">
        <span>{type === 'success' ? '✓' : '✕'}</span>
        <span>{message}</span>
      </div>
    </div>
  );
}
