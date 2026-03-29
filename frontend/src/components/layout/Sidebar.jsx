// ── MODIFIED START ── (Full sidebar upgrade: sections, glassmorphism, lucide icons, collapse)
import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, ClipboardList, BarChart2,
  Settings, ChevronLeft, Menu
} from 'lucide-react';

const navSections = [
  {
    label: 'Main',
    items: [
      { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ],
  },
  {
    label: 'Insights',
    items: [
      { path: '/analytics', icon: BarChart2, label: 'Analytics' },
      { path: '/settings',  icon: Settings,  label: 'Settings'  },
    ],
  },
];

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const sidebarWidth = collapsed ? 'md:w-16' : 'md:w-[220px]';

  const sidebarClasses = `
    fixed top-0 left-0 h-[100vh] w-[260px] max-w-[80vw] z-50
    bg-white/70 backdrop-blur-xl border-r border-gray-200 shadow-xl sm:shadow-md
    transition-transform duration-200 ease-in-out
    flex flex-col
    md:sticky md:top-0 md:w-[256px] md:max-w-[256px] md:shrink-0 md:translate-x-0
    ${collapsed ? 'md:w-16 md:max-w-[4rem]' : ''}
    ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
  `;

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden transition-opacity duration-200"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={sidebarClasses}>

        {/* Desktop collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="
            absolute -right-3 top-6 z-10
            w-6 h-6 rounded-full
            bg-white border border-gray-200
            shadow-sm items-center justify-center
            hover:bg-gray-50 transition-colors
            hidden md:flex
          "
        >
          <ChevronLeft
            size={12}
            className={`text-gray-500 transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Logo */}
        <div className={`flex items-center pt-4 mb-4 ${collapsed ? 'px-3 justify-center' : 'px-5'}`}>
          <div className="flex items-center gap-3 overflow-hidden m-0 p-0">
            <div className="w-[40px] h-[40px] rounded-[12px] bg-indigo-600 flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-[15px]">S</span>
            </div>
            {!collapsed && (
              <span className="text-[var(--text-primary)] font-semibold tracking-tight whitespace-nowrap text-[15px]">
                SurveyLab
              </span>
            )}
          </div>
        </div>

        {/* Nav sections */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
          {navSections.map((section) => (
            <div key={section.label}>
              {!collapsed && (
                <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                  {section.label}
                </p>
              )}
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = location.pathname === item.path
                    || location.pathname.startsWith(item.path + '/');
                    
                  const baseClasses = "relative flex items-center text-[13px] font-medium transition-all duration-150 ease-in-out group min-h-[44px]";
                  const expandedClasses = isActive
                    ? "bg-indigo-600 text-white shadow-[0_4px_12px_rgba(79,70,229,0.3)] rounded-xl px-3 py-3 gap-3"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-xl px-3 py-3 gap-3";
                  const collapsedClasses = "justify-center rounded-xl hover:bg-[rgba(0,0,0,0.05)]";

                  return (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        end
                        onClick={() => setMobileOpen(false)}
                        title={collapsed ? item.label : undefined}
                        className={`${baseClasses} ${collapsed ? collapsedClasses : expandedClasses}`}
                      >
                        {collapsed && isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[20px] bg-indigo-600 rounded-[2px]" />
                        )}
                        <item.icon
                          size={16}
                          className={`shrink-0 transition-colors duration-150 ${
                            collapsed
                              ? (isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600')
                              : (isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600')
                          }`}
                        />
                        {!collapsed && item.label}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* User section */}
        <div className="mt-auto px-3 border-t border-[rgba(0,0,0,0.05)] pt-3 pb-4">
          <div className={`flex items-center gap-3 px-2 py-3 rounded-xl hover:bg-gray-100/80 cursor-pointer transition-colors min-h-[48px] ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-7 h-7 rounded-full bg-[var(--brand-light)] flex items-center justify-center text-[var(--brand)] text-xs font-semibold shrink-0">
              {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-900 truncate tracking-wide">
                    {user?.username || 'Admin'}
                  </p>
                  <button
                    onClick={logout}
                    className="text-[10px] text-gray-400 hover:text-indigo-600 font-semibold uppercase tracking-wider transition-colors text-left"
                  >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>

      </aside>
    </>
  );
}
// ── MODIFIED END ──
