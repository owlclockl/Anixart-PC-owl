import { create } from 'zustand';

export interface PlayerEpisode {
  id: number;
  name: string;
  position: number;
  sources: any[];
}

interface PlayerStore {
  currentAnimeId: number | null;
  currentEpisode: number;
  episodes: PlayerEpisode[];
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  quality: number;
  sourceIndex: number | null;
  isFullscreen: boolean;
  isTheater: boolean;
  isPiP: boolean;
  currentTime: number;
  duration: number;
  showControls: boolean;
  anime4kEnabled: boolean;
  anime4kMode: number;

  setCurrentAnime: (id: number, episodes: PlayerEpisode[]) => void;
  setEpisode: (index: number) => void;
  setPlaying: (playing: boolean) => void;
  setVolume: (vol: number) => void;
  setMuted: (muted: boolean) => void;
  setQuality: (q: number) => void;
  setSource: (idx: number | null) => void;
  setFullscreen: (fs: boolean) => void;
  setTheater: (theater: boolean) => void;
  setPiP: (pip: boolean) => void;
  setTime: (time: number, duration?: number) => void;
  setShowControls: (show: boolean) => void;
  toggleAnime4k: () => void;
  setAnime4kMode: (mode: number) => void;
  nextEpisode: () => void;
  prevEpisode: () => void;
  reset: () => void;
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  currentAnimeId: null,
  currentEpisode: 0,
  episodes: [],
  isPlaying: false,
  volume: 0.5,
  isMuted: false,
  quality: 1080,
  sourceIndex: null,
  isFullscreen: false,
  isTheater: false,
  isPiP: false,
  currentTime: 0,
  duration: 0,
  showControls: true,
  anime4kEnabled: false,
  anime4kMode: 15,

  setCurrentAnime: (id, episodes) => set({ currentAnimeId: id, episodes, currentEpisode: 0 }),
  setEpisode: (index) => set({ currentEpisode: index, currentTime: 0 }),
  setPlaying: (isPlaying) => set({ isPlaying }),
  setVolume: (volume) => set({ volume }),
  setMuted: (isMuted) => set({ isMuted }),
  setQuality: (quality) => set({ quality }),
  setSource: (sourceIndex) => set({ sourceIndex }),
  setFullscreen: (isFullscreen) => set({ isFullscreen }),
  setTheater: (isTheater) => set({ isTheater }),
  setPiP: (isPiP) => set({ isPiP }),
  setTime: (currentTime, duration) => set((s) => ({ currentTime, duration: duration ?? s.duration })),
  setShowControls: (showControls) => set({ showControls }),
  toggleAnime4k: () => set((s) => ({ anime4kEnabled: !s.anime4kEnabled })),
  setAnime4kMode: (anime4kMode) => set({ anime4kMode }),
  nextEpisode: () => {
    const { currentEpisode, episodes } = get();
    if (currentEpisode < episodes.length - 1) {
      set({ currentEpisode: currentEpisode + 1, currentTime: 0 });
    }
  },
  prevEpisode: () => {
    const { currentEpisode } = get();
    if (currentEpisode > 0) {
      set({ currentEpisode: currentEpisode - 1, currentTime: 0 });
    }
  },
  reset: () => set({
    currentAnimeId: null,
    currentEpisode: 0,
    episodes: [],
    isPlaying: false,
    currentTime: 0,
    duration: 0,
  }),
}));
