// Field: composed Label + Input + hint stack used across DeployView / AuthShell.
// Use Field for the common case; drop down to <Label> + <Input> directly for custom layouts.

import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { Input } from './input';
import { Label } from './label';
import { cn } from '../../lib/utils';

export interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  containerClassName?: string;
  id?: string;
}

export const Field = forwardRef<HTMLInputElement, FieldProps>(
  ({ label, hint, error, containerClassName, id, className, ...inputProps }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    return (
      <div className={cn('space-y-1', containerClassName)}>
        <Label htmlFor={inputId}>{label}</Label>
        <Input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          className={cn(error && 'border-error/60 focus:border-error', className)}
          {...inputProps}
        />
        {error ? (
          <div className="text-[11px] text-error">{error}</div>
        ) : hint ? (
          <div className="text-[11px] text-nautral-500">{hint}</div>
        ) : null}
      </div>
    );
  },
);
Field.displayName = 'Field';
