// src/components/ContextMenu.jsx
import React, { useEffect } from 'react';

export default function ContextMenu({ items, position, onClose }) {
  // close on any click outside
  useEffect(() => {
    const handler = () => onClose();
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [onClose]);

  return (
    <ul
      className="
        fixed z-50 bg-white text-gray-900 border border-gray-300 rounded shadow-lg
        py-1 text-xs font-sans
      "
      style={{ top: position.y, left: position.x }}
    >
      {items.map(({ label, onClick, disabled }, i) => (
        <li
          key={i}
          className={`
            px-4 py-2 whitespace-nowrap cursor-pointer select-none
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            hover:bg-blue-600 hover:text-white
          `}
          onClick={e => {
            e.stopPropagation();
            if (!disabled) {
              onClick();
              onClose();
            }
          }}
        >
          {label}
        </li>
      ))}
    </ul>
  );
}
