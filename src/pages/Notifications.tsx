import React from 'react';
import MetaInfo from '../components/gui/MetaInfo';
import { AppIcon } from '../components/ui/AppIcon';

const Notifications: React.FC = () => {
  return (
    <>
      <MetaInfo subTitle="Уведомления" />
      <div className="page-container">
        <h1 className="page-title">Уведомления</h1>
        <div className="empty-state">
          <AppIcon name="notifications" size={64} />
          <h3>Нет уведомлений</h3>
          <p>Здесь будут уведомления о новых сериях и активности друзей</p>
        </div>
      </div>
    </>
  );
};
export default Notifications;
