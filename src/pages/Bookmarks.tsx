import React, { useState } from 'react';
import MetaInfo from '../components/gui/MetaInfo';
import { AppIcon } from '../components/ui/AppIcon';
import { useSettingsStore } from '../stores/settings';

const BOOKMARK_TABS = [
  { id: 0, label: 'Смотрю', color: '--watching-color', icon: 'play' as const },
  { id: 1, label: 'В планах', color: '--plan-color', icon: 'clock' as const },
  { id: 2, label: 'Просмотрено', color: '--completed-color', icon: 'check' as const },
  { id: 3, label: 'Отложено', color: '--hold-on-color', icon: 'bookmark' as const },
  { id: 4, label: 'Брошено', color: '--dropped-color', icon: 'x' as const },
];

const Bookmarks: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [sortBy, setSortBy] = useState(1);

  return (
    <>
      <MetaInfo subTitle="Закладки" />
      
      <div className="bookmarks-header">
        <h1 className="page-title">Закладки</h1>
        <div className="bookmarks-actions">
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(Number(e.target.value))}
            className="bookmarks-sort-select"
          >
            <option value={1}>Сначала новые</option>
            <option value={2}>Сначала старые</option>
            <option value={5}>А-Я</option>
            <option value={6}>Я-А</option>
          </select>
        </div>
      </div>

      <div className="bookmarks-tabs">
        {BOOKMARK_TABS.map(tab => (
          <button
            key={tab.id}
            className={`bookmarks-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            style={{ '--tab-color': `var(${tab.color})` } as React.CSSProperties}
          >
            <AppIcon name={tab.icon} size={16} />
            {tab.label}
            <span className="tab-count">0</span>
          </button>
        ))}
      </div>

      <div className="bookmarks-content">
        <div className="empty-state">
          <div className="empty-icon">
            <AppIcon name="bookmark" size={64} />
          </div>
          <h3>Список пуст</h3>
          <p>Аниме из категории "{BOOKMARK_TABS[activeTab].label}" появятся здесь</p>
          <button className="base-main-button primary" onClick={() => window.location.reload()}>
            <AppIcon name="search" size={16} />
            Найти аниме
          </button>
        </div>
      </div>
    </>
  );
};

export default Bookmarks;
