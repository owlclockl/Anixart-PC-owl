import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'dark' | 'light' | 'system' | 'amoled';
export type ReleaseCardType = 'full-row' | 'grid' | 'compact';
export type PosterSize = 'small' | 'medium' | 'large';

interface GuiSettings {
  theme: Theme;
  releaseCardType: ReleaseCardType;
  posterSize: PosterSize;
  showAdult: boolean;
  enableAnimations: boolean;
  leftMenuExpanded: boolean;
  leftMenuWidth: number;
  language: 'ru' | 'en';
}

interface PlayerSettings {
  autoplayEpisode: boolean;
  defaultAspectRatio: '16-9' | '4-3' | 'fit';
  defaultQuality: 1080 | 720 | 480 | 360;
  defaultSource: number | null;
  defaultVolume: number;
  saveUserVolume: { enabled: boolean; lastValue: number | null };
  opacityInterface: number;
  timeHideInterface: number;
  skipOpening: boolean;
  skipEnding: boolean;
  autoplayNext: boolean;
  hotkeys: Record<string, string[]>;
}

interface AppSettings {
  AutoUpdate: boolean;
  EnableAnalytics: boolean;
  EnableRPC: boolean;
  EnableDevTools: boolean;
  minimizeToTray: boolean;
  closeToTray: boolean;
  enableHardwareAcceleration: boolean;
  discordShowTitle: boolean;
  discordShowEpisode: boolean;
  discordPrivateMode: boolean;
}

interface SettingsStore {
  gui: GuiSettings;
  player: PlayerSettings;
  app: AppSettings;
  endpointUrl: string;
  
  setGui: (patch: Partial<GuiSettings>) => void;
  setPlayer: (patch: Partial<PlayerSettings>) => void;
  setApp: (patch: Partial<AppSettings>) => void;
  setEndpoint: (url: string) => void;
  resetGui: () => void;
  resetPlayer: () => void;
}

const defaultGui: GuiSettings = {
  theme: 'dark',
  releaseCardType: 'full-row',
  posterSize: 'medium',
  showAdult: false,
  enableAnimations: true,
  leftMenuExpanded: false,
  leftMenuWidth: 75,
  language: 'ru',
};

const defaultPlayer: PlayerSettings = {
  autoplayEpisode: true,
  defaultAspectRatio: '16-9',
  defaultQuality: 1080,
  defaultSource: null,
  defaultVolume: 50,
  saveUserVolume: { enabled: true, lastValue: null },
  opacityInterface: 50,
  timeHideInterface: 5000,
  skipOpening: false,
  skipEnding: false,
  autoplayNext: true,
  hotkeys: {
    hotkeyPlayPause: ['Space'],
    hotkeyNextEpisode: ['KeyN'],
    hotkeyPrevEpisode: ['KeyB'],
    hotkeySkipOpening: ['KeyS'],
    hotkeyForward: ['ArrowRight'],
    hotkeyBackward: ['ArrowLeft'],
    hotkeyMute: ['KeyM'],
    hotkeyFullscreen: ['KeyF'],
  },
};

const defaultApp: AppSettings = {
  AutoUpdate: true,
  EnableAnalytics: true,
  EnableRPC: false,
  EnableDevTools: false,
  minimizeToTray: false,
  closeToTray: false,
  enableHardwareAcceleration: true,
  discordShowTitle: true,
  discordShowEpisode: true,
  discordPrivateMode: false,
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      gui: defaultGui,
      player: defaultPlayer,
      app: defaultApp,
      endpointUrl: 'api-s.anixsekai.com',

      setGui: (patch) => set((s) => ({ gui: { ...s.gui, ...patch } })),
      setPlayer: (patch) => set((s) => ({ player: { ...s.player, ...patch } })),
      setApp: (patch) => set((s) => ({ app: { ...s.app, ...patch } })),
      setEndpoint: (url) => set({ endpointUrl: url }),
      resetGui: () => set({ gui: defaultGui }),
      resetPlayer: () => set({ player: defaultPlayer }),
    }),
    {
      name: 'anidesk-settings-v2',
      partialize: (state) => ({
        gui: state.gui,
        player: state.player,
        app: state.app,
        endpointUrl: state.endpointUrl,
      }),
    }
  )
);
