import { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full';
}

const maxWidthMap = {
  xs: 'max-w-xs',
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
  'full': 'max-w-full',
};

export default function PageContainer({ 
  children, 
  className,
  maxWidth = '7xl'
}: PageContainerProps) {
  return (
    <div className={cn(
      `w-full px-4 py-8 sm:px-6 md:px-8 md:py-12 mx-auto ${maxWidthMap[maxWidth]}`,
      className
    )}>
      {children}
    </div>
  );
}