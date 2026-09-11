import React from 'react';
import MetaInfo from '../components/gui/MetaInfo';
import { AppIcon } from '../components/ui/AppIcon';
import { useAuthStore } from '../stores/auth';

const ProfilePage: React.FC<{ args?: any }> = ({ args }) => {
  const { profile, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return (
      <>
        <MetaInfo subTitle="Профиль" />
        <div className="profile-page guest">
          <div className="empty-state">
            <AppIcon name="user" size={64} />
            <h3>Вы не авторизованы</h3>
            <p>Войдите в аккаунт Anixart чтобы видеть профиль</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <MetaInfo subTitle={profile?.login || 'Профиль'} />
      <div className="profile-page">
        <div className="profile-header">
          <img src={profile?.avatar || './assets/icons/defaultAvatar.svg'} alt="avatar" className="profile-avatar-large" />
          <div className="profile-info">
            <h1>{profile?.login || `Пользователь #${args?.id}`}</h1>
            <div className="profile-stats">
              <div className="stat"><span className="stat-value">128</span><span className="stat-label">Аниме</span></div>
              <div className="stat"><span className="stat-value">42</span><span className="stat-label">Друзей</span></div>
              <div className="stat"><span className="stat-value">12</span><span className="stat-label">Коллекций</span></div>
            </div>
          </div>
        </div>
        <div className="profile-content">
          <div className="empty-state">
            <AppIcon name="sparkles" size={48} />
            <p>Профиль в разработке — скоро здесь будет статистика, история и достижения</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;
