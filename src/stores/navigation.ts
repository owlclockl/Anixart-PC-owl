import { create } from 'zustand';

export type RouteName = 
  | 'home'
  | 'bookmarks'
  | 'friends'
  | 'collections'
  | 'discover'
  | 'search'
  | 'notifications'
  | 'settings'
  | 'anime'
  | 'player'
  | 'profile'
  | 'auth';

export interface RouteState {
  name: RouteName;
  args?: any;
  title?: string;
}

interface NavigationStore {
  current: RouteState;
  history: RouteState[];
  navigate: (name: RouteName, args?: any, title?: string) => void;
  back: () => void;
  canGoBack: () => boolean;
  replace: (name: RouteName, args?: any, title?: string) => void;
}

export const useNavigationStore = create<NavigationStore>((set, get) => ({
  current: { name: 'home', args: null, title: 'Главная' },
  history: [],

  navigate: (name, args, title) => {
    const { current, history } = get();
    // Don't push duplicate
    if (current.name === name && JSON.stringify(current.args) === JSON.stringify(args)) {
      return;
    }
    set({
      current: { name, args: args ?? null, title },
      history: [current, ...history].slice(0, 50),
    });

    // Legacy compatibility for old code using window.pageHistory
    if (typeof window !== 'undefined') {
      // @ts-ignore
      window.pageHistory = [current, ...history].slice(0, 50).map(h => ({ page: h.name, args: h.args }));
    }

    // Analytics
    try {
      // @ts-ignore
      window.analytics?.trackEvent('navigate', { page: name });
    } catch {}
  },

  back: () => {
    const { history } = get();
    if (history.length === 0) return;
    const [prev, ...rest] = history;
    set({
      current: prev,
      history: rest,
    });
  },

  canGoBack: () => get().history.length > 0,

  replace: (name, args, title) => {
    set({
      current: { name, args: args ?? null, title },
    });
  },
}));

// Legacy bridge for old window.updateViewportComponent
export function setupLegacyBridge() {
  if (typeof window === 'undefined') return;

  const indexToRoute: Record<number, RouteName> = {
    0: 'home',
    1: 'bookmarks',
    2: 'friends',
    3: 'collections',
    4: 'discover',
    5: 'search',
    6: 'notifications',
    7: 'settings',
    8: 'anime',
    9: 'profile',
    10: 'auth',
    11: 'player',
  };

  // @ts-ignore
  window.updateViewportComponent = (page: any, args?: any, isHistory = false) => {
    const store = useNavigationStore.getState();
    
    if (isHistory) {
      store.back();
      return;
    }

    if (typeof page === 'number') {
      const routeName = indexToRoute[page] || 'home';
      store.navigate(routeName, args);
    } else if (typeof page === 'string') {
      store.navigate(page as RouteName, args);
    } else {
      // If it's a component, try to infer
      store.navigate('home', args);
    }

    // Clear scroll event for old logic
    try {
      // @ts-ignore
      window.setViewportScrollEvent?.(null);
    } catch {}
  };

  // @ts-ignore
  window.pageHistory = [];
}
