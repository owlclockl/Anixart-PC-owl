import React, { useState, useEffect, useMemo } from 'react';
import TitleBar from './components/gui/TitleBar';
import LeftMenu from './components/gui/LeftMenu';
import { Anixart } from 'anixartjs';
import MetaInfo from './components/gui/MetaInfo';
import Utils from './utils';
import BaseModal from './components/modal/BaseModal';
import FirstRunModal from './components/modal/FirstRunModal';
import { useLocalStorage, useSystemTheme } from './hooks/useLocalStorage';
import { useNavigationStore, setupLegacyBridge } from './stores/navigation';
import { useSettingsStore } from './stores/settings';
import { useAuthStore } from './stores/auth';
import { getRouteComponent, getRouteTitle } from './router';
import CommandPalette from './components/gui/CommandPalette';

// Глобальные переменные для совместимости со старым кодом
declare global {
  interface Window {
    utils: typeof Utils;
    waitForElm: (selector: string) => Promise<Element>;
    baseSettings: any;
    versions: any;
    anixApi: any;
    profileInfo: any;
    profileSettings: any;
    pageHistory: any[];
    upscaleEnable: boolean;
    avaliableGPU: boolean;
    setViewportScrollEvent: (callback: ((e: Event) => void) | null) => void;
    updateViewportComponent: (page: any, args?: any, history?: boolean) => void;
    discordRPC: any;
    titleBarAPI: any;
    analytics: any;
    winApi: any;
    Sibnet: any;
    elecWindow: any;
    settings: any;
    prc: any;
    electronAPI?: any;
  }
}

window.utils = Utils;

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, info: any) {
    console.error('ErrorBoundary:', error, info);
    try {
      (window as any).analytics?.trackEvent('app_error', { error: error.message });
    } catch {}
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>😿 Что-то пошло не так</h2>
          <p>{this.state.error?.message || 'Неизвестная ошибка'}</p>
          <div className="error-actions">
            <button className="base-main-button primary" onClick={() => location.reload()}>Перезапустить</button>
            <button className="base-main-button default" onClick={() => this.setState({ hasError: false, error: null })}>Попробовать снова</button>
          </div>
          <details className="error-details">
            <summary>Детали</summary>
            <pre>{this.state.error?.stack}</pre>
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}

const App: React.FC = () => {
  const { current } = useNavigationStore();
  const { gui, endpointUrl } = useSettingsStore();
  const { token, tokenId, setProfile } = useAuthStore();
  const systemTheme = useSystemTheme();
  
  const [utokenLegacy] = useLocalStorage('user_token', null);
  const [firstRun, setFirstRun] = useLocalStorage('first_run', true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Theme handling
  const effectiveTheme = useMemo(() => {
    if (gui.theme === 'system') return systemTheme;
    if (gui.theme === 'amoled') return 'dark';
    return gui.theme;
  }, [gui.theme, systemTheme]);

  useEffect(() => {
    document.body.className = `${effectiveTheme}-theme ${gui.theme === 'amoled' ? 'amoled' : ''} ${gui.enableAnimations ? 'animations-enabled' : 'animations-disabled'}`;
    document.documentElement.style.setProperty('--poster-size-multiplier', 
      gui.posterSize === 'small' ? '0.8' : gui.posterSize === 'large' ? '1.2' : '1'
    );
  }, [effectiveTheme, gui.theme, gui.enableAnimations, gui.posterSize]);

  // Legacy bridge setup
  useEffect(() => {
    setupLegacyBridge();
  }, []);

  // API initialization
  useEffect(() => {
    const initApi = async () => {
      try {
        // Prefer new auth store, fallback to legacy localStorage
        let parsedToken: any = null;
        if (token && tokenId) {
          parsedToken = { token, id: tokenId };
        } else if (utokenLegacy) {
          try {
            parsedToken = JSON.parse(utokenLegacy as any);
            // Migrate to new store
            if (parsedToken?.token && parsedToken?.id) {
              useAuthStore.getState().setToken(parsedToken.token, parsedToken.id);
            }
          } catch {}
        }

        // @ts-ignore
        window.baseSettings = await window.settings?.getAll?.().catch(() => null);
        // @ts-ignore
        window.versions = await window.prc?.getVersions?.().catch(() => null);

        const anix = new Anixart({
          token: parsedToken?.token,
          baseUrl: `https://${endpointUrl}`,
        });

        window.anixApi = anix.endpoints;

        if (parsedToken) {
          try {
            const profileData = await window.anixApi.profile.info(parsedToken.id);
            window.profileInfo = profileData.profile;
            setProfile({
              id: profileData.profile.id,
              login: profileData.profile.login,
              avatar: profileData.profile.avatar,
              isVerified: profileData.profile.is_verified,
              isSponsor: profileData.profile.is_sponsor,
            });
          } catch (e) {
            console.warn('Failed to load profile', e);
          }

          window.profileSettings = {
            main: null,
            socials: null,
            login: null,
          };

          try {
            window.anixApi.settings.getCurrentProfileSettings().then((x: any) => window.profileSettings.main = x).catch(() => {});
            window.anixApi.settings.getSocial().then((x: any) => window.profileSettings.socials = x).catch(() => {});
            window.anixApi.settings.getLoginInfo().then((x: any) => window.profileSettings.login = x).catch(() => {});
          } catch {}
        }

        window.upscaleEnable = false;
        window.avaliableGPU = await Utils.checkGPUSupport().then((res: boolean) => window.avaliableGPU = res as any).catch(() => false) as any;

        // Discord RPC
        const discordTitle = getRouteTitle(current.name, current.args);
        window.discordRPC?.setActivity({
          type: 3,
          state: discordTitle,
          largeImageKey: "anidesk-transparent",
          largeImageText: "AniDesk - Anixart Client",
          instance: true,
          buttons: [{ label: "Ссылка на клиент", url: "https://anidesk.ds1nc.ru/" }],
        });
      } catch (e) {
        console.error('Failed to init API', e);
      }
    };

    initApi();

    window.waitForElm = (selector: string) => {
      return new Promise((resolve) => {
        if (document.querySelector(selector)) {
          return resolve(document.querySelector(selector)!);
        }
        const observer = new MutationObserver(() => {
          if (document.querySelector(selector)) {
            observer.disconnect();
            resolve(document.querySelector(selector)!);
          }
        });
        observer.observe(document.body, { childList: true, subtree: true });
      });
    };
  }, [endpointUrl, utokenLegacy, token, tokenId, current.name, current.args, setProfile]);

  // Update Discord RPC on navigation
  useEffect(() => {
    const title = getRouteTitle(current.name, current.args);
    const isPlayer = current.name === 'player';
    
    if (!isPlayer) {
      window.discordRPC?.setActivity({
        type: 3,
        state: title,
        details: current.name === 'anime' ? current.args?.title : undefined,
        largeImageKey: "anidesk-transparent",
        largeImageText: "AniDesk - Anixart Client",
        instance: true,
        buttons: [{ label: "Ссылка на клиент", url: "https://anidesk.ds1nc.ru/" }],
      });
    }
  }, [current]);

  useEffect(() => {
    const handleResize = () => {
      setIsFullscreen(window.innerHeight === screen.height);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ? to show help
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && (e.target as HTMLElement)?.tagName !== 'INPUT') {
        // Could open help modal
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const CurrentComponent = useMemo(() => getRouteComponent(current.name), [current.name]);

  return (
    <ErrorBoundary>
      <main>
        {!isFullscreen && <TitleBar />}
        <div className={`main-content ${isFullscreen ? 'fullscreen' : ''}`}>
          <LeftMenu />
          <MetaInfo subTitle={getRouteTitle(current.name, current.args)} />
          <div
            id="viewport"
            className="unselectable"
            tabIndex={-1}
          >
            <CurrentComponent args={current.args} />
            
            {firstRun && (
              <BaseModal
                modalComponent={FirstRunModal}
                canCloseOnBackground={false}
                showed={firstRun as boolean}
                modalSize={{ width: "700px", height: "500px" }}
                onCloseModal={() => setFirstRun(false)}
              />
            )}
          </div>
        </div>

        <CommandPalette />

        {/* Global hotkey hints */}
        <div className="global-hints">
          <span className="hint"><kbd>Ctrl+K</kbd> Поиск</span>
          <span className="hint"><kbd>Alt+←</kbd> Назад</span>
        </div>
      </main>
    </ErrorBoundary>
  );
};

export default App;
