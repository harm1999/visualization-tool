// src/components/SubtleButton.jsx
import React from 'react'

export default function Button({ children, onClick, className="" }) {
  return (
    <button 
        type="button"
        onClick={onClick} 
        className=
            {`py-2.5 text-xs font-medium text-gray-500
            focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 
            hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 
            dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white 
            dark:hover:bg-gray-700 white-space px-1 whitespace-normal text-center ${className}`}>
        {children}
    </button>

  )
}
