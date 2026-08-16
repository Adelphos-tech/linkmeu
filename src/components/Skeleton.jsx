import React from 'react';

// Base skeleton component with shimmer animation
const Skeleton = ({ className = '', variant = 'rectangular' }) => {
  const baseClasses = 'animate-pulse bg-gray-200';
  
  const variantClasses = {
    rectangular: 'rounded-lg',
    circular: 'rounded-full',
    text: 'rounded h-4',
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`} />
  );
};

// Listing Card Skeleton
export const ListingCardSkeleton = () => (
  <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
    {/* Image skeleton */}
    <Skeleton className="h-48 w-full rounded-none" />
    
    {/* Content */}
    <div className="p-4 space-y-3">
      {/* Title */}
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-full" />
      
      {/* Location */}
      <div className="flex items-center gap-2">
        <Skeleton className="w-4 h-4" variant="circular" />
        <Skeleton className="h-3 w-24" />
      </div>
      
      {/* Contact */}
      <div className="pt-3 border-t border-gray-100 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="w-4 h-4" variant="circular" />
          <Skeleton className="h-3 w-32" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="w-4 h-4" variant="circular" />
          <Skeleton className="h-3 w-40" />
        </div>
      </div>
    </div>
  </div>
);

// Event Card Skeleton (dark theme)
export const EventCardSkeleton = () => (
  <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl overflow-hidden">
    {/* Image skeleton */}
    <div className="relative h-48 bg-gray-800 animate-pulse">
      <div className="absolute top-4 left-4 w-20 h-6 bg-gray-700 rounded-full" />
    </div>
    
    {/* Content */}
    <div className="p-5 space-y-3">
      {/* Title */}
      <div className="h-5 bg-gray-700 rounded w-3/4 animate-pulse" />
      
      {/* Date */}
      <div className="flex items-center gap-3">
        <div className="w-4 h-4 bg-gray-700 rounded animate-pulse" />
        <div className="h-3 bg-gray-700 rounded w-32 animate-pulse" />
      </div>
      
      {/* Venue */}
      <div className="flex items-center gap-3">
        <div className="w-4 h-4 bg-gray-700 rounded animate-pulse" />
        <div className="h-3 bg-gray-700 rounded w-24 animate-pulse" />
      </div>
      
      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-700/50 flex items-center justify-between">
        <div className="h-3 bg-gray-700 rounded w-20 animate-pulse" />
        <div className="h-4 bg-gray-700 rounded w-24 animate-pulse" />
      </div>
    </div>
  </div>
);

// Grid of listing skeletons
export const ListingGridSkeleton = ({ count = 8 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <ListingCardSkeleton key={i} />
    ))}
  </div>
);

// Grid of event skeletons
export const EventGridSkeleton = ({ count = 6 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <EventCardSkeleton key={i} />
    ))}
  </div>
);

// Category tabs skeleton
export const CategoryTabsSkeleton = () => (
  <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
    {Array.from({ length: 6 }).map((_, i) => (
      <div 
        key={i} 
        className="h-10 bg-gray-200 rounded-xl animate-pulse flex-shrink-0"
        style={{ width: `${80 + Math.random() * 40}px` }}
      />
    ))}
  </div>
);

export default Skeleton;
