import React, { useState } from 'react';
import MetaInfo from '../components/gui/MetaInfo';
import { useSettingsStore } from '../stores/settings';
import { AppIcon, IconName } from '../components/ui/AppIcon';
import Utils from '../utils';

type SettingsTab = 'general' | 'player' | 'appearance' | 'account' | 'about';

const SettingsPage: React.FC = () => {
  const { gui, player, app, endpointUrl, setGui, setPlayer, setApp, setEndpoint } = useSettingsStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [versions, setVersions] = useState<any>(null);

  React.useEffect(() => {
    (window as any).prc?.getVersions().then((v: any) => setVersions(v));
  }, []);

  const tabs: { id: SettingsTab; label: string; icon: IconName }[] = [
    { id: 'general', label: 'Общие', icon: 'settings' },
    { id: 'player', label: 'Плеер', icon: 'play' },
    { id: 'appearance', label: 'Внешний вид', icon: 'palette' },
    { id: 'account', label: 'Аккаунт', icon: 'user' },
    { id: 'about', label: 'О программе', icon: 'info' },
  ];

  return (
    <>
      <MetaInfo subTitle="Настройки" />
      
      <div className="settings-page">
        <div className="settings-sidebar">
          <h1 className="settings-title">Настройки</h1>
          <div className="settings-tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <AppIcon name={tab.icon} size={18} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="settings-content">
          {activeTab === 'general' && (
            <div className="settings-section">
              <h2>Общие настройки</h2>
              
              <div className="setting-group">
                <h3>Приложение</h3>
                
                <div className="setting-item">
                  <div className="setting-info">
                    <div className="setting-label">Автоматическое обновление</div>
                    <div className="setting-desc">Проверять и устанавливать обновления автоматически</div>
                  </div>
                  <label className="toggle">
                    <input type="checkbox" checked={app.AutoUpdate} onChange={(e) => setApp({ AutoUpdate: e.target.checked })} />
                    <span className="toggle-slider" />
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <div className="setting-label">Сворачивать в трей</div>
                    <div className="setting-desc">При закрытии окна сворачивать в системный трей</div>
                  </div>
                  <label className="toggle">
                    <input type="checkbox" checked={app.minimizeToTray} onChange={(e) => setApp({ minimizeToTray: e.target.checked })} />
                    <span className="toggle-slider" />
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <div className="setting-label">Аналитика</div>
                    <div className="setting-desc">Отправлять анонимную статистику для улучшения приложения</div>
                  </div>
                  <label className="toggle">
                    <input type="checkbox" checked={app.EnableAnalytics} onChange={(e) => setApp({ EnableAnalytics: e.target.checked })} />
                    <span className="toggle-slider" />
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <div className="setting-label">Discord Rich Presence</div>
                    <div className="setting-desc">Показывать что вы смотрите в Discord</div>
                  </div>
                  <label className="toggle">
                    <input type="checkbox" checked={app.EnableRPC} onChange={(e) => setApp({ EnableRPC: e.target.checked })} />
                    <span className="toggle-slider" />
                  </label>
                </div>
              </div>

              <div className="setting-group">
                <h3>Сеть</h3>
                <div className="setting-item">
                  <div className="setting-info">
                    <div className="setting-label">API Эндпоинт</div>
                    <div className="setting-desc">Сервер для подключения к Anixart</div>
                  </div>
                  <select value={endpointUrl} onChange={(e) => setEndpoint(e.target.value)} className="setting-select">
                    {Utils.endpointValues.map(ep => (
                      <option key={ep.value} value={ep.value}>{ep.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'player' && (
            <div className="settings-section">
              <h2>Плеер</h2>
              
              <div className="setting-group">
                <h3>Воспроизведение</h3>
                
                <div className="setting-item">
                  <div className="setting-info">
                    <div className="setting-label">Автовоспроизведение</div>
                    <div className="setting-desc">Автоматически начинать следующий эпизод</div>
                  </div>
                  <label className="toggle">
                    <input type="checkbox" checked={player.autoplayNext} onChange={(e) => setPlayer({ autoplayNext: e.target.checked })} />
                    <span className="toggle-slider" />
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <div className="setting-label">Пропуск опенинга</div>
                    <div className="setting-desc">Автоматически пропускать опенинг</div>
                  </div>
                  <label className="toggle">
                    <input type="checkbox" checked={player.skipOpening} onChange={(e) => setPlayer({ skipOpening: e.target.checked })} />
                    <span className="toggle-slider" />
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <div className="setting-label">Качество по умолчанию</div>
                  </div>
                  <select value={player.defaultQuality} onChange={(e) => setPlayer({ defaultQuality: Number(e.target.value) as any })} className="setting-select">
                    <option value={1080}>1080p</option>
                    <option value={720}>720p</option>
                    <option value={480}>480p</option>
                    <option value={360}>360p</option>
                  </select>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <div className="setting-label">Громкость по умолчанию</div>
                  </div>
                  <div className="setting-range-wrapper">
                    <input type="range" min={0} max={100} value={player.defaultVolume} onChange={(e) => setPlayer({ defaultVolume: Number(e.target.value) })} className="setting-range" />
                    <span className="range-value">{player.defaultVolume}%</span>
                  </div>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <div className="setting-label">Соотношение сторон</div>
                  </div>
                  <select value={player.defaultAspectRatio} onChange={(e) => setPlayer({ defaultAspectRatio: e.target.value as any })} className="setting-select">
                    <option value="16-9">16:9</option>
                    <option value="4-3">4:3</option>
                    <option value="fit">Fit</option>
                  </select>
                </div>
              </div>

              <div className="setting-group">
                <h3>Anime4K (Улучшение качества)</h3>
                <div className="setting-item">
                  <div className="setting-info">
                    <div className="setting-label">Требуется WebGPU</div>
                    <div className="setting-desc">Улучшает качество видео с помощью нейросети. Работает только на поддерживаемых GPU.</div>
                  </div>
                </div>
                <div className="setting-item">
                  <div className="setting-info">
                    <div className="setting-label">Режим Anime4K</div>
                  </div>
                  <select className="setting-select" defaultValue={15}>
                    {Utils.upscaleValues.slice(0, 6).map(v => (
                      <option key={v.value} value={v.value}>{v.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="setting-group">
                <h3>Горячие клавиши</h3>
                <div className="hotkeys-list">
                  {Object.entries(player.hotkeys).map(([action, keys]) => (
                    <div key={action} className="hotkey-item">
                      <span className="hotkey-action">{action.replace('hotkey', '')}</span>
                      <kbd className="hotkey-key">{(keys as string[]).join(' + ')}</kbd>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="settings-section">
              <h2>Внешний вид</h2>
              
              <div className="setting-group">
                <h3>Тема</h3>
                <div className="theme-selector">
                  {[
                    { id: 'dark', label: 'Тёмная', icon: 'moon' as IconName },
                    { id: 'light', label: 'Светлая', icon: 'sun' as IconName },
                    { id: 'system', label: 'Системная', icon: 'monitor' as IconName },
                    { id: 'amoled', label: 'AMOLED', icon: 'palette' as IconName },
                  ].map(theme => (
                    <button
                      key={theme.id}
                      className={`theme-option ${gui.theme === theme.id ? 'active' : ''}`}
                      onClick={() => setGui({ theme: theme.id as any })}
                    >
                      <AppIcon name={theme.icon} size={24} />
                      <span>{theme.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="setting-group">
                <h3>Карточки релизов</h3>
                <div className="setting-item">
                  <div className="setting-info">
                    <div className="setting-label">Тип отображения</div>
                  </div>
                  <select value={gui.releaseCardType} onChange={(e) => setGui({ releaseCardType: e.target.value as any })} className="setting-select">
                    <option value="full-row">Список</option>
                    <option value="grid">Сетка</option>
                    <option value="compact">Компактный</option>
                  </select>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <div className="setting-label">Размер постеров</div>
                  </div>
                  <select value={gui.posterSize} onChange={(e) => setGui({ posterSize: e.target.value as any })} className="setting-select">
                    <option value="small">Маленький</option>
                    <option value="medium">Средний</option>
                    <option value="large">Большой</option>
                  </select>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <div className="setting-label">Анимации</div>
                    <div className="setting-desc">Включить анимации интерфейса</div>
                  </div>
                  <label className="toggle">
                    <input type="checkbox" checked={gui.enableAnimations} onChange={(e) => setGui({ enableAnimations: e.target.checked })} />
                    <span className="toggle-slider" />
                  </label>
                </div>
              </div>

              <div className="setting-group">
                <h3>Меню</h3>
                <div className="setting-item">
                  <div className="setting-info">
                    <div className="setting-label">Закрепить боковое меню</div>
                    <div className="setting-desc">Меню всегда будет развёрнуто</div>
                  </div>
                  <label className="toggle">
                    <input type="checkbox" checked={gui.leftMenuExpanded} onChange={(e) => setGui({ leftMenuExpanded: e.target.checked })} />
                    <span className="toggle-slider" />
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'account' && (
            <div className="settings-section">
              <h2>Аккаунт</h2>
              <div className="empty-state">
                <AppIcon name="user" size={48} />
                <h3>Управление аккаунтом</h3>
                <p>Здесь будут настройки профиля, приватности и безопасности</p>
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="settings-section">
              <h2>О программе</h2>
              
              <div className="about-card">
                <img src="./assets/icons/anidesk-icon.png" alt="AniDesk" width={80} height={80} />
                <h3>AniDesk</h3>
                <p className="about-version">Версия {versions?.anidesk || '0.0.1-beta.2'}</p>
                <p className="about-desc">Неофициальный десктоп клиент Anixart с открытым исходным кодом</p>
                
                <div className="about-links">
                  <button className="base-main-button default" onClick={() => (window as any).winApi?.openLink('https://github.com/owlclockl/Anixart-PC-owl')}>
                    <AppIcon name="external" size={16} />
                    GitHub
                  </button>
                  <button className="base-main-button default" onClick={() => (window as any).winApi?.openLink('https://anidesk.ds1nc.ru/')}>
                    <AppIcon name="external" size={16} />
                    Сайт
                  </button>
                </div>
              </div>

              <div className="setting-group">
                <h3>Техническая информация</h3>
                <div className="info-card">
                  <div className="info-row"><span>Electron</span><span>{versions?.electron || '—'}</span></div>
                  <div className="info-row"><span>Chrome</span><span>{versions?.chrome || '—'}</span></div>
                  <div className="info-row"><span>Node</span><span>{versions?.node || '—'}</span></div>
                  <div className="info-row"><span>Платформа</span><span>{navigator.platform}</span></div>
                </div>
              </div>

              <div className="setting-group">
                <h3>Действия</h3>
                <div className="about-actions">
                  <button className="base-main-button default">
                    <AppIcon name="trash" size={16} />
                    Очистить кеш
                  </button>
                  <button className="base-main-button default">
                    <AppIcon name="download" size={16} />
                    Экспорт настроек
                  </button>
                  <button className="base-main-button default">
                    <AppIcon name="upload" size={16} />
                    Импорт настроек
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SettingsPage;
