import { useState, useMemo, useEffect } from 'react';
import { usePageTitle } from '../hooks/usePageTitle';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
 
import { LineChart, Line, AreaChart, Area, ResponsiveContainer } from 'recharts';
import { Search, Filter, SortDesc, MoreHorizontal, Plus, Copy, Share, Edit2, BarChart2, Trash2 } from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import toast from 'react-hot-toast';
import { getSurveys, deleteSurvey, createSurvey } from '../api/surveyApi';

export default function SurveysListPage() {
  const navigate = useNavigate();
  usePageTitle('Surveys');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [sort, setSort] = useState('Newest');
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSurveys();
  }, []);

  const fetchSurveys = async () => {
    try {
      const data = await getSurveys();
      // spark data now comes from backend (real 7-day daily counts)
      setSurveys(data.map(s => ({
        ...s,
        spark: Array.isArray(s.spark) ? s.spark : [0,0,0,0,0,0,0]
      })));
    } catch (err) {
      toast.error('Failed to load surveys');
    } finally {
      setLoading(false);
    }
  };

  const filteredSurveys = useMemo(() => {
    let result = [...surveys];
    if (filter !== 'All') {
      result = result.filter(s => {
         const isActive = s.is_active === 1;
         if (filter === 'Active') return isActive;
         if (filter === 'Draft')  return !isActive;
         return true;
      });
    }
    if (search) result = result.filter(s => s.title.toLowerCase().includes(search.toLowerCase()));
    
    if (sort === 'Newest') {
       result.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (sort === 'Oldest') {
       result.sort((a,b) => new Date(a.created_at) - new Date(b.created_at));
    } else if (sort === 'MostResponses') {
       result.sort((a,b) => (b.response_count || 0) - (a.response_count || 0));
    }
    return result;
  }, [search, filter, sort, surveys]);

  const handleAction = async (action, id) => {
    setDropdownOpen(null);
    if (action === 'edit') navigate(`/surveys/${id}/edit`);
    if (action === 'results') navigate(`/surveys/${id}/results`);
    if (action === 'share') {
      await navigator.clipboard.writeText(`${window.location.origin}/s/${id}`);
      toast.success('Link copied to clipboard!');
    }
    if (action === 'delete') {
      const ok = window.confirm('Delete this survey? This cannot be undone.');
      if (!ok) return;
      try {
        await deleteSurvey(id);
        toast.success('Survey deleted.');
        setSurveys(prev => prev.filter(s => s.id !== id));
      } catch (err) {
        toast.error('Failed to delete survey');
      }
    }
    if (action === 'duplicate') {
      try {
        const original = surveys.find(s => s.id === id);
        if (!original) return;
        // getSurvey returns {survey, questions} - but we can reconstruct from list data
        const { getSurvey } = await import('../api/surveyApi');
        const full = await getSurvey(id);
        await createSurvey({
          title: `${full.survey.title} (Copy)`,
          description: full.survey.description || '',
          mode: full.survey.mode || 'standard',
          questions: (full.questions || []).map(q => ({
            label: q.label,
            type: q.type,
            options: q.options || [],
            required: q.required,
            order_index: q.order_index,
          }))
        });
        toast.success('Survey duplicated!');
        fetchSurveys();
      } catch (err) {
        toast.error('Failed to duplicate survey');
      }
    }
  };

  if (loading) {
    return (
      <AppShell>
         <div className="flex items-center justify-center h-[50vh]">
            <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-custom-spin" />
         </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-6 w-full h-full">
        <div className="glass-panel rounded-[var(--radius-xl)] p-6 sm:p-8 mb-2 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Badge variant="glass">Surveys</Badge>
                <Badge variant="glass" dot>Workspace</Badge>
              </div>
              <h1 className="text-3xl font-display font-semibold text-text-1 tracking-tight">Active Surveys</h1>
              <p className="text-sm font-medium text-text-2 mt-1.5 max-w-xl">Manage active feedback programs and drafts in one place.</p>
            </div>
            <Button variant="primary" onClick={() => navigate('/surveys/new')} className="gap-2 !rounded-full !px-5">
              <Plus size={16} strokeWidth={3} /> Create Survey
            </Button>
          </div>
        </div>

        <div className="w-full flex flex-col gap-6">
        {/* ── TOOLBAR ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-2 w-4 h-4 pointer-events-none" />
            <input 
              type="text" placeholder="Search surveys..." 
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-surface-2 border border-[var(--color-border)] rounded-lg pl-9 pr-4 py-2.5 text-sm text-text-1 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-text-2/60"
            />
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <select value={filter} onChange={e => setFilter(e.target.value)} className="appearance-none bg-surface-2 border border-[var(--color-border)] rounded-lg pl-9 pr-8 py-2.5 text-sm text-text-1 focus:border-primary focus:ring-1 focus:ring-primary outline-none cursor-pointer">
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Draft">Drafts</option>
              </select>
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-text-2 w-4 h-4 pointer-events-none" />
            </div>
            <div className="relative">
              <select value={sort} onChange={e => setSort(e.target.value)} className="appearance-none bg-surface-2 border border-[var(--color-border)] rounded-lg pl-9 pr-8 py-2.5 text-sm text-text-1 focus:border-primary focus:ring-1 focus:ring-primary outline-none cursor-pointer">
                <option value="Newest">Newest First</option>
                <option value="Oldest">Oldest First</option>
              </select>
              <SortDesc className="absolute left-3 top-1/2 -translate-y-1/2 text-text-2 w-4 h-4 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* ── GRID ── */}
        {!filteredSurveys.length ? (
          <EmptyState 
            title={surveys.length ? "No surveys match filters" : "No surveys found"} 
            description={surveys.length ? "Try adjusting your search or filters." : "Create a new survey to get started gathering feedback."} 
            action={surveys.length ? <Button variant="ghost" onClick={() => {setSearch(''); setFilter('All');}}>Clear Filters</Button> : <Button variant="primary" onClick={() => navigate('/surveys/new')}>Create Survey</Button>}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
            {filteredSurveys.map((survey, idx) => (
              <div key={survey.id} className="group">
                <Card glass padding="p-0" className="flex flex-col h-full cursor-pointer hover:border-primary/30 hover:shadow-[0_0_30px_rgba(99,102,241,0.1)] transition-all duration-300 transform hover:-translate-y-1" 
                  onClick={() => navigate(`/surveys/${survey.id}/results`)}>
                  <div className="p-5 flex-1">
                    <div className="flex justify-between items-start mb-3">
                      <Badge variant={survey.is_active === 1 ? 'emerald' : 'amber'} className="!px-2">
                        {survey.is_active === 1 ? 'Active' : 'Draft'}
                      </Badge>
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (dropdownOpen === survey.id) {
                              setDropdownOpen(null);
                              return;
                            }
                            const rect = e.currentTarget.getBoundingClientRect();
                            const width = 192;
                            const left = Math.min(rect.right - width, window.innerWidth - width - 12);
                            setDropdownPos({ top: rect.bottom + 8, left: Math.max(12, left) });
                            setDropdownOpen(survey.id);
                          }}
                          className="p-1 rounded-md bg-surface-2 border border-white/10 text-text-2 hover:text-text-1 hover:bg-surface-3 transition-colors outline-none"
                        >
                          <MoreHorizontal size={16} />
                        </button>
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-bold text-text-1 leading-snug mb-4 line-clamp-2 tracking-tight" title={survey.title}>
                      {survey.title}
                    </h3>
                    
                    <div className="h-16 w-full mt-auto bg-gradient-to-b from-transparent to-primary/[0.03] rounded-xl border border-white/5 relative overflow-hidden group-hover:to-primary/[0.08] transition-colors">
                      <div className="absolute top-2 left-3 text-[9px] font-bold uppercase tracking-widest text-primary/50 z-10 drop-shadow-sm">7 Day Trend</div>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={survey.spark.map((v, i) => ({ value: v, i }))} margin={{ top: 15, right: 0, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id={`gradient-spark-${survey.id}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <Area 
                            type="monotone" 
                            dataKey="value" 
                            stroke="var(--color-primary)" 
                            strokeWidth={3} 
                            fillOpacity={1} 
                            fill={`url(#gradient-spark-${survey.id})`} 
                            isAnimationActive={false}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-surface-2/30 border-t border-white/5 flex items-center justify-between text-[11px] uppercase tracking-wide text-text-2 rounded-b-[var(--radius-xl)] font-bold">
                    <span>{new Date(survey.created_at).toLocaleDateString()}</span>
                    <span className="flex items-center gap-3">
                      <span>{survey.question_count ?? 0} Qs</span>
                      <span className="text-text-1">{(survey.response_count ?? 0).toLocaleString()} Responses</span>
                    </span>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        )}
        </div>

        {dropdownOpen && createPortal(
          <>
            <button className="fixed inset-0 z-[60]" onClick={() => setDropdownOpen(null)} aria-label="Close menu" />
            <div
              className="fixed z-[70] w-48 bg-surface border border-white/10 rounded-xl shadow-xl py-1 animate-fade-in origin-top-right"
              style={{ top: dropdownPos.top, left: dropdownPos.left }}
            >
              <button onClick={() => handleAction('edit', dropdownOpen)} className="w-full text-left px-3 py-2 text-sm text-text-1 hover:bg-primary/20 hover:text-primary flex items-center gap-2 transition-colors"><Edit2 size={14}/> Edit</button>
              <button onClick={() => handleAction('results', dropdownOpen)} className="w-full text-left px-3 py-2 text-sm text-text-1 hover:bg-primary/20 hover:text-primary flex items-center gap-2 transition-colors"><BarChart2 size={14}/> Results</button>
              <button onClick={() => handleAction('share', dropdownOpen)} className="w-full text-left px-3 py-2 text-sm text-text-1 hover:bg-primary/20 hover:text-primary flex items-center gap-2 transition-colors"><Share size={14}/> Share Link</button>
              <div className="h-px bg-white/10 my-1"/>
              <button onClick={() => handleAction('duplicate', dropdownOpen)} className="w-full text-left px-3 py-2 text-sm text-text-1 hover:bg-white/5 flex items-center gap-2 transition-colors"><Copy size={14}/> Duplicate</button>
              <button onClick={() => handleAction('delete', dropdownOpen)} className="w-full text-left px-3 py-2 text-sm text-danger hover:bg-danger/10 flex items-center gap-2 transition-colors"><Trash2 size={14}/> Delete</button>
            </div>
          </>,
          document.body
        )}

      </div>
    </AppShell>
  );
}
