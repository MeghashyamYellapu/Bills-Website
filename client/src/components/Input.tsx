import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, className, ...props }, ref) => {
    return (
      <div className="w-full">
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 ml-1">
          {label}
        </label>
        <input
          ref={ref}
          className={`
            w-full px-4 py-2.5 rounded-xl
            bg-white border-2 border-border
            text-foreground placeholder:text-muted-foreground/50
            focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200 text-sm font-medium
            ${className}
          `}
          {...props}
        />
      </div>
    );
  }
);
Input.displayName = "Input";
