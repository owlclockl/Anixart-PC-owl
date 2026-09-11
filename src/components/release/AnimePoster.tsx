import React, { useState, useEffect, useRef } from 'react';

interface AnimePosterProps {
  size: {
    width: number;
    height: number;
  };
  posterInfo: {
    poster: string;
    title: string;
  };
  shadow?: boolean;
  borderRadius?: number;
  posterStyle?: number;
  zIndex?: number;
}

const AnimePoster: React.FC<AnimePosterProps> = ({
  size,
  posterInfo,
  shadow = false,
  borderRadius = 20,
  posterStyle = 0,
  zIndex = 0
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  const posterStyles = [
    { color: "", text: "", borderEnabled: false },
    {
      color: "--watching-color",
      shadowColor: "--watching-shadow-color",
      text: "Смотрю",
      borderEnabled: true,
    },
    {
      color: "--plan-color",
      shadowColor: "--plan-shadow-color",
      text: "В планах",
      borderEnabled: true,
    },
    {
      color: "--completed-color",
      shadowColor: "--completed-shadow-color",
      text: "Просмотрено",
      borderEnabled: true,
    },
    {
      color: "--hold-on-color",
      shadowColor: "--hold-on-shadow-color",
      text: "Отложено",
      borderEnabled: true,
    },
    {
      color: "--dropped-color",
      shadowColor: "--dropped-shadow-color",
      text: "Брошено",
      borderEnabled: true,
    },
  ];

  const style = posterStyles[posterStyle] || posterStyles[0];

  // Lazy loading with IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={imgRef}
      className="anime-poster"
      style={{
        '--width': `${size.width}px`,
        '--height': `${size.height}px`,
        '--border-radius': `${borderRadius}px`,
        '--shadow-color': `var(${style.shadowColor})`,
        '--color': `var(${style.color}, transparent)`,
        '--border-enabled': style.borderEnabled ? 'solid' : 'none',
        '--z-index': (style.borderEnabled ? -1 : 0) + zIndex
      } as React.CSSProperties}
    >
      <div
        className="anime-poster-text"
        style={{ display: style.borderEnabled ? "flex" : "none" }}
      >
        {style.text}
      </div>
      <div className={`anime-poster-skeleton ${!isLoading ? 'hide' : ''}`}></div>
      {isInView ? (
        <img
          className={shadow ? 'anime-poster-shadow' : ''}
          width={size.width}
          height={size.height}
          src={hasError ? './assets/images/no_image.jpg' : posterInfo.poster}
          alt={posterInfo.title}
          loading="lazy"
          decoding="async"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setHasError(true);
            setIsLoading(false);
          }}
          style={{ 
            opacity: isLoading ? 0 : 1,
            transition: 'opacity 0.3s ease',
          }}
        />
      ) : (
        <div style={{ width: size.width, height: size.height }} />
      )}
    </div>
  );
};

export default AnimePoster;
