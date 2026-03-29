export default function Card({ children, className = '', padding = 'p-6' }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-card ${padding} ${className}`}>
      {children}
    </div>
  );
}

Card.Header = function CardHeader({ title, action, children }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        {title && <h3 className="text-base font-semibold text-gray-900">{title}</h3>}
        {children}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

Card.Body = function CardBody({ children, className = '' }) {
  return <div className={className}>{children}</div>;
};

Card.Footer = function CardFooter({ children, className = '' }) {
  return (
    <div className={`mt-4 pt-4 border-t border-gray-100 ${className}`}>
      {children}
    </div>
  );
};
