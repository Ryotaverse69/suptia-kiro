import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  hint?: string;
  isInvalid?: boolean;
  wrapperClassName?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      leadingIcon,
      trailingIcon,
      hint,
      isInvalid = false,
      wrapperClassName,
      id,
      ...props
    },
    ref
  ) => {
    const describedBy = React.useId();

    return (
      <div className={cn('space-y-2', wrapperClassName)}>
        <div className='relative flex items-center'>
          {leadingIcon ? (
            <span className='pointer-events-none absolute left-4 flex h-5 w-5 items-center justify-center text-slate-400'>
              {leadingIcon}
            </span>
          ) : null}

          <input
            id={id}
            ref={ref}
            aria-invalid={isInvalid}
            aria-describedby={hint ? describedBy : undefined}
            className={cn(
              'h-12 w-full rounded-2xl border border-border bg-white px-4 text-base text-slate-900 shadow-soft transition-all duration-200 ease-apple placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400',
              leadingIcon ? 'pl-11' : 'pl-4',
              trailingIcon ? 'pr-11' : 'pr-4',
              isInvalid &&
                'border-rose-400 focus-visible:ring-rose-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
              className
            )}
            {...props}
          />

          {trailingIcon ? (
            <span className='pointer-events-none absolute right-4 flex h-5 w-5 items-center justify-center text-slate-400'>
              {trailingIcon}
            </span>
          ) : null}
        </div>

        {hint ? (
          <p
            id={describedBy}
            className={cn(
              'text-xs text-slate-500',
              isInvalid && 'text-rose-500'
            )}
          >
            {hint}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
