import React from 'react';

export function Header() {
  return (
    <header className="w-full py-8 border-b border-gray-900 bg-black/10 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">
            Feedback Board
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Anonymous and minimalistic board. Share ideas, suggestions or reactions.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-auto px-3 py-1.5 rounded-full border border-gray-800 bg-gray-900/40 text-xs font-semibold text-violet-300">
          <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
          Realtime Polling Active
        </div>
      </div>
    </header>
  );
}
