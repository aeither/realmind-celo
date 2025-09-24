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
  const baseClasses = "font-semibold rounded-2xl transition-all duration-300 cursor-pointer";
  
  const variantClasses = {
    primary: "bg-gradient-primary text-primary-foreground quiz-button-glow hover:scale-105 hover:animate-pulse-glow",
    secondary: "bg-secondary text-secondary-foreground border-2 border-primary/30 hover:bg-primary hover:text-primary-foreground hover:scale-105",
    outline: "bg-transparent text-primary border-2 border-primary hover:bg-primary hover:text-primary-foreground hover:scale-105"
  };
  
  const sizeClasses = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg"
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