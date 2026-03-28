const STYLES = {
  good: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Good' },
  suspect: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', label: 'Suspect' },
  spam: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', label: 'Spam' },
};

export default function QualityBadge({ quality, size = 'sm', showDot = true }) {
  const style = STYLES[quality] || STYLES.good;

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-full ${
      size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
    } ${style.bg} ${style.text}`}>
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />}
      {style.label}
    </span>
  );
}
