import React, { useEffect, useState } from 'react';
import { useNavigationStore } from '../../stores/navigation';
import { getRouteTitle } from '../../router';
import { AppIcon } from '../ui/AppIcon';

const TitleBar: React.FC = () => {
  const { current, history, back, canGoBack } = useNavigationStore();
  const [isMaximized, setIsMaximized] = useState(false);
  const canBack = canGoBack();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'ArrowLeft' && canBack) {
        e.preventDefault();
        back();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canBack, back]);

  const title = getRouteTitle(current.name, current.args);
  const showBreadcrumbs = current.name !== 'home';

  return (
    <div className="title-bar unselectable">
      <div className="title-bar-left">
        <button
          className={`title-bar-back button-title-bar ${canBack ? 'visible' : 'hidden'}`}
          onClick={() => canBack && back()}
          title="Назад (Alt+←)"
          disabled={!canBack}
        >
          <AppIcon name="chevron-left" size={14} />
        </button>

        <div className="title-bar-app-name">
          AniDesk <sup>β</sup>
        </div>

        {showBreadcrumbs && (
          <>
            <div className="title-bar-separator">/</div>
            <div className="title-bar-page-title">{title}</div>
          </>
        )}
      </div>

      <div className="title-bar-center">
        {/* Search hint */}
        <div className="title-bar-search-hint" onClick={() => useNavigationStore.getState().navigate('search')}>
          <AppIcon name="search" size={12} />
          <span>Поиск</span>
          <kbd>Ctrl+K</kbd>
        </div>
      </div>

      <div className="title-bar-right">
        <button
          className="title-bar-minimize button-title-bar"
          onClick={() => (window as any).titleBarAPI?.minimize()}
          title="Свернуть"
        >
          <svg aria-hidden="true" role="img" width="12" height="12" viewBox="0 0 12 12">
            <rect fill="currentColor" width="10" height="1" x="1" y="6" />
          </svg>
        </button>
        <button
          className="title-bar-maximize button-title-bar"
          onClick={async () => {
            (window as any).titleBarAPI?.maximize();
            setIsMaximized(!isMaximized);
          }}
          title={isMaximized ? "Восстановить" : "Развернуть"}
        >
          <svg aria-hidden="true" role="img" width="12" height="12" viewBox="0 0 12 12">
            <rect width="9" height="9" x="1.5" y="1.5" fill="none" stroke="currentColor" />
          </svg>
        </button>
        <button
          className="title-bar-close button-title-bar"
          onClick={() => (window as any).titleBarAPI?.close()}
          title="Закрыть"
        >
          <svg aria-hidden="true" role="img" width="12" height="12" viewBox="0 0 12 12">
            <polygon fill="currentColor" fillRule="evenodd" points="11 1.576 6.583 6 11 10.424 10.424 11 6 6.583 1.576 11 1 10.424 5.417 6 1 1.576 1.576 1 6 5.417 10.424 1" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default TitleBar;
