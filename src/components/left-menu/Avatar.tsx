import React, { useState } from 'react';
import { AppIcon } from '../ui/AppIcon';

interface LeftMenuAvatarProps {
  onClickCallback: (() => void) | null;
  avatar: string;
  isAuthenticated?: boolean;
  login?: string;
  showLabel?: boolean;
}

const LeftMenuAvatar: React.FC<LeftMenuAvatarProps> = ({ 
  onClickCallback, 
  avatar,
  isAuthenticated = false,
  login,
  showLabel = false
}) => {
  const [imgError, setImgError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  return (
    <button 
      className={`left-menu-profile ${isAuthenticated ? 'authenticated' : 'guest'} ${showLabel ? 'with-label' : ''}`} 
      onClick={onClickCallback || undefined}
      title={isAuthenticated ? login : 'Войти'}
    >
      <div className="avatar-container">
        {isLoading && <div className="avatar-skeleton" />}
        <img 
          width="50" 
          height="50" 
          src={imgError ? "./assets/icons/defaultAvatar.svg" : avatar} 
          alt="avatar"
          onError={() => setImgError(true)}
          onLoad={() => setIsLoading(false)}
          style={{ opacity: isLoading ? 0 : 1 }}
        />
        {isAuthenticated && <div className="avatar-online-indicator" />}
      </div>
      
      {showLabel && (
        <div className="avatar-info">
          <span className="avatar-login">{isAuthenticated ? (login || 'Профиль') : 'Войти'}</span>
          <span className="avatar-status">{isAuthenticated ? 'Онлайн' : 'Гость'}</span>
        </div>
      )}

      {!isAuthenticated && showLabel && (
        <div className="avatar-login-icon">
          <AppIcon name="login" size={16} />
        </div>
      )}
    </button>
  );
};

export default LeftMenuAvatar;
