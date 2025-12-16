'use client';

import { User } from '../types';

interface CursorProps {
  user: User;
}

export default function Cursor({ user }: CursorProps) {
  if (!user.cursorPosition) return null;

  return (
    <div
      className="fixed pointer-events-none z-50 transition-all duration-100 ease-out"
      style={{
        left: `${user.cursorPosition.x}px`,
        top: `${user.cursorPosition.y}px`,
        transform: 'translate(-50%, -50%)'
      }}
    >
      {/* Cursor dot */}
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg border-2 border-white"
        style={{ backgroundColor: user.color }}
      >
        {user.displayName[0].toUpperCase()}
      </div>

      {/* Name label */}
      <div
        className="mt-1 px-2 py-1 rounded text-xs font-medium text-white shadow-md whitespace-nowrap"
        style={{ backgroundColor: user.color }}
      >
        {user.displayName}
      </div>
    </div>
  );
}
