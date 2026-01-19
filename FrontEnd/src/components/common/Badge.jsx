const Badge = ({ children, variant = 'default', icon, className = '' }) => {
  const variants = {
    default: 'bg-white/10 text-white',
    cashback: 'bg-[#00ff9d]/15 text-[#00ff9d] border border-[#00ff9d]/30',
    platform: 'bg-white/95 text-gray-800 text-[10px] px-1.5 py-0.5',
    region: 'bg-transparent text-[#23c299] text-[11px] font-bold',
    discount: 'bg-transparent text-[#84e916] font-bold p-0',
  };

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ${variants[variant]} ${className}`} style={{ fontSize: '12px', fontWeight: 800, fontFamily: 'Metropolis, Arial, Helvetica, sans-serif' }}>
      {icon && <span className="flex items-center text-sm">{icon}</span>}
      <span>{children}</span>
    </div>
  );
};

export default Badge;
