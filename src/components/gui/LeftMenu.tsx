import React, { useState } from 'react';
import { useNavigationStore } from '../../stores/navigation';
import { useSettingsStore } from '../../stores/settings';
import { useAuthStore } from '../../stores/auth';
import { AppIcon, IconName } from '../ui/AppIcon';
import LeftMenuAvatar from '../left-menu/Avatar';

interface MenuItem {
  id: import('../../stores/navigation').RouteName;
  icon: IconName;
  label: string;
  badge?: number;
}

const topMenuItems: MenuItem[] = [
  { id: 'home', icon: 'home', label: 'Главная' },
  { id: 'bookmarks', icon: 'bookmark', label: 'Закладки' },
  { id: 'friends', icon: 'friends', label: 'Друзья' },
  { id: 'collections', icon: 'collections', label: 'Коллекции' },
  { id: 'discover', icon: 'discover', label: 'Интересное' },
  { id: 'search', icon: 'search', label: 'Поиск' },
];

const bottomMenuItems: MenuItem[] = [
  { id: 'notifications', icon: 'notifications', label: 'Уведомления' },
  { id: 'settings', icon: 'settings', label: 'Настройки' },
];

const LeftMenu: React.FC = () => {
  const { current, navigate } = useNavigationStore();
  const { gui, setGui } = useSettingsStore();
  const { isAuthenticated, profile } = useAuthStore();
  const [hovered, setHovered] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const isMenuExpanded = gui.leftMenuExpanded || isExpanded;
  const isPlayer = current.name === 'player';

  const handleMouseEnter = () => {
    if (!gui.leftMenuExpanded) {
      setIsExpanded(true);
    }
  };

  const handleMouseLeave = () => {
    if (!gui.leftMenuExpanded) {
      setIsExpanded(false);
    }
    setHovered(null);
  };

  const handleAvatarClick = () => {
    if (!isAuthenticated) {
      navigate('auth');
    } else {
      navigate('profile', { id: profile?.id || 0 });
    }
  };

  const renderMenuButton = (item: MenuItem) => {
    const isSelected = current.name === item.id;
    const isHovered = hovered === item.id;

    return (
      <button
        key={item.id}
        className={`left-menu-button ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
        onClick={() => navigate(item.id)}
        onMouseEnter={() => setHovered(item.id)}
        onMouseLeave={() => setHovered(null)}
        title={!isMenuExpanded ? item.label : undefined}
      >
        <div className="left-menu-button-icon">
          <AppIcon name={item.icon} size={20} strokeWidth={isSelected ? 2.5 : 2} />
          {item.badge && item.badge > 0 && (
            <span className="left-menu-badge">{item.badge > 99 ? '99+' : item.badge}</span>
          )}
        </div>
        {isMenuExpanded && (
          <span className="left-menu-button-label">{item.label}</span>
        )}
        {isSelected && <div className="left-menu-selected-indicator" />}
      </button>
    );
  };

  if (isPlayer) return null;

  return (
    <div
      className={`left-menu unselectable ${isMenuExpanded ? 'expanded' : 'collapsed'}`}
      style={{ width: isMenuExpanded ? '220px' : `${gui.leftMenuWidth}px`, minWidth: isMenuExpanded ? '220px' : `${gui.leftMenuWidth}px` }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="top-menu-content">
        <div className="left-menu-avatar-wrapper">
          <LeftMenuAvatar
            onClickCallback={handleAvatarClick}
            avatar={profile?.avatar || "./assets/icons/defaultAvatar.svg"}
            isAuthenticated={isAuthenticated}
            login={profile?.login}
            showLabel={isMenuExpanded}
          />
        </div>

        <div className="left-menu-divider" />

        <div className="left-menu-items">
          {topMenuItems.map(renderMenuButton)}
        </div>
      </div>

      <div className="bottom-menu-content">
        <div className="left-menu-items">
          {bottomMenuItems.map(renderMenuButton)}
        </div>

        {isMenuExpanded && (
          <button
            className="left-menu-pin-button"
            onClick={() => setGui({ leftMenuExpanded: !gui.leftMenuExpanded })}
            title={gui.leftMenuExpanded ? 'Открепить меню' : 'Закрепить меню'}
          >
            <AppIcon name={gui.leftMenuExpanded ? 'chevron-left' : 'chevron-right'} size={16} />
          </button>
        )}
      </div>

      {/* Tooltip for collapsed state */}
      {hovered && !isMenuExpanded && (
        <div className="left-menu-tooltip" style={{ top: `${getTooltipTop(hovered)}px` }}>
          {[...topMenuItems, ...bottomMenuItems].find(i => i.id === hovered)?.label}
        </div>
      )}
    </div>
  );
};

function getTooltipTop(id: string): number {
  const order: Record<string, number> = {
    home: 110,
    bookmarks: 160,
    friends: 210,
    collections: 260,
    discover: 310,
    search: 360,
    notifications: -80,
    settings: -30,
  };
  return order[id] || 100;
}

export default LeftMenu;
