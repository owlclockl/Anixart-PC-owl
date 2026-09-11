import React, { useState, useEffect } from 'react';
import MetaInfo from '../components/gui/MetaInfo';
import { AppIcon } from '../components/ui/AppIcon';
import AnimeFullRowCard from '../components/elements/AnimeFullRowCard';
import { AnimeListSkeleton } from '../components/elements/Skeleton';

const SearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [filters, setFilters] = useState({ year: '', genre: '', status: '' });

  const handleSearch = async (searchQuery: string = query) => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    setHasSearched(true);
    
    try {
      if (window.anixApi?.search?.search) {
        const data = await window.anixApi.search.search(searchQuery);
        setResults(data.content || data || []);
      } else {
        await new Promise(r => setTimeout(r, 500));
        setResults(Array.from({ length: 6 }, (_, i) => ({
          id: i,
          title_ru: `${searchQuery} - результат ${i + 1}`,
          title: `Search result ${i + 1}`,
          description: `Описание для поискового запроса "${searchQuery}"`,
          image: `https://picsum.photos/seed/search${i}/140/205`,
          episodes_released: 12,
          episodes_total: 24,
          grade: 4.2,
        })));
      }
    } catch (e) {
      console.error(e);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && document.activeElement?.tagName === 'INPUT') {
        handleSearch();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [query]);

  return (
    <>
      <MetaInfo subTitle="Поиск" />
      
      <div className="search-page">
        <div className="search-header">
          <h1 className="page-title">Поиск</h1>
          
          <div className="search-bar-large">
            <AppIcon name="search" size={20} />
            <input
              type="text"
              placeholder="Название аниме, жанр, студия..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              className="search-input-large"
            />
            {query && (
              <button onClick={() => { setQuery(''); setResults([]); setHasSearched(false); }} className="search-clear">
                <AppIcon name="x" size={18} />
              </button>
            )}
            <button onClick={() => handleSearch()} className="search-button">
              Найти
            </button>
          </div>

          <div className="search-filters">
            <select value={filters.year} onChange={(e) => setFilters({ ...filters, year: e.target.value })} className="filter-select">
              <option value="">Год</option>
              {Array.from({ length: 10 }, (_, i) => 2024 - i).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="filter-select">
              <option value="">Статус</option>
              <option value="1">Завершён</option>
              <option value="2">Онгоинг</option>
              <option value="3">Анонс</option>
            </select>
            <select value={filters.genre} onChange={(e) => setFilters({ ...filters, genre: e.target.value })} className="filter-select">
              <option value="">Жанр</option>
              <option value="action">Экшен</option>
              <option value="adventure">Приключения</option>
              <option value="comedy">Комедия</option>
              <option value="drama">Драма</option>
            </select>
          </div>
        </div>

        <div className="search-content">
          {isLoading ? (
            <AnimeListSkeleton count={5} />
          ) : !hasSearched ? (
            <div className="search-empty">
              <AppIcon name="search" size={64} />
              <h3>Начните поиск</h3>
              <p>Введите название аниме или используйте фильтры</p>
              <div className="search-suggestions">
                <span>Популярные запросы:</span>
                <div className="suggestion-tags">
                  {['Наруто', 'Атака титанов', 'Ван Пис', 'Магическая битва'].map(tag => (
                    <button key={tag} className="suggestion-tag" onClick={() => { setQuery(tag); handleSearch(tag); }}>{tag}</button>
                  ))}
                </div>
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="search-empty">
              <AppIcon name="search" size={64} />
              <h3>Ничего не найдено</h3>
              <p>По запросу "{query}" ничего не нашлось</p>
            </div>
          ) : (
            <>
              <div className="search-results-info">
                Найдено {results.length} результатов по запросу "{query}"
              </div>
              <div className="search-results">
                {results.map((anime, i) => (
                  <AnimeFullRowCard key={`${anime.id}-${i}`} anime={anime} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default SearchPage;
