import { useState, useEffect } from 'react';
import { usePageTitle } from '../hooks/usePageTitle';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { changePassword as apiChangePassword, deleteAccount as apiDeleteAccount } from '../api/authApi';
import { clearAllResponses as apiClearAllResponses } from '../api/surveyApi';
import {
  User, ShieldAlert, BarChart2, Download, Check, Key,
  Trash2, Loader2, AlertTriangle, Shield, ChevronRight,
  BarChart, Table, FileText, Image, Eye, EyeOff
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import toast from 'react-hot-toast';

const NAV_SECTIONS = [
  { id: 'profile',  icon: User,       label: 'Profile' },
  { id: 'security', icon: Key,        label: 'Security' },
  { id: 'quality',  icon: ShieldAlert, label: 'Data Quality' },
  { id: 'display',  icon: BarChart2,  label: 'Display' },
  { id: 'export',   icon: Download,   label: 'Export' },
  { id: 'danger',   icon: Trash2,     label: 'Danger Zone' },
];

function SectionHeader({ icon: Icon, title, description }) {
  return (
    <div className="pb-5 border-b border-white/5 mb-6">
      <div className="flex items-center gap-3 mb-1.5">
        <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-[0_0_12px_rgba(99,102,241,0.15)]">
          <Icon size={18} className="text-primary" />
        </div>
        <h2 className="text-xl font-display font-bold text-text-1">{title}</h2>
      </div>
      <p className="text-sm text-text-2 ml-[52px] leading-relaxed">{description}</p>
    </div>
  );
}

function SettingRow({ label, description, children }) {
  return (
    <div className="flex items-start justify-between gap-6 p-4 rounded-xl bg-surface/50 border border-white/5 hover:border-white/10 transition-all">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-text-1">{label}</p>
        {description && <p className="text-xs text-text-2 mt-0.5 leading-relaxed">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange, label, description }) {
  return (
    <SettingRow label={label} description={description}>
      <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} />
        <div className="w-11 h-6 bg-surface-2 border border-white/10 rounded-full peer peer-checked:bg-primary peer-checked:border-primary/50 after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white/50 after:rounded-full after:h-[18px] after:w-[18px] after:transition-all peer-checked:after:translate-x-5 peer-checked:after:bg-white transition-all" />
      </label>
    </SettingRow>
  );
}

function InputField({ label, ...props }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-text-2 mb-2 uppercase tracking-wide">{label}</label>
      <input
        {...props}
        className="w-full bg-surface-2 border border-white/10 focus:border-primary/50 rounded-xl px-4 py-3 text-sm text-text-1 outline-none transition-all placeholder:text-text-2/50 focus:ring-2 focus:ring-primary/10"
      />
    </div>
  );
}

function PasswordField({ label, ...props }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-xs font-semibold text-text-2 mb-2 uppercase tracking-wide">{label}</label>
      <div className="relative">
        <input
          {...props}
          type={show ? 'text' : 'password'}
          className="w-full bg-surface-2 border border-white/10 focus:border-primary/50 rounded-xl px-4 py-3 pr-12 text-sm text-text-1 outline-none transition-all placeholder:text-text-2/50 focus:ring-2 focus:ring-primary/10"
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-2 hover:text-text-1 transition-colors p-1"
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { user, logout } = useAuth();
  usePageTitle('Settings');
  const navigate = useNavigate();
  const { settings, updateSettings, refreshData } = useStore();
  const [activeSection, setActiveSection] = useState('profile');
  const [form, setForm] = useState(settings || {});
  const [saving, setSaving] = useState(false);

  // Security state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Danger zone state
  const [clearingResponses, setClearingResponses] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => { setForm(settings || {}); }, [settings]);

  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  // ── Save settings ─────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      updateSettings(form);
      await refreshData();
      toast.success('Settings saved successfully!');
    } catch {
      toast.error('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  // ── Change password ───────────────────────────────────────────────────────
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      return toast.error('Please fill in all password fields.');
    }
    if (newPassword.length < 8) {
      return toast.error('New password must be at least 8 characters.');
    }
    if (newPassword !== confirmPassword) {
      return toast.error('New passwords do not match.');
    }
    try {
      setChangingPassword(true);
      await apiChangePassword(currentPassword, newPassword);
      toast.success('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to update password. Check your current password.');
    } finally {
      setChangingPassword(false);
    }
  };

  // ── Clear all responses ───────────────────────────────────────────────────
  const handleClearResponses = async () => {
    if (!window.confirm(
      'Are you sure you want to permanently delete ALL responses across all your surveys?\n\nThis action cannot be undone.'
    )) return;
    const secondConfirm = window.prompt('Type "CLEAR" to confirm this destructive action:');
    if (secondConfirm?.trim().toUpperCase() !== 'CLEAR') {
      return toast.error('Confirmation did not match. Action cancelled.');
    }
    try {
      setClearingResponses(true);
      await apiClearAllResponses();
      await refreshData();
      toast.success('All responses have been permanently cleared.');
    } catch {
      toast.error('Failed to clear responses. Please try again.');
    } finally {
      setClearingResponses(false);
    }
  };

  // ── Delete account ────────────────────────────────────────────────────────
  const handleDeleteAccount = async () => {
    if (!window.confirm(
      'Are you absolutely sure you want to permanently delete your account?\n\nThis will erase all your surveys, questions, responses, and data. This action is IRREVERSIBLE.'
    )) return;
    const secondConfirm = window.prompt('Type your username to confirm account deletion:');
    if (secondConfirm?.trim() !== user?.username) {
      return toast.error('Username did not match. Account deletion cancelled.');
    }
    try {
      setDeletingAccount(true);
      await apiDeleteAccount();
      toast.success('Account deleted. Goodbye!');
      logout();
    } catch {
      toast.error('Failed to delete account. Please try again.');
    } finally {
      setDeletingAccount(false);
    }
  };

  const renderContent = () => {
    switch (activeSection) {

      case 'profile': return (
        <div className="space-y-6">
          <SectionHeader icon={User} title="Profile" description="Your account identity and credentials." />

          {/* Avatar card */}
          <div className="flex items-center gap-5 p-5 bg-surface/50 border border-white/5 rounded-2xl">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-primary/20">
              {user?.username?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div>
              <p className="text-text-1 font-bold text-lg">{user?.username || 'Admin'}</p>
              <p className="text-text-2 text-sm">Administrator</p>
            </div>
            <div className="ml-auto">
              <Badge variant="emerald">Active</Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField label="Username" defaultValue={user?.username || ''} readOnly />
            <InputField label="Role" value="Administrator" readOnly />
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle size={16} className="text-amber-400 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-300 leading-relaxed">
              Username changes are not supported. To update your password, use the <button className="underline font-semibold" onClick={() => setActiveSection('security')}>Security</button> section.
            </p>
          </div>
        </div>
      );

      case 'security': return (
        <div className="space-y-6">
          <SectionHeader icon={Key} title="Security" description="Manage your password and authentication settings." />

          <div className="bg-surface/50 border border-white/5 rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <Key size={15} className="text-primary" />
              </div>
              <h3 className="text-base font-semibold text-text-1">Change Password</h3>
            </div>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <PasswordField
                label="Current Password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
              />
              <PasswordField
                label="New Password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
              />
              <PasswordField
                label="Confirm New Password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
              />
              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-danger flex items-center gap-1.5">
                  <AlertTriangle size={12} /> Passwords do not match
                </p>
              )}
              {newPassword && newPassword.length > 0 && newPassword.length < 8 && (
                <p className="text-xs text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle size={12} /> At least 8 characters required
                </p>
              )}
              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                  className="w-full sm:w-auto"
                >
                  {changingPassword ? <><Loader2 size={15} className="animate-spin mr-2" />Updating...</> : <><Key size={15} className="mr-2" />Update Password</>}
                </Button>
              </div>
            </form>
          </div>

          <div className="bg-surface/50 border border-white/5 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 rounded-xl bg-success/10 flex items-center justify-center">
                <Shield size={15} className="text-success" />
              </div>
              <h3 className="text-base font-semibold text-text-1">Session Security</h3>
            </div>
            <p className="text-sm text-text-2 mt-1 ml-11">JWT access tokens expire in 15 minutes; refresh tokens last 7 days. Logging out revokes your local session immediately.</p>
            <div className="mt-4 ml-11">
              <Button variant="ghost" className="border border-white/10 text-sm" onClick={() => { logout(); navigate('/login'); }}>
                Sign Out of All Sessions
              </Button>
            </div>
          </div>
        </div>
      );

      case 'quality': return (
        <div className="space-y-4">
          <SectionHeader icon={ShieldAlert} title="Data Quality" description="Configure how responses are validated, filtered, and scored in real-time." />
          <Toggle
            label="Spam Detection"
            description="Automatically flag and quarantine empty or junk responses using quality heuristics."
            checked={!!form.spamDetection}
            onChange={() => set('spamDetection', !form.spamDetection)}
          />
          <Toggle
            label="Duplicate Filter"
            description="Exclude identical repeated submissions from aggregate analytics and charts."
            checked={!!form.duplicateFilter}
            onChange={() => set('duplicateFilter', !form.duplicateFilter)}
          />
          <div className="p-5 rounded-xl bg-surface/50 border border-white/5">
            <div className="flex justify-between items-center mb-3">
              <div>
                <label className="text-sm font-semibold text-text-1">Minimum Text Response Length</label>
                <p className="text-xs text-text-2 mt-0.5">Text answers shorter than this will be flagged as suspect.</p>
              </div>
              <span className="text-primary font-bold text-lg tabular-nums bg-primary/10 px-3 py-1 rounded-lg border border-primary/20">{form.minTextLength || 0}</span>
            </div>
            <input
              type="range" min="0" max="50" step="1"
              value={form.minTextLength || 0}
              onChange={e => set('minTextLength', parseInt(e.target.value))}
              className="w-full h-2 bg-surface rounded-full appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between mt-1.5">
              <span className="text-xs text-text-2">0 chars</span>
              <span className="text-xs text-text-2">50 chars</span>
            </div>
          </div>
        </div>
      );

      case 'display': return (
        <div className="space-y-5">
          <SectionHeader icon={BarChart2} title="Display" description="Customize how charts and analytics data are presented throughout your dashboard." />
          <div className="bg-surface/50 border border-white/5 rounded-2xl p-5">
            <label className="block text-xs font-semibold text-text-2 mb-3 uppercase tracking-wide">Default Chart Type</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { type: 'bar', icon: BarChart, label: 'Bar Chart', desc: 'Grouped bar visualization' },
                { type: 'table', icon: Table, label: 'Data Table', desc: 'Raw tabular display' }
              ].map(({ type, icon: Icon, label, desc }) => (
                <button
                  key={type}
                  onClick={() => set('defaultChart', type)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${form.defaultChart === type
                    ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(99,102,241,0.15)]'
                    : 'border-white/5 hover:border-white/20 bg-surface/30'}`}
                >
                  <Icon size={18} className={form.defaultChart === type ? 'text-primary mb-2' : 'text-text-2 mb-2'} />
                  <p className={`text-sm font-semibold ${form.defaultChart === type ? 'text-primary' : 'text-text-1'}`}>{label}</p>
                  <p className="text-xs text-text-2 mt-0.5">{desc}</p>
                </button>
              ))}
            </div>
          </div>
          <Toggle
            label="Show Quality Badges"
            description="Display Spam / Suspect / Good quality indicators on all response lists."
            checked={!!(form.showQualityBadges !== false)}
            onChange={() => set('showQualityBadges', !(form.showQualityBadges !== false))}
          />
        </div>
      );

      case 'export': return (
        <div className="space-y-5">
          <SectionHeader icon={Download} title="Export" description="Configure default formats and metadata inclusion for all response exports." />
          <div className="bg-surface/50 border border-white/5 rounded-2xl p-5">
            <label className="block text-xs font-semibold text-text-2 mb-3 uppercase tracking-wide">Default Export Format</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { fmt: 'csv', icon: FileText, label: 'CSV Data', desc: 'Structured spreadsheet data' },
                { fmt: 'png', icon: Image, label: 'PNG Image', desc: 'Chart image snapshot' }
              ].map(({ fmt, icon: Icon, label, desc }) => (
                <button
                  key={fmt}
                  onClick={() => set('exportFormat', fmt)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${form.exportFormat === fmt
                    ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(99,102,241,0.15)]'
                    : 'border-white/5 hover:border-white/20 bg-surface/30'}`}
                >
                  <Icon size={18} className={form.exportFormat === fmt ? 'text-primary mb-2' : 'text-text-2 mb-2'} />
                  <p className={`text-sm font-semibold ${form.exportFormat === fmt ? 'text-primary' : 'text-text-1'}`}>{label}</p>
                  <p className="text-xs text-text-2 mt-0.5">{desc}</p>
                </button>
              ))}
            </div>
          </div>
          <Toggle
            label="Include Quality Metadata in CSV"
            description="Append quality_score, quality_label, and quality_flags columns to every CSV export."
            checked={!!(form.includeQualityMeta !== false)}
            onChange={() => set('includeQualityMeta', !(form.includeQualityMeta !== false))}
          />
        </div>
      );

      case 'danger': return (
        <div className="space-y-5">
          <SectionHeader icon={Trash2} title="Danger Zone" description="These actions are irreversible. Proceed with extreme caution." />

          <div className="border-2 border-danger/30 rounded-2xl overflow-hidden bg-danger/5">

            {/* Clear Responses */}
            <div className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                  <AlertTriangle size={16} className="text-amber-400" />
                </div>
                <div>
                  <p className="text-text-1 font-bold">Clear All Responses</p>
                  <p className="text-xs text-text-2 mt-1 max-w-sm leading-relaxed">
                    Permanently delete all collected responses across all surveys. Your surveys and questions remain intact.
                  </p>
                </div>
              </div>
              <Button
                variant="danger"
                className="shrink-0 sm:ml-auto"
                onClick={handleClearResponses}
                disabled={clearingResponses}
              >
                {clearingResponses
                  ? <><Loader2 size={14} className="animate-spin mr-2" />Clearing...</>
                  : 'Clear All Responses'}
              </Button>
            </div>

            <div className="h-px bg-danger/20" />

            {/* Delete Account */}
            <div className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-danger/10 flex items-center justify-center shrink-0">
                  <Trash2 size={16} className="text-danger" />
                </div>
                <div>
                  <p className="text-text-1 font-bold">Delete Account</p>
                  <p className="text-xs text-text-2 mt-1 max-w-sm leading-relaxed">
                    Permanently delete your account and all associated surveys, questions, and responses. This cannot be undone.
                  </p>
                </div>
              </div>
              <Button
                variant="danger"
                className="shrink-0 sm:ml-auto"
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
              >
                {deletingAccount
                  ? <><Loader2 size={14} className="animate-spin mr-2" />Deleting...</>
                  : 'Delete Account'}
              </Button>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface/50 border border-white/5 flex items-center gap-3 text-xs text-text-2">
            <Shield size={14} className="text-primary shrink-0" />
            All destructive actions require typed confirmation to prevent accidental data loss.
          </div>
        </div>
      );

      default: return null;
    }
  };

  const saveableSections = ['quality', 'display', 'export'];

  return (
    <AppShell>
      {/* Page Header */}
      <div className="glass-panel rounded-[var(--radius-xl)] p-6 sm:p-8 mb-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Badge variant="indigo">Settings</Badge>
              <Badge variant="glass" dot>Workspace</Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-semibold text-text-1">Workspace Settings</h1>
            <p className="text-sm text-text-2 mt-2 max-w-xl leading-relaxed">
              Configure data quality rules, security, export defaults, and display preferences for your workspace.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 min-h-[600px]">

        {/* Sidebar Nav */}
        <div className="md:w-56 shrink-0">
          <div className="md:sticky md:top-24 glass-panel rounded-2xl p-2 space-y-0.5">
            <p className="text-[10px] font-semibold text-text-2/50 uppercase tracking-widest px-3 pt-2 pb-1">Menu</p>
            {NAV_SECTIONS.map(section => {
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                    section.id === 'danger'
                      ? isActive
                        ? 'bg-danger/10 text-danger border border-danger/20'
                        : 'text-danger/60 hover:text-danger hover:bg-danger/5 mt-4'
                      : isActive
                        ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_12px_rgba(99,102,241,0.1)]'
                        : 'text-text-2 hover:text-text-1 hover:bg-white/5'
                  }`}
                >
                  <section.icon size={15} className="shrink-0" />
                  <span className="flex-1">{section.label}</span>
                  {isActive && <ChevronRight size={14} className="opacity-60" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Panel */}
        <div className="flex-1 min-w-0">
          <div key={activeSection} className="glass-panel rounded-2xl p-6 sm:p-8 min-h-[500px]">
            {renderContent()}
          </div>

          {/* Save footer */}
          {saveableSections.includes(activeSection) && (
            <div className="mt-4 flex justify-end">
              <Button variant="primary" onClick={handleSave} disabled={saving} className="shadow-lg shadow-primary/20">
                {saving
                  ? <><Loader2 size={15} className="animate-spin mr-2" />Saving...</>
                  : <><Check size={15} className="mr-2" />Save Changes</>}
              </Button>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
