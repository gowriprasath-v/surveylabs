import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import EmptyState from '../ui/EmptyState';

export default function MCQBarChart({ results, options }) {
  if (!results || !options) {
    return <EmptyState title="No responses yet" />;
  }

  const data = options.map((opt) => ({
    name: opt,
    count: results[opt] || 0,
  }));

  const total = data.reduce((sum, d) => sum + d.count, 0);
  if (total === 0) {
    return <EmptyState title="No responses yet" />;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
        <Tooltip
          contentStyle={{ border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px' }}
        />
        <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
