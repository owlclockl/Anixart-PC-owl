import React, { useState } from 'react';
import AnimePoster from '../release/AnimePoster';
import { useNavigationStore } from '../../stores/navigation';
import { AppIcon } from '../ui/AppIcon';

interface AnimeGridCardProps {
  anime: any;
}

const AnimeGridCard: React.FC<AnimeGridCardProps> = ({ anime }) => {
  const { navigate } = useNavigationStore();
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    navigate('anime', { id: anime.id, title: anime.title_ru || anime.title });
  };

  return (
    <div 
      className={`anime-grid-card ${isHovered ? 'hovered' : ''}`}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="grid-poster-wrapper">
        <AnimePoster 
          size={{ width: 180, height: 260 }} 
          posterInfo={{ poster: anime.image, title: anime.title }} 
          shadow={true} 
          borderRadius={16} 
          posterStyle={anime.profile_list_status ?? 0}
        />
        <div className={`grid-hover-overlay ${isHovered ? 'visible' : ''}`}>
          <button className="grid-play-btn">
            <AppIcon name="play" size={24} />
          </button>
          <div className="grid-overlay-info">
            <span className="grid-episodes">
              {anime.episodes_released || '?'} / {anime.episodes_total || '?'} эп.
            </span>
            {anime.grade && (
              <span className="grid-grade">★ {typeof anime.grade === 'number' ? anime.grade.toFixed(1) : anime.grade}</span>
            )}
          </div>
        </div>
        {anime.status?.id === 2 && <div className="grid-status-badge ongoing">Онгоинг</div>}
        {anime.status?.id === 1 && <div className="grid-status-badge completed">Завершён</div>}
      </div>
      
      <div className="grid-card-info">
        <div className="grid-title" title={anime.title_ru || anime.title}>
          {anime.title_ru || anime.title}
        </div>
        <div className="grid-meta">
          <span>{anime.year || ''}</span>
          {anime.year && anime.genres?.[0] && <span> • </span>}
          <span>{typeof anime.genres?.[0] === 'string' ? anime.genres[0] : anime.genres?.[0]?.name || ''}</span>
        </div>
      </div>
    </div>
  );
};

export default AnimeGridCard;
