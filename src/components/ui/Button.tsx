import { type ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const variants = {
  primary:
    'bg-amber-600 text-white shadow-sm shadow-amber-600/20 hover:bg-amber-700 active:bg-amber-800',
  secondary:
    'bg-stone-100 text-stone-900 hover:bg-stone-200 active:bg-stone-300',
  danger:
    'bg-red-600 text-white shadow-sm shadow-red-600/15 hover:bg-red-700 active:bg-red-800',
  ghost: 'bg-transparent text-stone-700 hover:bg-stone-100',
};

const sizes = {
  sm: 'px-3.5 py-1.5 text-sm rounded-full',
  md: 'px-5 py-2.5 text-base rounded-full',
  lg: 'px-6 py-3.5 text-lg rounded-full',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  className = '',
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center font-semibold tracking-wide transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : null}
      {children}
    </button>
  );
}
