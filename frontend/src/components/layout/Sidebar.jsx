import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import {
  LayoutDashboard,
  ClipboardList,
  MessageSquare,
  BarChart2,
  LayoutTemplate,
  Download,
  Link,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
} from 'lucide-react';
import Badge from '../ui/Badge';

const NAVIDETAILS = [
  {
    category: 'Main',
    items: [
      { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/surveys', icon: ClipboardList, label: 'Surveys', showCount: true },
      { path: '/conversations', icon: MessageSquare, label: 'Conversations' },
      { path: '/analytics', icon: BarChart2, label: 'Analytics' },
    ]
  },
  {
    category: 'Workspace',
    items: [
      { path: '/templates', icon: LayoutTemplate, label: 'Templates' },
      { path: '/export', icon: Download, label: 'Export Hub' },
      { path: '#', icon: Link, label: 'Integrations', badge: 'Soon', disabled: true },
    ]
  },
  {
    category: 'Account',
    items: [
      { path: '/settings', icon: Settings, label: 'Settings' },
      { path: 'https://github.com', icon: HelpCircle, label: 'Help & Docs', external: true },
    ]
  }
];

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { activeSurveysCount } = useStore();
  const [collapsed, setCollapsed] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, setMobileOpen]);

  const activeClasses = "bg-primary/10 border border-primary/20 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]";
  const inactiveClasses = "text-text-2 hover:bg-white/5 hover:text-text-1 border border-transparent";
  const collapsedWidth = 72;
  const expandedWidth = 260;

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-base/70 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div
        className={`fixed top-0 left-0 h-[100dvh] z-50 flex flex-col md:sticky md:mt-8 md:top-8 md:ml-4 lg:ml-8 md:shrink-0 md:h-[calc(100dvh-64px)] transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0 h-full' : 'md:translate-x-0 -translate-x-full'
        }`}
        style={{ width: collapsed ? collapsedWidth : expandedWidth }}
      >
        <div className={`absolute inset-0 glass-panel border flex flex-col rounded-[var(--radius-xl)] overflow-hidden ${mobileOpen ? 'rounded-none' : ''}`}>
        {/* Logo/Brand */}
        <div className={`relative flex items-center h-16 shrink-0 mt-2 ${collapsed ? 'px-0 justify-center' : 'px-6'}`}>
          <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-[14px]">S</span>
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-text-1 font-semibold tracking-tight text-[17px] leading-none mb-1">
                  SurveyLabs
                </span>
                <span className="text-text-2 text-[11px] font-medium leading-none">
                  Workspace
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 space-y-6">
          {NAVIDETAILS.map((section, idx) => (
            <div key={idx} className="flex flex-col">
              {!collapsed && (
                <p className="px-6 mb-2 text-[11px] font-semibold text-text-2/50 uppercase tracking-widest">
                  {section.category}
                </p>
              )}
              <ul className="space-y-1">
                {section.items.map((item, i) => {
                  const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
                  const content = (
                    <>
                      <item.icon size={18} className={`shrink-0 transition-colors ${isActive ? 'text-primary' : (item.disabled ? 'text-text-2/30' : 'text-text-2 group-hover:text-text-1')}`} />
                      {!collapsed && (
                        <span className={`whitespace-nowrap font-medium text-sm transition-colors ${isActive ? 'text-text-1' : (item.disabled ? 'text-text-2/40' : '')}`}>
                          {item.label}
                        </span>
                      )}
                      {!collapsed && item.showCount && activeSurveysCount > 0 && typeof activeSurveysCount === 'number' && (
                         <div className="ml-auto w-5 h-5 flex items-center justify-center rounded bg-primary/20 text-[10px] font-bold text-primary">
                           {activeSurveysCount}
                         </div>
                      )}
                      {!collapsed && item.badge && (
                         <div className="ml-auto">
                           <Badge variant="amber" className="!px-1.5 !py-0 !text-[9px]">{item.badge}</Badge>
                         </div>
                      )}
                    </>
                  );

                  const commonClasses = `relative flex items-center h-10 group transition-all duration-200 outline-none
                    ${collapsed ? 'justify-center mx-3 rounded-[var(--radius-md)] hover:bg-white/5' : 'mx-3 px-3 rounded-[var(--radius-md)] gap-3'} 
                    ${item.disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
                    ${isActive && collapsed ? 'bg-primary/20 text-primary' : ''}
                    ${isActive && !collapsed ? activeClasses : (!collapsed ? inactiveClasses : '')}`;

                  if (item.disabled) {
                    return (
                       <li key={i}>
                         <div className={commonClasses} title={collapsed ? item.label : undefined}>
                           {content}
                         </div>
                       </li>
                    )
                  }

                  if (item.external) {
                    return (
                      <li key={i}>
                        <a
                          href={item.path}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={collapsed ? item.label : undefined}
                          className={'relative flex items-center h-10 group transition-all duration-200 outline-none mx-3 px-3 rounded-[var(--radius-md)] gap-3 cursor-pointer ' + inactiveClasses}
                        >
                          {content}
                        </a>
                      </li>
                    );
                  }

                  return (
                    <li key={i}>
                      <NavLink
                        to={item.path}
                        title={collapsed ? item.label : undefined}
                        className={commonClasses}
                      >
                        {content}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="mt-auto shrink-0 border-t border-white/10 bg-surface-2">
          <div className={`flex items-center h-[72px] ${collapsed ? 'justify-center px-0' : 'px-6'}`}>
            <div className={`flex items-center w-full gap-3 transition-colors rounded-[var(--radius-md)] p-2 cursor-pointer ${collapsed ? 'w-auto hover:bg-white/5' : 'hover:bg-white/5'}`}>
              <div className="w-9 h-9 rounded-2xl bg-surface-2 border border-white/10 flex items-center justify-center text-text-1 text-xs font-semibold shrink-0">
                {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
              </div>
              {!collapsed && (
                <div className="flex flex-col min-w-0 overflow-hidden flex-1">
                  <span className="text-sm font-semibold text-text-1 truncate pointer-events-none">
                    {user?.username || 'Admin User'}
                  </span>
                  <span className="text-xs text-text-2 truncate pointer-events-none">
                    Administrator
                  </span>
                </div>
              )}
              {!collapsed && (
                <button onClick={(e) => { e.preventDefault(); logout(); }} className="p-1.5 rounded-md text-text-2 hover:text-danger hover:bg-danger/10 transition-colors" title="Log out">
                  <LogOut size={16} />
                </button>
              )}
            </div>
          </div>
        </div>

        </div>

        {/* Desktop Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-6 z-10 w-6 h-6 rounded-full bg-surface-2 border border-white/15 shadow-sm flex items-center justify-center hover:bg-white/5 transition-colors hidden md:flex"
        >
          <ChevronLeft size={12} className={`text-text-2 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
        </button>

      </div>
    </>
  );
}
