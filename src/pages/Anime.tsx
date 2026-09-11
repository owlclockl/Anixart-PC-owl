import React, { useEffect, useState } from 'react';
import MetaInfo from '../components/gui/MetaInfo';
import { AppIcon } from '../components/ui/AppIcon';
import { useNavigationStore } from '../stores/navigation';
import Preloader from '../components/gui/Preloader';

const AnimePage: React.FC<{ args?: any }> = ({ args }) => {
  const { navigate } = useNavigationStore();
  const [anime, setAnime] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'episodes' | 'related'>('info');

  const animeId = args?.id;

  useEffect(() => {
    const loadAnime = async () => {
      setLoading(true);
      try {
        if (window.anixApi?.release?.info) {
          const data = await window.anixApi.release.info(animeId);
          setAnime(data);
        } else {
          // Mock
          await new Promise(r => setTimeout(r, 600));
          setAnime({
            id: animeId,
            title_ru: `Аниме #${animeId}`,
            title_original: `Anime #${animeId}`,
            description: 'Это подробное описание аниме. Здесь будет информация о сюжете, персонажах и другая полезная информация для зрителя.',
            image: `https://picsum.photos/seed/${animeId}/300/400`,
            year: 2023,
            season: 'Осень',
            episodes_total: 24,
            episodes_released: 12,
            duration: 24,
            grade: 4.5,
            genres: [{ name: 'Экшен' }, { name: 'Приключения' }, { name: 'Фэнтези' }],
            studio: { name: 'Studio Pierrot' },
            status: { name: 'Онгоинг' },
            screenshots: Array.from({ length: 6 }, (_, i) => `https://picsum.photos/seed/${animeId}${i}/400/225`),
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    if (animeId) loadAnime();
  }, [animeId]);

  if (loading) return <Preloader />;
  if (!anime) return <div className="error-state">Аниме не найдено</div>;

  return (
    <>
      <MetaInfo subTitle={anime.title_ru} title={anime.title_ru} />
      
      <div className="anime-page">
        <div className="anime-hero" style={{ backgroundImage: `url(${anime.image})` }}>
          <div className="anime-hero-overlay" />
          <div className="anime-hero-content">
            <img src={anime.image} alt={anime.title_ru} className="anime-hero-poster" />
            <div className="anime-hero-info">
              <h1 className="anime-hero-title">{anime.title_ru}</h1>
              <div className="anime-hero-original">{anime.title_original}</div>
              <div className="anime-hero-meta">
                <span className="meta-badge">{anime.year}</span>
                <span className="meta-badge">{anime.season}</span>
                <span className="meta-badge">{anime.episodes_released} / {anime.episodes_total} эп.</span>
                <span className="meta-badge grade">★ {anime.grade}</span>
              </div>
              <div className="anime-hero-actions">
                <button className="base-main-button primary" onClick={() => navigate('player', { id: anime.id, title: anime.title_ru })}>
                  <AppIcon name="play" size={18} />
                  Смотреть
                </button>
                <button className="base-main-button default">
                  <AppIcon name="bookmark" size={18} />
                  В закладки
                </button>
                <button className="base-main-button default">
                  <AppIcon name="heart" size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="anime-tabs">
          <button className={`anime-tab ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>Информация</button>
          <button className={`anime-tab ${activeTab === 'episodes' ? 'active' : ''}`} onClick={() => setActiveTab('episodes')}>Эпизоды</button>
          <button className={`anime-tab ${activeTab === 'related' ? 'active' : ''}`} onClick={() => setActiveTab('related')}>Связанное</button>
        </div>

        <div className="anime-content">
          {activeTab === 'info' && (
            <div className="anime-info-grid">
              <div className="anime-info-main">
                <h3>Описание</h3>
                <p className="anime-description">{anime.description}</p>
                
                {anime.screenshots && (
                  <>
                    <h3>Кадры</h3>
                    <div className="anime-screenshots">
                      {anime.screenshots.map((s: string, i: number) => (
                        <img key={i} src={s} alt={`Скрин ${i}`} className="anime-screenshot" />
                      ))}
                    </div>
                  </>
                )}
              </div>
              <div className="anime-info-sidebar">
                <div className="info-card">
                  <h4>Информация</h4>
                  <div className="info-row"><span>Год</span><span>{anime.year}</span></div>
                  <div className="info-row"><span>Сезон</span><span>{anime.season}</span></div>
                  <div className="info-row"><span>Студия</span><span>{anime.studio?.name}</span></div>
                  <div className="info-row"><span>Длительность</span><span>{anime.duration} мин.</span></div>
                  <div className="info-row"><span>Статус</span><span>{anime.status?.name}</span></div>
                </div>
                <div className="info-card">
                  <h4>Жанры</h4>
                  <div className="genre-list">
                    {anime.genres?.map((g: any, i: number) => (
                      <span key={i} className="genre-tag">{g.name}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'episodes' && (
            <div className="episodes-list">
              {Array.from({ length: anime.episodes_total || 12 }).map((_, i) => (
                <div key={i} className="episode-item" onClick={() => navigate('player', { id: anime.id, episode: i + 1, title: anime.title_ru })}>
                  <div className="episode-number">{i + 1}</div>
                  <div className="episode-info">
                    <div className="episode-title">Эпизод {i + 1}</div>
                    <div className="episode-date">{i < (anime.episodes_released || 0) ? 'Доступен' : 'Скоро'}</div>
                  </div>
                  <AppIcon name={i < (anime.episodes_released || 0) ? 'play' : 'clock'} size={16} />
                </div>
              ))}
            </div>
          )}

          {activeTab === 'related' && (
            <div className="empty-state">
              <AppIcon name="film" size={48} />
              <p>Связанные релизы скоро появятся</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AnimePage;
