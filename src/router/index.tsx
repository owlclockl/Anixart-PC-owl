import React from 'react';
import HomePage from '../pages/Home';
import BookmarksPage from '../pages/Bookmarks';
import AnimePage from '../pages/Anime';
import SettingsPage from '../pages/Settings';
import SearchPage from '../pages/Search';
import ProfilePage from '../pages/Profile';
import PlayerPage from '../pages/Player';
import CollectionsPage from '../pages/Collections';
import DiscoverPage from '../pages/Discover';
import FriendsPage from '../pages/Friends';
import NotificationsPage from '../pages/Notifications';
import AuthPage from '../pages/Auth';
import { RouteName } from '../stores/navigation';

export interface RouteConfig {
  component: React.ComponentType<any>;
  title: string | ((args: any) => string);
  icon?: string;
  showInMenu?: boolean;
}

export const ROUTES: Record<RouteName, RouteConfig> = {
  home: {
    component: HomePage,
    title: 'Главная',
    showInMenu: true,
  },
  bookmarks: {
    component: BookmarksPage,
    title: 'Закладки',
    showInMenu: true,
  },
  friends: {
    component: FriendsPage,
    title: 'Друзья',
    showInMenu: true,
  },
  collections: {
    component: CollectionsPage,
    title: 'Коллекции',
    showInMenu: true,
  },
  discover: {
    component: DiscoverPage,
    title: 'Интересное',
    showInMenu: true,
  },
  search: {
    component: SearchPage,
    title: 'Поиск',
    showInMenu: true,
  },
  notifications: {
    component: NotificationsPage,
    title: 'Уведомления',
    showInMenu: true,
  },
  settings: {
    component: SettingsPage,
    title: 'Настройки',
    showInMenu: true,
  },
  anime: {
    component: AnimePage,
    title: (args) => args?.title || 'Аниме',
    showInMenu: false,
  },
  player: {
    component: PlayerPage,
    title: (args) => args?.title ? `Плеер - ${args.title}` : 'Плеер',
    showInMenu: false,
  },
  profile: {
    component: ProfilePage,
    title: (args) => args?.login || 'Профиль',
    showInMenu: false,
  },
  auth: {
    component: AuthPage,
    title: 'Авторизация',
    showInMenu: false,
  },
};

export function getRouteTitle(name: RouteName, args?: any): string {
  const route = ROUTES[name];
  if (!route) return 'AniDesk';
  if (typeof route.title === 'function') {
    return route.title(args);
  }
  return route.title;
}

export function getRouteComponent(name: RouteName): React.ComponentType<any> {
  return ROUTES[name]?.component || HomePage;
}
