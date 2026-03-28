import { useState } from 'react';
import Sidebar from './Sidebar';

export default function AppShell({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex bg-[var(--bg-base)] text-[var(--text-primary)] min-h-screen">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <main className="flex-1 min-w-0 flex flex-col h-[100dvh]">
        {/* Mobile top bar */}
        <div className="md:hidden flex flex-shrink-0 items-center h-14 bg-[var(--bg-surface)] border-b border-[var(--border)] px-4">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 -ml-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            aria-label="Open sidebar"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          <span className="ml-2 text-md font-semibold" style={{ color: 'var(--text-primary)' }}>
             <span style={{ color: 'var(--brand)', marginRight: '4px' }}>◆</span> SurveyLab
          </span>
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl p-4 md:p-8 space-y-6">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
