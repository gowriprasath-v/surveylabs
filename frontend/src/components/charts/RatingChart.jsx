import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import EmptyState from '../ui/EmptyState';

export default function RatingChart({ results }) {
  if (!results || results.count === 0) {
    return <EmptyState title="No responses yet" />;
  }

  const { average, count, distribution } = results;

  const data = ['1', '2', '3', '4', '5'].map((r) => ({
    rating: r + '★',
    count: distribution[r] || 0,
  }));

  const fullStars = Math.floor(average);
  const hasHalf = average - fullStars >= 0.5;

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <span className="text-4xl font-bold text-brand-600">{average}</span>
        <div>
          <div className="flex items-center gap-0.5 text-xl">
            {[1, 2, 3, 4, 5].map((n) => (
              <span key={n} className={n <= fullStars || (n === fullStars + 1 && hasHalf) ? 'text-yellow-400' : 'text-gray-300'}>
                ★
              </span>
            ))}
          </div>
          <p className="text-sm text-gray-500">{count} response{count !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis dataKey="rating" tick={{ fontSize: 12, fill: '#6b7280' }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
          <Tooltip
            contentStyle={{ border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px' }}
          />
          <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
