import React from 'react';
import MetaInfo from '../components/gui/MetaInfo';
import { AppIcon } from '../components/ui/AppIcon';

const Friends: React.FC = () => {
  return (
    <>
      <MetaInfo subTitle="Друзья" />
      <div className="page-container">
        <h1 className="page-title">Друзья</h1>
        <div className="empty-state">
          <AppIcon name="friends" size={64} />
          <h3>Список друзей пуст</h3>
          <p>Добавляйте друзей чтобы видеть что они смотрят</p>
        </div>
      </div>
    </>
  );
};
export default Friends;
