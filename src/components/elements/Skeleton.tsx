import React from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  width = '100%', 
  height = '20px', 
  borderRadius = '8px',
  className = '',
  style = {}
}) => {
  return (
    <div 
      className={`skeleton ${className}`}
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: 'var(--skeleton-background-color)',
        animation: 'skeletonAnimation 1.5s ease-in-out infinite',
        ...style
      }}
    />
  );
};

export const AnimeCardSkeleton: React.FC<{ type?: 'row' | 'grid' }> = ({ type = 'row' }) => {
  if (type === 'grid') {
    return (
      <div className="anime-grid-card-skeleton flex-column" style={{ gap: '12px', padding: '12px' }}>
        <Skeleton width="100%" height="250px" borderRadius="16px" />
        <Skeleton width="80%" height="18px" />
        <Skeleton width="60%" height="14px" />
      </div>
    );
  }

  return (
    <div className="anime-full-row-card-skeleton flex-row" style={{ gap: '20px', margin: '20px' }}>
      <Skeleton width="140px" height="205px" borderRadius="20px" />
      <div className="flex-column" style={{ flex: 1, gap: '10px' }}>
        <Skeleton width="40%" height="20px" />
        <Skeleton width="30%" height="14px" />
        <Skeleton width="100%" height="60px" />
      </div>
    </div>
  );
};

export const AnimeListSkeleton: React.FC<{ count?: number; type?: 'row' | 'grid' }> = ({ count = 6, type = 'row' }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <AnimeCardSkeleton key={i} type={type} />
      ))}
    </>
  );
};
