interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  style
}: ButtonProps) {
  const baseClasses = "btn-industrial inline-flex items-center justify-center";
  
  const variantClasses = {
    primary: "btn-primary-industrial",
    secondary: "bg-[hsl(var(--celo-purple))] text-[hsl(var(--celo-white))] border-[hsl(var(--celo-black))] hover:bg-[hsl(var(--celo-yellow))] hover:text-[hsl(var(--celo-black))]",
    outline: "bg-[hsl(var(--celo-white))] text-[hsl(var(--celo-black))] border-[hsl(var(--celo-black))] hover:bg-[hsl(var(--celo-black))] hover:text-[hsl(var(--celo-yellow))]"
  };
  
  const sizeClasses = {
    sm: "px-4 py-2 text-xs",
    md: "px-6 py-3 text-sm", 
    lg: "px-8 py-4 text-base"
  };
  
  const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : "";
  
  const buttonStyle = {
    fontFamily: 'var(--font-body)',
    fontWeight: 'var(--font-weight-body-black)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.02em',
    transition: 'var(--transition-fast)',
    border: variant === 'primary' ? 'var(--outline-medium)' : 'var(--outline-medium)'
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ ...buttonStyle, ...style }}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`}
    >
      {children}
    </button>
  );
}