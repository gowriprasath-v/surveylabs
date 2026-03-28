export default function ToggleSwitch({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <div className="relative">
        <input 
          type="checkbox" 
          className="sr-only" 
          checked={checked} 
          onChange={(e) => onChange(e.target.checked)}
        />
        {/* Track */}
        <div className={`block w-10 h-6 rounded-full transition-colors duration-200 ease-in-out ${checked ? 'bg-[var(--brand)]' : 'bg-[var(--border-strong)]'}`}></div>
        {/* Thumb */}
        <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out shadow-sm ${checked ? 'translate-x-4' : 'translate-x-0'}`}></div>
      </div>
      {label && (
        <span className="text-sm font-medium text-[var(--text-primary)] select-none">
          {label}
        </span>
      )}
    </label>
  );
}
