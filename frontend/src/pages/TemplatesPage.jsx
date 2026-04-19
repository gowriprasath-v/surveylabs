import { useState } from 'react';
import { usePageTitle } from '../hooks/usePageTitle';
import { useNavigate } from 'react-router-dom';
import { Search, Star, Zap, Users, ClipboardList, ShoppingCart, Heart, Briefcase, GraduationCap, Plus, Lock } from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';

const CATEGORIES = ['All', 'Customer Experience', 'HR & People', 'Product', 'Events', 'Healthcare', 'Education'];

const TEMPLATES = [
  {
    id: 1, title: 'NPS Score Survey', category: 'Customer Experience', icon: Star,
    color: 'from-indigo-500 to-purple-600', questions: 5, uses: '12.4K', pro: false,
    desc: 'Measure customer loyalty and satisfaction with the industry-standard Net Promoter Score framework.'
  },
  {
    id: 2, title: 'Employee Engagement', category: 'HR & People', icon: Users,
    color: 'from-emerald-500 to-teal-600', questions: 18, uses: '8.1K', pro: false,
    desc: 'Uncover how engaged, motivated, and aligned your team is with the company mission.'
  },
  {
    id: 3, title: 'Product Market Fit', category: 'Product', icon: Zap,
    color: 'from-amber-500 to-orange-600', questions: 10, uses: '5.2K', pro: false,
    desc: 'The Sean Ellis method — figure out if you have achieved product-market fit.'
  },
  {
    id: 4, title: 'Post-Event Feedback', category: 'Events', icon: ClipboardList,
    color: 'from-pink-500 to-rose-600', questions: 8, uses: '9.7K', pro: false,
    desc: 'Collect structured feedback from event attendees to improve future experiences.'
  },
  {
    id: 5, title: 'Customer Churn Analysis', category: 'Customer Experience', icon: ShoppingCart,
    color: 'from-sky-500 to-blue-600', questions: 12, uses: '3.8K', pro: true,
    desc: 'Understand why customers are leaving and what could have changed their mind.'
  },
  {
    id: 6, title: 'Patient Satisfaction', category: 'Healthcare', icon: Heart,
    color: 'from-red-500 to-pink-600', questions: 14, uses: '2.1K', pro: true,
    desc: 'Collect HIPAA-aligned patient feedback to improve healthcare quality and outcomes.'
  },
  {
    id: 7, title: 'Job Application Form', category: 'HR & People', icon: Briefcase,
    color: 'from-violet-500 to-purple-600', questions: 20, uses: '6.3K', pro: false,
    desc: 'A professional multi-step application form for collecting candidate information.'
  },
  {
    id: 8, title: 'Course Evaluation', category: 'Education', icon: GraduationCap,
    color: 'from-lime-500 to-green-600', questions: 11, uses: '4.5K', pro: false,
    desc: 'Evaluate teaching quality, course content, and student satisfaction effectively.'
  },
];

const TEMPLATE_QUESTIONS = {
  1: [
    { label: 'How likely are you to recommend us to a friend or colleague?', type: 'rating', required: true, options: [] },
    { label: 'What is the primary reason for your score?', type: 'text', required: false, options: [] },
    { label: 'How satisfied are you with our product overall?', type: 'rating', required: true, options: [] },
    { label: 'What could we improve?', type: 'text', required: false, options: [] },
    { label: 'Would you purchase from us again?', type: 'mcq', required: true, options: ['Definitely yes', 'Probably yes', 'Not sure', 'Probably not', 'Definitely not'] },
  ],
  2: [
    { label: 'I understand the company mission and goals.', type: 'rating', required: true, options: [] },
    { label: 'I feel motivated to come to work each day.', type: 'rating', required: true, options: [] },
    { label: 'I feel my work is valued by my manager.', type: 'rating', required: true, options: [] },
    { label: 'I have the tools I need to do my job effectively.', type: 'mcq', required: true, options: ['Strongly Agree', 'Agree', 'Neutral', 'Disagree', 'Strongly Disagree'] },
    { label: 'What could the company do to improve your experience?', type: 'text', required: false, options: [] },
  ],
  3: [
    { label: 'How would you feel if you could no longer use our product?', type: 'mcq', required: true, options: ['Very disappointed', 'Somewhat disappointed', 'Not disappointed'] },
    { label: 'What type of people would benefit most from our product?', type: 'text', required: false, options: [] },
    { label: 'What is the main benefit you get from our product?', type: 'text', required: false, options: [] },
    { label: 'How can we improve the product for you?', type: 'text', required: false, options: [] },
  ],
  4: [
    { label: 'Overall, how satisfied were you with this event?', type: 'rating', required: true, options: [] },
    { label: 'How would you rate the event venue and facilities?', type: 'rating', required: true, options: [] },
    { label: 'How useful did you find the content presented?', type: 'rating', required: true, options: [] },
    { label: 'Would you attend this event again?', type: 'mcq', required: true, options: ['Yes', 'No', 'Not sure'] },
    { label: 'What was the highlight of the event for you?', type: 'text', required: false, options: [] },
    { label: 'What would you change or improve for next time?', type: 'text', required: false, options: [] },
  ],
  7: [
    { label: 'Full Name', type: 'text', required: true, options: [] },
    { label: 'Email Address', type: 'text', required: true, options: [] },
    { label: 'Position Applied For', type: 'text', required: true, options: [] },
    { label: 'Years of relevant experience', type: 'mcq', required: true, options: ['< 1 year', '1-3 years', '3-5 years', '5-10 years', '10+ years'] },
    { label: 'Why do you want to work with us?', type: 'text', required: true, options: [] },
    { label: 'Describe a challenge you have overcome professionally.', type: 'text', required: false, options: [] },
  ],
  8: [
    { label: 'How would you rate the quality of content covered in the course?', type: 'rating', required: true, options: [] },
    { label: 'How would you rate the instructor\'s teaching effectiveness?', type: 'rating', required: true, options: [] },
    { label: 'The course met my learning objectives.', type: 'mcq', required: true, options: ['Strongly Agree', 'Agree', 'Neutral', 'Disagree', 'Strongly Disagree'] },
    { label: 'What topics would you like to see covered in future courses?', type: 'text', required: false, options: [] },
  ],
};

export default function TemplatesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [hoveredId, setHoveredId] = useState(null);

  const filtered = TEMPLATES.filter(t => {
    const matchCat = category === 'All' || t.category === category;
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.desc.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleUse = (template) => {
    if (template.pro) {
      toast.error('Upgrade to Pro to use this template');
      return;
    }
    const questions = TEMPLATE_QUESTIONS[template.id] || [];
    toast.success(`Loading "${template.title}"...`);
    navigate('/surveys/new', { state: { template: { title: template.title, questions } } });
  };

  return (
    <AppShell>
      <div className="glass-panel rounded-[var(--radius-xl)] p-6 sm:p-8 mb-5 shadow-sm">
        <div className="text-center">
          <div className="mb-3 flex items-center justify-center gap-3">
            <Badge variant="indigo">Template Library</Badge>
            <Badge variant="glass" dot>Instant launch</Badge>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-semibold text-text-1 mb-2">Start faster. Scale smarter.</h1>
          <p className="text-text-2 text-base max-w-xl mx-auto">Choose from expert-crafted templates and launch your survey in seconds.</p>
        </div>
      </div>

      {/* ── SEARCH + FILTERS ── */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1 max-w-md mx-auto md:mx-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-2 w-4 h-4 pointer-events-none" />
          <input
            type="text" placeholder="Search templates..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-surface-2 border border-[var(--color-border)] rounded-lg pl-10 pr-4 py-2.5 text-sm text-text-1 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-text-2/60"
          />
        </div>
        <div className="flex flex-wrap gap-2 justify-center md:justify-start">
          {CATEGORIES.map(cat => (
            <button
              key={cat} onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors whitespace-nowrap ${category === cat ? 'bg-white text-slate-900' : 'bg-surface-2 text-text-2 hover:text-text-1 border border-[var(--color-border)]'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── GRID ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map((t) => (
          <div
            key={t.id}
            onMouseEnter={() => setHoveredId(t.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <Card padding="p-0" className="h-full flex flex-col border border-[var(--color-border)] bg-surface overflow-hidden hover:border-primary/30 hover:shadow-[0_0_24px_rgba(99,102,241,0.1)] transition-all duration-300">
              <div className="relative h-24 bg-surface-2 flex items-center justify-center">
                <div className="w-12 h-12 rounded-xl bg-surface-3 flex items-center justify-center text-text-1">
                  <t.icon size={22} />
                </div>
                {t.pro && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-surface-3 px-2 py-1 rounded-full text-[10px] font-semibold text-text-1">
                    <Lock size={10} /> PRO
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-base font-semibold text-text-1 leading-snug">{t.title}</h3>
                  <Badge variant="gray" className="shrink-0 !text-[9px]">{t.category}</Badge>
                </div>
                <p className="text-sm text-text-2 leading-relaxed mb-4 flex-1">{t.desc}</p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-text-2">
                    <span className="font-medium">{t.questions} questions</span>
                    <span className="text-text-2/50">·</span>
                    <span className="font-medium">{t.uses} uses</span>
                  </div>
                </div>
              </div>

              {/* Footer CTA */}
              <div className="px-5 pb-5">
                <Button
                  variant={t.pro ? 'ghost' : 'primary'}
                  className={`w-full gap-2 ${t.pro ? '!border-accent/30 !text-accent hover:!bg-accent/10' : ''}`}
                  onClick={() => handleUse(t)}
                >
                  {t.pro ? <><Lock size={14}/> Unlock Template</> : <><Plus size={14}/> Use This Template</>}
                </Button>
              </div>
            </Card>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-text-2">
          <Search size={40} className="mx-auto mb-4 opacity-20"/>
          <p className="font-semibold text-text-1 mb-1">No templates found</p>
          <p className="text-sm">Try a different search term or category.</p>
        </div>
      )}

    </AppShell>
  );
}
