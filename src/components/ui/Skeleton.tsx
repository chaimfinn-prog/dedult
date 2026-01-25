'use client';

import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className = '',
  variant = 'rectangular',
  width,
  height,
}: SkeletonProps) {
  const baseStyles = 'skeleton';
  const variantStyles = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-xl',
  };

  return (
    <motion.div
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      style={{ width, height }}
      initial={{ opacity: 0.5 }}
      animate={{ opacity: 1 }}
      transition={{ repeat: Infinity, duration: 1, ease: 'easeInOut' }}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="glass-card p-4">
      <div className="flex items-start gap-4">
        <Skeleton variant="rectangular" className="w-16 h-16" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" className="h-5 w-3/4" />
          <Skeleton variant="text" className="h-4 w-1/2" />
          <Skeleton variant="text" className="h-3 w-1/4" />
        </div>
        <div className="space-y-2">
          <Skeleton variant="text" className="h-6 w-16" />
          <Skeleton variant="text" className="h-4 w-12" />
        </div>
      </div>
    </div>
  );
}

export function BasketItemSkeleton() {
  return (
    <div className="flex items-center gap-3 p-4">
      <Skeleton variant="rectangular" className="w-12 h-12" />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" className="h-5 w-2/3" />
        <Skeleton variant="text" className="h-4 w-1/3" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton variant="circular" className="w-8 h-8" />
        <Skeleton variant="text" className="w-8 h-6" />
        <Skeleton variant="circular" className="w-8 h-8" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Skeleton className="h-28 col-span-2" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
      <Skeleton className="h-48" />
    </div>
  );
}

export function SearchResultSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 p-4">
          <Skeleton variant="rectangular" className="w-12 h-12" />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" className="h-5 w-3/4" />
            <Skeleton variant="text" className="h-4 w-1/2" />
          </div>
          <Skeleton variant="circular" className="w-8 h-8" />
        </div>
      ))}
    </div>
  );
}
