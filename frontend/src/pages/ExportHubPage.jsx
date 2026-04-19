import { useState } from 'react';
import { usePageTitle } from '../hooks/usePageTitle';
import { Download, FileText, Image as ImageIcon, Table, Package, Lock, CheckCircle2, Zap, Calendar, Filter, Clock } from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';
import { exportData } from '../api/analyticsApi';

const EXPORT_FORMATS = [
  {
    id: 'csv', label: 'CSV Data', icon: Table, pro: false, color: 'emerald',
    desc: 'Raw response data in comma-separated format. Compatible with Excel, Google Sheets, and BI tools.',
    features: ['All responses', 'Quality scores', 'Timestamps', 'Respondent metadata']
  },
  {
    id: 'json', label: 'JSON Export', icon: Package, pro: false, color: 'sky',
    desc: 'Machine-readable JSON for developers. Perfect for custom integrations and data pipelines.',
    features: ['Nested structure', 'Question map', 'Logic rules', 'API-ready format']
  },
  {
    id: 'pdf', label: 'PDF Report', icon: FileText, pro: true, color: 'violet',
    desc: 'Beautifully formatted PDF report with branded charts, insights, and executive summary.',
    features: ['AI-generated summary', 'Branded charts', 'Insight callouts', 'Shareable link']
  },
  {
    id: 'png', label: 'Image Export', icon: ImageIcon, pro: false, color: 'amber',
    desc: 'High-resolution PNG snapshot of your results dashboard. Perfect for presentations.',
    features: ['2x resolution', 'All charts', 'Dark mode', 'Social-ready']
  },
];

const FORMAT_COLORS = { csv: 'emerald', json: 'sky', pdf: 'violet', png: 'amber' };

const FORMAT_STYLES = {
  emerald: {
    activeClasses: 'border-emerald-500/60 bg-emerald-500/10',
    iconBox: 'bg-emerald-500/20 border-emerald-500/30',
    iconColor: 'text-emerald-400'
  },
  sky: {
    activeClasses: 'border-sky-500/60 bg-sky-500/10',
    iconBox: 'bg-sky-500/20 border-sky-500/30',
    iconColor: 'text-sky-400'
  },
  violet: {
    activeClasses: 'border-violet-500/60 bg-violet-500/10',
    iconBox: 'bg-violet-500/20 border-violet-500/30',
    iconColor: 'text-violet-400'
  },
  amber: {
    activeClasses: 'border-amber-500/60 bg-amber-500/10',
    iconBox: 'bg-amber-500/20 border-amber-500/30',
    iconColor: 'text-amber-400'
  }
};

export default function ExportHubPage() {
  const [selected, setSelected] = useState('csv');
  const [dateRange, setDateRange] = useState('all');
  const [quality, setQuality] = useState('all');
  const [exporting, setExporting] = useState(false);
  const [exportHistory, setExportHistory] = useState([]);

  const selectedFormat = EXPORT_FORMATS.find(f => f.id === selected);

  const handleExport = async () => {
    if (selectedFormat?.pro) {
      toast.error('Upgrade to Pro to unlock PDF exports');
      return;
    }
    if (selected === 'png') {
      toast.error('PNG export — use your browser print/screenshot for now.');
      return;
    }
    setExporting(true);
    try {
      await exportData(selected);
      const entry = {
        id: Date.now(),
        format: selected.toUpperCase(),
        date: new Date().toLocaleString(),
        label: selectedFormat.label,
      };
      setExportHistory(prev => [entry, ...prev].slice(0, 10));
      toast.success(`${selected.toUpperCase()} file downloaded successfully!`);
    } catch (err) {
      console.error(err);
      toast.error('Export failed. Please ensure you have responses in your surveys.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <AppShell>
      <div className="glass-panel rounded-[var(--radius-xl)] p-6 sm:p-8 mb-5 shadow-sm">
        <div>
          <div className="mb-3 flex items-center gap-3">
            <Badge variant="indigo">Data Hub</Badge>
            <Badge variant="glass" dot>Export workflows</Badge>
          </div>
          <h1 className="text-3xl font-display font-semibold text-text-1">Export Center</h1>
          <p className="text-sm text-text-2 mt-2 max-w-xl">Transform your survey data into any format your team needs.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

        {/* ── LEFT: CONFIGURATOR ── */}
        <div className="xl:col-span-2 space-y-6">

          {/* Format Selector */}
          <Card padding="p-5 md:p-6">
            <h3 className="text-base font-semibold text-text-1 mb-5">1. Choose Export Format</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {EXPORT_FORMATS.map((fmt, i) => (
                <button
                  key={fmt.id}
                  onClick={() => setSelected(fmt.id)}
                  className={`text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                    selected === fmt.id
                      ? FORMAT_STYLES[fmt.color].activeClasses
                      : 'border-[var(--color-border)] bg-surface-2 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${FORMAT_STYLES[fmt.color].iconBox}`}>
                      <fmt.icon size={18} className={FORMAT_STYLES[fmt.color].iconColor} />
                    </div>
                    <div className="flex gap-2">
                      {fmt.pro && <Badge variant="amber" className="!text-[9px]"><Lock size={8} className="inline mr-0.5"/>PRO</Badge>}
                      {selected === fmt.id && <CheckCircle2 size={18} className="text-primary" />}
                    </div>
                  </div>
                  <p className="font-bold text-text-1 mb-1">{fmt.label}</p>
                  <p className="text-xs text-text-2 leading-relaxed">{fmt.desc}</p>
                </button>
              ))}
            </div>
          </Card>

          {/* Filters */}
          <Card padding="p-5 md:p-6">
            <h3 className="text-base font-semibold text-text-1 mb-5">2. Apply Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-text-2 mb-2 flex items-center gap-2">
                  <Calendar size={12}/> Date Range
                </label>
                <select value={dateRange} onChange={e => setDateRange(e.target.value)} className="w-full bg-surface-2 border border-[var(--color-border)] rounded-lg px-4 py-2.5 text-sm text-text-1 focus:border-primary focus:ring-1 focus:ring-primary outline-none cursor-pointer">
                  <option value="all">All Time</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="90d">Last 90 Days</option>
                  <option value="ytd">Year to Date</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-2 mb-2 flex items-center gap-2">
                  <Filter size={12}/> Response Quality
                </label>
                <select value={quality} onChange={e => setQuality(e.target.value)} className="w-full bg-surface-2 border border-[var(--color-border)] rounded-lg px-4 py-2.5 text-sm text-text-1 focus:border-primary focus:ring-1 focus:ring-primary outline-none cursor-pointer">
                  <option value="all">All Responses</option>
                  <option value="valid">Valid Only</option>
                  <option value="flagged">Including Flagged</option>
                </select>
              </div>
            </div>
          </Card>

          {/* What's included */}
          {selectedFormat && (
          <Card padding="p-5">
            <h3 className="text-sm font-semibold text-text-2 mb-4">Included in this export</h3>
            <div className="grid grid-cols-2 gap-y-2 gap-x-4">
              {selectedFormat.features.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-text-1">
                  <CheckCircle2 size={14} className="text-success shrink-0" />
                  {f}
                </div>
              ))}
            </div>
          </Card>
          )}
        </div>

        {/* ── RIGHT: SUMMARY + HISTORY ── */}
        <div className="space-y-6">
          {/* Export Summary */}
          <Card padding="p-6" className="text-center">
            <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-surface-2 text-text-1">
              {selectedFormat && <selectedFormat.icon size={24} />}
            </div>
            <h3 className="text-xl font-display font-semibold text-text-1 mb-1">{selectedFormat?.label}</h3>
            <p className="text-xs text-text-2 mb-6">Estimated size: -- KB</p>
            
            <div className="space-y-2 text-xs text-text-2 mb-6 bg-surface-2 rounded-xl p-4 text-left border border-[var(--color-border)]">
              <div className="flex justify-between"><span>Responses</span><span className="font-bold text-text-1">--</span></div>
              <div className="flex justify-between"><span>Date Range</span><span className="font-bold text-text-1 capitalize">{dateRange === 'all' ? 'All Time' : dateRange}</span></div>
              <div className="flex justify-between"><span>Quality Filter</span><span className="font-bold text-text-1 capitalize">{quality}</span></div>
              <div className="flex justify-between"><span>Format</span><span className="font-bold text-text-1">{selectedFormat?.label}</span></div>
            </div>

            <Button
              variant={selectedFormat?.pro ? 'ghost' : 'primary'}
              className="w-full gap-2"
              onClick={handleExport}
              loading={exporting}
            >
              {selectedFormat?.pro ? (
                <><Lock size={14}/> Upgrade to Export</>
              ) : (
                <><Download size={14}/> Export Now</>
              )}
            </Button>
          </Card>

          {/* Export History */}
          <Card padding="p-0" className="overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)] bg-surface-2">
              <h3 className="text-sm font-semibold text-text-1">Recent Exports</h3>
              <span className="text-xs text-text-2">{exportHistory.length} files</span>
            </div>
            <div className="divide-y divide-[var(--color-border)]">
              {exportHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-text-2 gap-2">
                  <Clock size={20} className="opacity-40" />
                  <p className="text-xs">No exports yet this session</p>
                </div>
              ) : exportHistory.map(h => (
                <div key={h.id} className="flex items-center px-5 py-3.5 hover:bg-surface-2 transition-colors gap-4">
                  <Badge variant={FORMAT_COLORS[h.format.toLowerCase()]} className="!text-[10px] shrink-0 font-mono">{h.format}</Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-1 font-medium truncate">{h.label}</p>
                    <p className="text-xs text-text-2">{h.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

      </div>

    </AppShell>
  );
}
