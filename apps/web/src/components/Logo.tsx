import React from 'react';

export type LogoVariant = 'full' | 'icon-only' | 'text-only';
export type LogoSize = 'sm' | 'md' | 'lg';

export interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: LogoVariant;
  size?: LogoSize;
  label?: string;
}

const sizeMap: Record<LogoSize, { box: string; text: string }> = {
  sm: { box: 'w-8 h-8', text: 'text-base' },
  md: { box: 'w-10 h-10', text: 'text-lg' },
  lg: { box: 'w-12 h-12', text: 'text-xl' },
};

export const Logo: React.FC<LogoProps> = ({
  variant = 'full',
  size = 'md',
  label = 'Suptia',
  className = '',
  ...rest
}) => {
  const s = sizeMap[size];

  const Icon = (
    <div
      className={`inline-flex items-center justify-center rounded-xl shadow-lg bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-500 ${s.box}`}
      aria-hidden='true'
    >
      <span className='text-white font-bold select-none'>S</span>
    </div>
  );

  const Text = (
    <div className='flex flex-col ml-2'>
      <span
        className={`font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent ${s.text}`}
      >
        サプティア
      </span>
      <span className='text-xs text-gray-500 font-medium -mt-0.5'>Suptia</span>
    </div>
  );

  return (
    <div
      className={`flex items-center ${className}`}
      aria-label={label}
      {...rest}
    >
      {(variant === 'full' || variant === 'icon-only') && Icon}
      {(variant === 'full' || variant === 'text-only') && Text}
    </div>
  );
};

export default Logo;
