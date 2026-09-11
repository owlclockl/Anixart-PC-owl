import React from 'react';
import { AppIcon, IconName } from '../ui/AppIcon';
import { useNavigationStore } from '../../stores/navigation';

interface LeftMenuButtonProps {
  routeName: import('../../stores/navigation').RouteName;
  icon: IconName;
  label: string;
  selected?: boolean;
  badge?: number;
  showLabel?: boolean;
}

const LeftMenuButton: React.FC<LeftMenuButtonProps> = ({ 
  routeName,
  icon, 
  label,
  selected,
  badge,
  showLabel = false
}) => {
  const { navigate, current } = useNavigationStore();
  const isSelected = selected ?? current.name === routeName;

  return (
    <button 
      className={`left-menu-button ${isSelected ? 'selected' : ''}`}
      onClick={() => navigate(routeName)}
      title={!showLabel ? label : undefined}
    >
      <div className="left-menu-button-icon">
        <AppIcon name={icon} size={20} strokeWidth={isSelected ? 2.5 : 2} />
        {badge && badge > 0 && <span className="left-menu-badge">{badge}</span>}
      </div>
      {showLabel && <span className="left-menu-button-label">{label}</span>}
      {isSelected && <div className="left-menu-selected-indicator" />}
    </button>
  );
};

export default LeftMenuButton;
