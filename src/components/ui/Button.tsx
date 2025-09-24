interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

export function Button({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md', 
  disabled = false,
  className = ''
}: ButtonProps) {
  const baseClasses = "font-black tracking-tight transition-all duration-150 cursor-pointer uppercase inline-flex items-center justify-center border-[3px]";
  
  const variantClasses = {
    primary: "bg-[hsl(var(--celo-yellow))] text-[hsl(var(--celo-black))] border-[hsl(var(--celo-black))] hover:bg-[hsl(var(--celo-black))] hover:text-[hsl(var(--celo-yellow))]",
    secondary: "bg-[hsl(var(--celo-tan-2))] text-[hsl(var(--celo-black))] border-[hsl(var(--celo-black))] hover:bg-[hsl(var(--celo-black))] hover:text-[hsl(var(--celo-tan-2))]",
    outline: "bg-transparent text-[hsl(var(--celo-black))] border-[hsl(var(--celo-black))] hover:bg-[hsl(var(--celo-black))] hover:text-[hsl(var(--celo-white))]"
  };
  
  const sizeClasses = {
    sm: "px-4 py-2 text-xs",
    md: "px-6 py-3 text-sm",
    lg: "px-8 py-4 text-base"
  };
  
  const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : "";
  
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`}
    >
      {children}
    </button>
  );
}