import React from 'react';
import MetaInfo from '../components/gui/MetaInfo';
import { AppIcon } from '../components/ui/AppIcon';

const Discover: React.FC = () => {
  return (
    <>
      <MetaInfo subTitle="Интересное" />
      <div className="page-container">
        <h1 className="page-title">Интересное</h1>
        <div className="discover-grid">
          {[
            { title: 'Топ 100', icon: 'star', color: '#FFD700' },
            { title: 'Случайное', icon: 'shuffle', color: '#8A2BE2' },
            { title: 'Новинки сезона', icon: 'sparkles', color: '#00CED1' },
            { title: 'Рекомендации', icon: 'heart', color: '#FF1493' },
          ].map(card => (
            <div key={card.title} className="discover-card" style={{ '--card-color': card.color } as React.CSSProperties}>
              <AppIcon name={card.icon as any} size={32} />
              <span>{card.title}</span>
            </div>
          ))}
        </div>
        <div className="empty-state">
          <AppIcon name="discover" size={48} />
          <p>Раздел интересного скоро наполнится контентом</p>
        </div>
      </div>
    </>
  );
};
export default Discover;
