import React from 'react';
import { 
  Home, 
  Bookmark, 
  Users, 
  Library, 
  Compass, 
  Search, 
  Bell, 
  Settings,
  Film,
  Play,
  User,
  LogIn,
  Grid3X3,
  List,
  Sparkles,
  Calendar,
  Heart,
  Clock,
  Star,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Monitor,
  Keyboard,
  Info,
  ExternalLink,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Menu,
  MoreHorizontal,
  Zap,
  Shield,
  Palette,
  Volume2,
  Maximize,
  Minimize,
  PictureInPicture,
  SkipForward,
  SkipBack,
  Repeat,
  Shuffle,
  type LucideIcon
} from 'lucide-react';

export type IconName = 
  | 'home'
  | 'bookmark'
  | 'friends'
  | 'collections'
  | 'discover'
  | 'search'
  | 'notifications'
  | 'settings'
  | 'film'
  | 'play'
  | 'user'
  | 'login'
  | 'grid'
  | 'list'
  | 'sparkles'
  | 'calendar'
  | 'heart'
  | 'clock'
  | 'star'
  | 'eye'
  | 'eye-off'
  | 'sun'
  | 'moon'
  | 'monitor'
  | 'keyboard'
  | 'info'
  | 'external'
  | 'trash'
  | 'download'
  | 'upload'
  | 'refresh'
  | 'x'
  | 'check'
  | 'chevron-left'
  | 'chevron-right'
  | 'chevrons-up-down'
  | 'menu'
  | 'more'
  | 'zap'
  | 'shield'
  | 'palette'
  | 'volume'
  | 'maximize'
  | 'minimize'
  | 'pip'
  | 'skip-forward'
  | 'skip-back'
  | 'repeat'
  | 'shuffle';

const iconMap: Record<IconName, LucideIcon> = {
  home: Home,
  bookmark: Bookmark,
  friends: Users,
  collections: Library,
  discover: Compass,
  search: Search,
  notifications: Bell,
  settings: Settings,
  film: Film,
  play: Play,
  user: User,
  login: LogIn,
  grid: Grid3X3,
  list: List,
  sparkles: Sparkles,
  calendar: Calendar,
  heart: Heart,
  clock: Clock,
  star: Star,
  eye: Eye,
  'eye-off': EyeOff,
  sun: Sun,
  moon: Moon,
  monitor: Monitor,
  keyboard: Keyboard,
  info: Info,
  external: ExternalLink,
  trash: Trash2,
  download: Download,
  upload: Upload,
  refresh: RefreshCw,
  x: X,
  check: Check,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  'chevrons-up-down': ChevronsUpDown,
  menu: Menu,
  more: MoreHorizontal,
  zap: Zap,
  shield: Shield,
  palette: Palette,
  volume: Volume2,
  maximize: Maximize,
  minimize: Minimize,
  pip: PictureInPicture,
  'skip-forward': SkipForward,
  'skip-back': SkipBack,
  repeat: Repeat,
  shuffle: Shuffle,
};

interface AppIconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const AppIcon: React.FC<AppIconProps> = ({ 
  name, 
  size = 20, 
  color,
  strokeWidth = 2,
  className,
  style
}) => {
  const IconComponent = iconMap[name];
  if (!IconComponent) return null;

  return (
    <IconComponent 
      size={size} 
      color={color} 
      strokeWidth={strokeWidth}
      className={className}
      style={style}
    />
  );
};

// Fallback for legacy SVG string icons
export const LegacyIcon: React.FC<{ 
  svg: string; 
  size?: number; 
  colorVar?: string;
  className?: string;
}> = ({ svg, size = 20, colorVar = '--main-text-color', className }) => {
  const extractViewBox = (s: string) => {
    const regex = /viewBox="([\d\- \.]+)"/;
    const res = regex.exec(s);
    return res ? res[1] : "0 0 24 24";
  };

  const elements = svg.replace(/<svg[^>]*>/, "").replace("</svg>", "");
  const viewBox = extractViewBox(svg);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox={viewBox}
      className={className}
      style={{ color: `var(${colorVar})` }}
      dangerouslySetInnerHTML={{ __html: elements }}
    />
  );
};
