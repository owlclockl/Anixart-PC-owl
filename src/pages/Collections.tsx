import React from 'react';
import MetaInfo from '../components/gui/MetaInfo';
import { AppIcon } from '../components/ui/AppIcon';

const Collections: React.FC = () => {
  return (
    <>
      <MetaInfo subTitle="Коллекции" />
      <div className="page-container">
        <h1 className="page-title">Коллекции</h1>
        <div className="empty-state">
          <AppIcon name="collections" size={64} />
          <h3>Коллекции в разработке</h3>
          <p>Создавайте свои подборки аниме и делитесь ими с друзьями</p>
        </div>
      </div>
    </>
  );
};
export default Collections;
