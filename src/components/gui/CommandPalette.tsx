import React, { useEffect, useState, useMemo } from 'react';
import { useNavigationStore, RouteName } from '../../stores/navigation';
import { useSettingsStore } from '../../stores/settings';
import { AppIcon, IconName } from '../ui/AppIcon';

interface Command {
  id: string;
  label: string;
  icon: IconName;
  action: () => void;
  keywords?: string[];
  group: string;
}

const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { navigate } = useNavigationStore();
  const { gui, setGui } = useSettingsStore();

  const commands: Command[] = useMemo(() => [
    { id: 'home', label: 'Перейти на главную', icon: 'home', group: 'Навигация', action: () => navigate('home') },
    { id: 'bookmarks', label: 'Закладки', icon: 'bookmark', group: 'Навигация', action: () => navigate('bookmarks') },
    { id: 'search', label: 'Поиск', icon: 'search', group: 'Навигация', action: () => navigate('search') },
    { id: 'settings', label: 'Настройки', icon: 'settings', group: 'Навигация', action: () => navigate('settings') },
    { id: 'profile', label: 'Профиль', icon: 'user', group: 'Навигация', action: () => navigate('profile', { id: 0 }) },
    { id: 'theme-dark', label: 'Тёмная тема', icon: 'moon', group: 'Внешний вид', keywords: ['тема', 'dark'], action: () => setGui({ theme: 'dark' }) },
    { id: 'theme-light', label: 'Светлая тема', icon: 'sun', group: 'Внешний вид', keywords: ['тема', 'light'], action: () => setGui({ theme: 'light' }) },
    { id: 'theme-system', label: 'Системная тема', icon: 'monitor', group: 'Внешний вид', keywords: ['тема', 'system'], action: () => setGui({ theme: 'system' }) },
    { id: 'view-grid', label: 'Вид: Сетка', icon: 'grid', group: 'Внешний вид', action: () => setGui({ releaseCardType: 'grid' }) },
    { id: 'view-list', label: 'Вид: Список', icon: 'list', group: 'Внешний вид', action: () => setGui({ releaseCardType: 'full-row' }) },
    { id: 'clear-cache', label: 'Очистить кеш', icon: 'trash', group: 'Действия', action: () => { localStorage.clear(); location.reload(); } },
    { id: 'random', label: 'Случайное аниме', icon: 'shuffle', group: 'Действия', keywords: ['рандом'], action: () => navigate('anime', { id: Math.floor(Math.random() * 1000) }) },
  ], [navigate, setGui]);

  const filtered = useMemo(() => {
    if (!query) return commands;
    const q = query.toLowerCase();
    return commands.filter(c => 
      c.label.toLowerCase().includes(q) ||
      c.keywords?.some(k => k.toLowerCase().includes(q)) ||
      c.group.toLowerCase().includes(q)
    );
  }, [query, commands]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen(!isOpen);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, filtered.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        filtered[selectedIndex]?.action();
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex]);

  if (!isOpen) return null;

  const grouped = filtered.reduce((acc, cmd) => {
    if (!acc[cmd.group]) acc[cmd.group] = [];
    acc[cmd.group].push(cmd);
    return acc;
  }, {} as Record<string, Command[]>);

  return (
    <div className="command-palette-overlay" onClick={() => setIsOpen(false)}>
      <div className="command-palette" onClick={e => e.stopPropagation()}>
        <div className="command-palette-search">
          <AppIcon name="search" size={18} />
          <input
            type="text"
            placeholder="Поиск команд, страниц, настроек..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            autoFocus
          />
          <kbd>ESC</kbd>
        </div>

        <div className="command-palette-list">
          {Object.entries(grouped).map(([group, cmds]) => (
            <div key={group} className="command-group">
              <div className="command-group-title">{group}</div>
              {cmds.map(cmd => {
                const globalIndex = filtered.indexOf(cmd);
                return (
                  <button
                    key={cmd.id}
                    className={`command-item ${globalIndex === selectedIndex ? 'selected' : ''}`}
                    onClick={() => { cmd.action(); setIsOpen(false); }}
                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                  >
                    <AppIcon name={cmd.icon} size={18} />
                    <span>{cmd.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="command-empty">
              <AppIcon name="search" size={24} />
              <span>Ничего не найдено для "{query}"</span>
            </div>
          )}
        </div>

        <div className="command-palette-footer">
          <span><kbd>↑↓</kbd> Навигация</span>
          <span><kbd>Enter</kbd> Выбрать</span>
          <span><kbd>Esc</kbd> Закрыть</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
