import React, { ReactNode, useState } from 'react';
import AnimePoster from '../release/AnimePoster';
import Dot from './Dot';
import { useNavigationStore } from '../../stores/navigation';
import { AppIcon } from '../ui/AppIcon';

interface AnimeFullRowCardProps {
  inModal?: boolean;
  anime: any;
  children?: ReactNode;
}

const AnimeFullRowCard: React.FC<AnimeFullRowCardProps> = ({ 
  inModal = false, 
  anime, 
  children 
}) => {
  const { navigate } = useNavigationStore();
  const [isHovered, setIsHovered] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const handleClick = () => {
    navigate('anime', { id: anime.id, title: anime.title_ru || anime.title });
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsBookmarked(!isBookmarked);
    // TODO: API call to add/remove bookmark
  };

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('player', { id: anime.id, title: anime.title_ru });
  };

  return (
    <div 
      className={`anime-full-row-card flex-row ${isHovered ? 'hovered' : ''}`}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="full-row-anime-poster">
        <AnimePoster 
          size={{ width: 140, height: 205 }} 
          zIndex={inModal ? 2 : 0} 
          posterInfo={{ poster: anime.image, title: anime.title }} 
          shadow={true} 
          borderRadius={16} 
          posterStyle={anime.profile_list_status ?? 0}
        />
        {isHovered && (
          <div className="poster-hover-overlay">
            <button className="poster-play-btn" onClick={handlePlay}>
              <AppIcon name="play" size={20} />
            </button>
          </div>
        )}
      </div>
      <div className="flex-column anime-full-row-content">
        <div className="anime-item-title-row">
          <div className="anime-item-title">{anime.title_ru || anime.title}</div>
          <button 
            className={`anime-bookmark-btn ${isBookmarked ? 'bookmarked' : ''}`}
            onClick={handleBookmark}
            title={isBookmarked ? 'Убрать из закладок' : 'В закладки'}
          >
            <AppIcon name="bookmark" size={18} />
          </button>
        </div>
        {children}
        <div className="anime-item-meta flex-row">
          <span className="anime-ep-count">
            {(window as any).utils?.returnEpisodeString?.(anime) || `${anime.episodes_released || '?'} эп.`}
          </span>
          {anime.grade && (
            <>
              <Dot size={{ width: 4, height: 4 }} />
              <span className="anime-grade">
                <AppIcon name="star" size={12} />
                {typeof anime.grade === 'number' ? anime.grade.toFixed(2) : anime.grade}
              </span>
            </>
          )}
          {anime.year && (
            <>
              <Dot size={{ width: 4, height: 4 }} />
              <span className="anime-year">{anime.year}</span>
            </>
          )}
        </div>
        <div className="anime-item-description">
          {anime.description ? `${anime.description.slice(0, 200)}...` : 'Описание отсутствует'}
        </div>
        {anime.genres && (
          <div className="anime-genres">
            {(Array.isArray(anime.genres) ? anime.genres : []).slice(0, 3).map((g: any, i: number) => (
              <span key={i} className="anime-genre-tag">{typeof g === 'string' ? g : g.name || g.title}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnimeFullRowCard;
