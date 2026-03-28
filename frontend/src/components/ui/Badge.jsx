const variantClasses = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  gray: 'bg-gray-100 text-gray-600 ring-gray-500/20',
  blue: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  red: 'bg-red-50 text-red-700 ring-red-600/20',
};

export default function Badge({ variant = 'gray', children, className = '' }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${variantClasses[variant] || variantClasses.gray} ${className}`}>
      {children}
    </span>
  );
}
