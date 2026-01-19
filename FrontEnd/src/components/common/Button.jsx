const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'medium',
  icon,
  onClick,
  className = '',
  disabled = false 
}) => {
  const variants = {
    primary: 'bg-[#00ff9d] text-black hover:bg-[#00ff9d]/90',
    secondary: 'bg-white/10 text-white hover:bg-white/15',
    'icon-only': 'bg-transparent text-white p-2 hover:bg-white/10 min-w-0',
  };

  const sizes = {
    small: 'px-3 py-1.5 text-xs',
    medium: 'px-5 py-2.5 text-sm',
    large: 'px-7 py-3.5 text-base',
  };

  return (
    <button 
      className={`inline-flex items-center justify-center gap-2 border-0 rounded-md font-semibold cursor-pointer transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 ${variants[variant]} ${sizes[size]} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span className="flex items-center text-lg">{icon}</span>}
      {children}
    </button>
  );
};

export default Button;
