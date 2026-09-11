import React, { useState, useEffect, useCallback, useRef } from 'react';
import AnimeRowItem from '../components/elements/AnimeFullRowCard';
import AnimeGridCard from '../components/elements/AnimeGridCard';
import MetaInfo from '../components/gui/MetaInfo';
import Preloader from '../components/gui/Preloader';
import { AnimeListSkeleton } from '../components/elements/Skeleton';
import { useSettingsStore } from '../stores/settings';
import { AppIcon } from '../components/ui/AppIcon';

type ReleaseType = 0 | 1 | 2 | 3 | 4;

interface FilterArgs {
  sort: number;
  status_id: number | null;
  category_id: number | null;
}

const FILTER_MAP: Record<ReleaseType, { label: string; filter: FilterArgs }> = {
  0: { label: 'Последние', filter: { sort: 0, status_id: null, category_id: null } },
  1: { label: 'Онгоинги', filter: { sort: 0, status_id: 2, category_id: null } },
  2: { label: 'Анонсы', filter: { sort: 0, status_id: 3, category_id: null } },
  3: { label: 'Завершенные', filter: { sort: 0, status_id: 1, category_id: null } },
  4: { label: 'Фильмы', filter: { sort: 0, status_id: null, category_id: 2 } },
};

const Home: React.FC = () => {
  const { gui, setGui } = useSettingsStore();
  const [page, setPage] = useState(0);
  const [typeReleases, setTypeReleases] = useState<ReleaseType>(0);
  const [filterArgs, setFilterArgs] = useState<FilterArgs>(FILTER_MAP[0].filter);
  const [releases, setReleases] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const viewportRef = useRef<HTMLElement | null>(null);
  const loadingRef = useRef(false);
  const pageRef = useRef(0);

  const fetchReleases = useCallback(async (pageNum: number, filters: FilterArgs, append = false) => {
    if (loadingRef.current) return;
    loadingRef.current = true;

    try {
      if (!append) setIsLoading(true);
      else setIsLoadingMore(true);
      
      setError(null);

      // Check if API is available
      if (!window.anixApi?.release?.filter) {
        // Mock data for offline dev
        await new Promise(r => setTimeout(r, 800));
        const mockData = Array.from({ length: 12 }, (_, i) => ({
          id: pageNum * 12 + i,
          title_ru: `Тестовое аниме ${pageNum * 12 + i + 1}`,
          title: `Test Anime ${pageNum * 12 + i + 1}`,
          description: 'Это тестовое описание аниме для демонстрации интерфейса. В реальном приложении здесь будет описание с Anixart API.',
          image: `https://picsum.photos/seed/${pageNum * 12 + i}/140/205`,
          episodes_released: Math.floor(Math.random() * 24) + 1,
          episodes_total: 24,
          grade: (Math.random() * 2 + 3).toFixed(2),
          status: { id: [1,2,3][Math.floor(Math.random()*3)] },
          profile_list_status: Math.floor(Math.random() * 6),
        }));
        
        if (append) {
          setReleases(prev => [...prev, ...mockData]);
        } else {
          setReleases(mockData);
        }
        setHasMore(pageNum < 5);
        return;
      }

      const data = await window.anixApi.release.filter(pageNum, filters, true);
      
      if (append) {
        setReleases(prev => [...prev, ...(data.content || [])]);
      } else {
        setReleases(data.content || []);
      }
      
      setHasMore((data.content?.length || 0) >= 20);
    } catch (err: any) {
      console.error('Failed to fetch releases:', err);
      setError(err.message || 'Ошибка загрузки');
      if (!append) setReleases([]);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      loadingRef.current = false;
    }
  }, []);

  // Initial load
  useEffect(() => {
    pageRef.current = 0;
    setPage(0);
    fetchReleases(0, filterArgs, false);
  }, [filterArgs]);

  // Infinite scroll with IntersectionObserver
  useEffect(() => {
    const viewport = document.getElementById('viewport');
    if (!viewport) return;
    viewportRef.current = viewport;

    let ticking = false;
    
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      
      requestAnimationFrame(() => {
        if (!viewport || isLoading || isLoadingMore || !hasMore || loadingRef.current) {
          ticking = false;
          return;
        }

        const { scrollTop, scrollHeight, clientHeight } = viewport;
        const threshold = 2000;
        
        if (scrollTop + clientHeight >= scrollHeight - threshold) {
          const nextPage = pageRef.current + 1;
          pageRef.current = nextPage;
          setPage(nextPage);
          fetchReleases(nextPage, filterArgs, true);
        }
        ticking = false;
      });
    };

    viewport.addEventListener('scroll', handleScroll, { passive: true });
    return () => viewport.removeEventListener('scroll', handleScroll);
  }, [isLoading, isLoadingMore, hasMore, filterArgs, fetchReleases]);

  const handleTypeChange = (type: ReleaseType) => {
    if (type === typeReleases) return;
    
    const viewport = document.getElementById('viewport');
    setTypeReleases(type);
    setFilterArgs(FILTER_MAP[type].filter);
    pageRef.current = 0;
    setPage(0);
    setHasMore(true);
    if (viewport) viewport.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleViewType = () => {
    const types: Array<'full-row' | 'grid' | 'compact'> = ['full-row', 'grid', 'compact'];
    const currentIndex = types.indexOf(gui.releaseCardType);
    const next = types[(currentIndex + 1) % types.length];
    setGui({ releaseCardType: next });
  };

  const filteredReleases = searchQuery
    ? releases.filter(r => 
        r.title_ru?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.title?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : releases;

  return (
    <>
      <MetaInfo subTitle="Главная" />
      
      <div className="home-header">
        <div className="releases-type">
          {Object.entries(FILTER_MAP).map(([key, { label }]) => (
            <button
              key={key}
              className={`releases-type-title ${typeReleases === Number(key) ? 'selected' : ''}`}
              onClick={() => handleTypeChange(Number(key) as ReleaseType)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="home-actions">
          <div className="home-search">
            <AppIcon name="search" size={16} />
            <input
              type="text"
              placeholder="Фильтр на странице..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="home-search-input"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="home-search-clear">
                <AppIcon name="x" size={14} />
              </button>
            )}
          </div>

          <button className="view-toggle-button" onClick={toggleViewType} title="Сменить вид">
            <AppIcon name={gui.releaseCardType === 'grid' ? 'grid' : gui.releaseCardType === 'compact' ? 'list' : 'list'} size={18} />
            <span className="view-toggle-label">
              {gui.releaseCardType === 'grid' ? 'Сетка' : gui.releaseCardType === 'compact' ? 'Компакт' : 'Список'}
            </span>
          </button>
        </div>
      </div>
      
      <div className={`releases-container ${gui.releaseCardType}`}>
        {isLoading ? (
          <AnimeListSkeleton count={8} type={gui.releaseCardType === 'grid' ? 'grid' : 'row'} />
        ) : error ? (
          <div className="home-error">
            <div className="home-error-icon">😿</div>
            <h3>Не удалось загрузить</h3>
            <p>{error}</p>
            <button className="base-main-button primary" onClick={() => fetchReleases(0, filterArgs, false)}>
              <AppIcon name="refresh" size={16} />
              Попробовать снова
            </button>
          </div>
        ) : filteredReleases.length === 0 ? (
          <div className="home-empty">
            <AppIcon name="search" size={48} />
            <h3>Ничего не найдено</h3>
            <p>Попробуй изменить фильтры или поисковый запрос</p>
          </div>
        ) : (
          <>
            {filteredReleases.map((release, index) => (
              gui.releaseCardType === 'grid' ? (
                <AnimeGridCard key={`${release.id}-${index}`} anime={release} />
              ) : (
                <AnimeRowItem key={`${release.id}-${index}`} anime={release} />
              )
            ))}
            
            {isLoadingMore && (
              <div className="loading-more">
                <AnimeListSkeleton count={3} type={gui.releaseCardType === 'grid' ? 'grid' : 'row'} />
              </div>
            )}

            {!hasMore && filteredReleases.length > 0 && (
              <div className="end-of-list">
                <span>Вы просмотрели все релизы • {filteredReleases.length} аниме</span>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default Home;
