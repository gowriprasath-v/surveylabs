import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';

export default function AppShell({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <div className="flex bg-base text-text-1 min-h-[100dvh] relative md:p-4 md:gap-4">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <main className="flex-1 min-w-0 flex flex-col h-[100dvh] md:h-[calc(100dvh-32px)] relative z-10">
        {/* Mobile top bar */}
        <div className="md:hidden flex flex-shrink-0 items-center h-14 bg-surface border-b border-white/10 px-4 sticky top-0 z-40">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 -ml-2 text-text-2 hover:text-text-1"
            aria-label="Open sidebar"
          >
            <Menu size={24} />
          </button>
          <span className="ml-2 text-md font-display font-semibold tracking-tight text-text-1 flex items-center">
             <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center mr-2">
               <span className="text-white font-bold text-[10px]">S</span>
             </div> 
             SurveyLabs
          </span>
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden w-full h-full relative scroll-smooth">
          <div className="w-full max-w-[1320px] mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8 min-h-full flex flex-col">
            <div className="flex flex-col gap-4 sm:gap-6 flex-1 w-full relative z-10">
              {children}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
