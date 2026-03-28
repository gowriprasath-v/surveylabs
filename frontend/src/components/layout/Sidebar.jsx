import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const { user, logout } = useAuth();

  const links = [
    { to: '/dashboard', label: 'Surveys', icon: '📋' },
    // Add other links if needed
  ];

  const sidebarClasses = `
    fixed inset-y-0 left-0 z-50 flex flex-col w-[220px] transition-transform duration-300 ease-in-out
    bg-[var(--bg-surface)] border-r border-[var(--border)]
    md:translate-x-0 md:static ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
  `;

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 md:hidden animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <aside className={sidebarClasses}>
        <div className="h-16 flex items-center px-6">
          <span className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            <span style={{ color: 'var(--brand)', marginRight: '6px' }}>◆</span> SurveyLab
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1">
            {links.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-6 py-2.5 text-sm font-medium transition-colors
                    ${isActive
                      ? 'bg-[var(--brand-light)] text-[var(--brand)] border-l-[3px] border-[var(--brand)]'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] border-l-[3px] border-transparent'
                    }
                  `}
                >
                  <span className="text-base">{link.icon}</span>
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Section (Bottom) */}
        <div className="p-4 border-t border-[var(--border)] mt-auto flex items-center gap-3">
          <div className="w-9 h-9 shrink-0 flex items-center justify-center rounded-full text-sm font-bold bg-[var(--brand-light)] text-[var(--brand)]">
            {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--text-primary)] truncate">
              {user?.username || 'User'}
            </p>
            <button
              onClick={logout}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors text-left"
            >
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
