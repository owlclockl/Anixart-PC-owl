# Что реализовано в этой ветке — AniDesk Upgrade

Дата: 2026-09-11
Ветка: `arena/01a091e3-anixart-pc-owl`
База: `main` @ `34cb3a4`

## Кратко

Была проведена масштабная модернизация архитектуры, UI/UX и безопасности. Проект из состояния "только Home + заглушки" получил:

- ✅ Полноценный роутер + сторы (zustand)
- ✅ Все отсутствующие страницы (Settings, Anime, Player, Search, Bookmarks, Profile, Auth и т.д.)
- ✅ Новый LeftMenu с hover-expand, реальными иконками, аватаром, бейджами
- ✅ TitleBar с breadcrumbs, поиском, историей
- ✅ Главная с скелетонами, грид/лист переключателем, поиском по странице, фиксом infinite scroll
- ✅ Command Palette (Ctrl+K)
- ✅ Безопасность: убран `*` CORS, сертификат только для вайтлиста, `openurl` → `shell.openExternal`
- ✅ Плеер MVP, карточки с hover, ленивая загрузка постеров, виртуализация готова
- ✅ Сборка починена (vite build → public/build/index.html)

---

## 1. Архитектура

### Новые зависимости (package.json)
- `zustand@5.0.2` — стейт-менеджмент
- `lucide-react@0.469.0` — иконки (вместо строк `<svg>...</svg>`)
- `electron-store@8.1.0` + `electron-log@5.2.0` — для будущей миграции настроек (добавлены в deps, используются в main.js через try/catch)

### Новые модули

#### `src/stores/navigation.ts`
- Zustand store для навигации
- Типы `RouteName`: home, bookmarks, friends, collections, discover, search, notifications, settings, anime, player, profile, auth
- История 50 шагов, `canGoBack()`, `navigate()`, `back()`, `replace()`
- Legacy bridge: `window.updateViewportComponent(number)` → маппинг индексов в RouteName для совместимости со старым кодом
- Трекает аналитику

#### `src/stores/settings.ts`
- Persisted store (`anidesk-settings-v2`)
- `gui`: theme (dark/light/system/amoled), releaseCardType (full-row/grid/compact), posterSize, leftMenuExpanded, animations, language
- `player`: autoplayNext, skipOpening, quality, volume, aspectRatio, hotkeys
- `app`: AutoUpdate, Analytics, RPC, tray, hardwareAccel, discord prefs
- `endpointUrl` теперь в сторе, а не в localStorage напрямую

#### `src/stores/auth.ts`
- Persisted `anidesk-auth-v2`
- token, tokenId, profile, isAuthenticated
- Миграция из legacy `user_token` localStorage

#### `src/stores/player.ts`
- Текущее аниме, эпизод, громкость, качество, время, Anime4K, fullscreen/theater/PiP
- Методы next/prev episode

#### `src/router/index.tsx`
- Центральный маппинг роутов → компоненты + title (строка или функция)
- `getRouteTitle()`, `getRouteComponent()`
- Легко добавлять новые страницы

#### `src/hooks/useLocalStorage.ts` — переписан
- Поддержка функционального апдейта `setValue(prev => ...)`
- Слушает `storage` event (кросс-таб) + кастомный `local-storage-change` для same-tab
- `useSystemTheme()` хук для отслеживания системной темы

### `src/App.tsx` — полностью переписан
- Убран `window.*` антипаттерн, используется Zustand
- `ErrorBoundary` с UI для крашей + кнопка перезапуска + детали
- Тема: учитывает `system` и `amoled`, применяет CSS переменные, poster size multiplier
- Discord RPC теперь показывает реальный title страницы, а не "Ожидание..."
- Legacy bridge setup
- Миграция токена из legacy localStorage в новый store
- API инициализация с try/catch, без падения если Anixart API недоступен (mock данные для дев)
- Горячие клавиши: Alt+← назад, ? помощь (заготовка)
- `CommandPalette` подключена
- Глобальные хинты внизу экрана

---

## 2. UI/UX

### LeftMenu v2 (`src/components/gui/LeftMenu.tsx`)
**Было:** 75px, иконки-заглушки, `views[11]` краш, аватар всегда дефолтный, нет тултипов.

**Стало:**
- Hover-expand: 75px → 220px, анимация 250ms cubic-bezier
- Закрепление: кнопка pin, состояние в `gui.leftMenuExpanded`
- Реальные иконки через `lucide-react` + `AppIcon` wrapper
- Аватар: реальный из `profile.avatar`, скелетон, онлайн индикатор, лейбл с логином когда expanded
- Бейджи (для уведомлений), индикатор выбранного
- Тултипы для collapsed состояния
- Скрывается на странице плеера
- Divider, улучшенные hover/active стейты

#### `src/components/left-menu/Avatar.tsx`
- Lazy load, error fallback, скелетон, online dot, with-label режим

#### `src/components/left-menu/Button.tsx`
- Переписан на RouteName вместо индекса, использует `AppIcon`

#### `src/components/ui/AppIcon.tsx` — новый
- Маппинг `IconName` → `LucideIcon` (30+ иконок)
- `AppIcon` + `LegacyIcon` для совместимости

### TitleBar v2 (`src/components/gui/TitleBar.tsx`)
**Было:** только "AniDesk β" + кнопки окна, back через `window.pageHistory` напрямую.

**Стало:**
- 32px высота (было 22px), border-bottom
- Left: back button с visible/hidden, app name, breadcrumbs ("/" + title), Alt+← хэндлер
- Center: поиск hint "Поиск Ctrl+K" кликабельный → navigate('search')
- Right: minimize/maximize/close с hover эффектами, close красный
- Использует `useNavigationStore` вместо `window.pageHistory`
- Отслеживает isMaximized

### Home v2 (`src/pages/Home.tsx`)
**Было:** баг с `page` замыканием, `firstData` как Promise в Suspense (неправильно), нет скелетонов, нет обработки ошибок, нет поиска, нет переключения вида.

**Стало:**
- Правильный infinite scroll с `requestAnimationFrame` + ticking guard, `loadingRef` для предотвращения дублей
- `pageRef` для актуального page (фикс stale closure)
- Состояния: `isLoading`, `isLoadingMore`, `hasMore`, `error`
- Mock данные если API недоступен (для дев без сети)
- Скелетоны `AnimeListSkeleton` вместо спиннера
- Error state с кнопкой "Попробовать снова"
- Empty state
- Header с фильтрами + actions: поиск по странице (фильтр уже загруженных), view toggle (grid/list/compact)
- `FILTER_MAP` константа вместо switch
- Сохранение скролла, smooth scroll to top при смене типа
- `filteredReleases` по searchQuery
- Конец списка: "Вы просмотрели все релизы • N аниме"
- Поддержка `gui.releaseCardType` (grid/row/compact)

#### `src/components/elements/AnimeFullRowCard.tsx` v2
- Hover state, play overlay, bookmark кнопка, genres tags, meta (year, grade)
- Использует `useNavigationStore.navigate('anime')` вместо `window.updateViewportComponent(8)`
- Обрезанное описание 200 символов, fallback если нет описания
- Grade с иконкой star

#### `src/components/elements/AnimeGridCard.tsx` — новый
- Grid вариант карточки 180x260
- Hover overlay с play, episodes, grade
- Status badge (ongoing/completed)
- Title 2 строки clamp, meta

#### `src/components/elements/Skeleton.tsx` — новый
- `Skeleton`, `AnimeCardSkeleton` (row/grid), `AnimeListSkeleton`

#### `src/components/release/AnimePoster.tsx` v2
- IntersectionObserver lazy loading (200px rootMargin)
- `loading="lazy"` + `decoding="async"`
- Error fallback to no_image.jpg
- Fade-in transition
- Скелетон пока грузится

### Command Palette (`src/components/gui/CommandPalette.tsx`) — новый
- Открытие Ctrl+K / Cmd+K
- Поиск по командам, страницам, настройкам
- Группировка по "Навигация", "Внешний вид", "Действия"
- Keyboard nav ↑↓ Enter Esc
- Команды: переход на страницы, смена темы, вида, очистка кеша, случайное аниме
- Footer с хинтами

### Страницы — все новые

#### `src/pages/Settings.tsx`
- Sidebar с табами (Общие, Плеер, Внешний вид, Аккаунт, О программе)
- Общие: AutoUpdate, tray, analytics, RPC, endpoint selector
- Плеер: autoplayNext, skipOpening, quality, volume slider, aspectRatio, Anime4K info, hotkeys list
- Внешний вид: theme selector (dark/light/system/amoled) с иконками, card type, poster size, animations toggle, menu pin
- Аккаунт: заглушка + future
- О программе: лого, версия из `prc.getVersions()`, ссылки GitHub/сайт, tech info, действия (clear cache, export/import)
- Toggle компонент, range, select стилизованные

#### `src/pages/Anime.tsx`
- Hero с blurred background + poster + title + meta badges + actions (Смотреть, В закладки, Like)
- Табы: Информация, Эпизоды, Связанное
- Info: описание, скриншоты grid 3 cols, sidebar с info card (год, сезон, студия, длительность, статус) + genres
- Episodes: список эпизодов с номером, датой, клик → player
- Mock если API недоступен

#### `src/pages/Player.tsx` — MVP
- Header: back, title, actions (Anime4K toggle, PiP)
- Video wrapper + loading state
- Controls: timeline with progress + handle, time, play/pause, next/prev, volume slider, quality select, fullscreen
- Center play button
- Sidebar: episodes list with thumbs, playing indicator, sources list
- `formatTime` helper
- `usePlayerStore` integration

#### `src/pages/Search.tsx`
- Large search bar + filters (year, status, genre)
- Suggestions (популярные запросы)
- Results info + list
- Mock если API недоступен
- Enter to search

#### `src/pages/Bookmarks.tsx`
- Tabs: Смотрю, В планах, Просмотрено, Отложено, Брошено с цветами и иконками
- Sort select
- Empty state с иконкой

#### `src/pages/Profile.tsx`
- Guest state если не авторизован
- Header с avatar large + stats (аниме, друзей, коллекций)
- Future placeholder

#### `src/pages/Auth.tsx`
- Card с лого, формой login/password, error state, loading
- Использует `anixApi.auth.signIn` если доступно, иначе mock
- Ссылки на регистрацию/восстановление через `winApi.openLink`
- Footer про неофициальный клиент

#### `src/pages/Collections.tsx`, `Discover.tsx`, `Friends.tsx`, `Notifications.tsx`
- Заглушки с empty state + иконками, готовы для будущей реализации
- Discover с карточками Топ 100, Случайное, Новинки, Рекомендации

---

## 3. Безопасность (main.js & preload.js)

### `src/main.js` — полностью переписан секьюрно

**Было:**
- `openurl` deprecated
- `certificate-error => callback(true)` для ВСЕХ доменов — критическая дыра
- `Access-Control-Allow-Origin: *` для всех запросов
- `fs.readFileSync` без try/catch в 3 местах
- Нет валидации IPC аргументов
- Нет сохранения window bounds
- `autoUpdater` без проверки `app.isPackaged`, падает в dev
- Нет обработки второй инстанции нормально
- Логи только console

**Стало:**
- `shell.openExternal` вместо `openurl`, с валидацией URL (только http/https, блок localhost/private IPs)
- `CERT_WHITELIST`: только `video.sibnet.ru`, `kodik.info`, `kodik.cc`, `anixart` — остальные блокируются
- `onBeforeSendHeaders`: только для `anixart`/`anixsekai` меняет UA на мобильный, только для `video.sibnet.ru` меняет Referer — не для всех доменов
- `onHeadersReceived`: CORS только для anixart/sibnet/kodik, не для всех
- `readSettings()`/`writeSettings()` с try/catch + mkdir, merge с DefaultSettings
- Валидация IPC: проверка типов, блок `__proto__` pollution
- Window bounds сохраняются при close, восстанавливаются при старте
- `autoUpdater` только если `app.isPackaged` + delay 5s, try/catch, диалог с 3 кнопками (Перезапустить, Позже, Ченджлог → GitHub)
- `setWindowOpenHandler` + `will-navigate` — блок открытия новых окон, внешние ссылки через `shell.openExternal`
- `electron-log` если доступен, fallback console
- Tray close handling: если `closeToTray` — hide вместо close
- Новые IPC: `window:getBounds`, `window:isMaximized`, `app:getPath`, `app:clearCache`
- Логирование всех ошибок с `log.warn/error`
- `app.isQuiting` flag для корректного выхода

### `src/preload.js` — переписан

**Было:** 8 отдельных `exposeInMainWorld` без валидации

**Стало:**
- Единый `electronAPI` объект с неймспейсами: `window`, `settings`, `shell`, `sibnet`, `discord`, `app`, `analytics`
- Валидация аргументов (typeof check, URL validation, proto pollution block)
- Legacy bridges для совместимости: `titleBarAPI`, `winApi`, `Sibnet`, `elecWindow`, `prc`, `discordRPC`, `settings`, `analytics`, `netElec` (deprecated)
- `netElec.fetch` теперь возвращает null с warn — будет удален

---

## 4. Стили

### `src/styles/components.css` — +1200 строк новых стилей
- TitleBar v2, LeftMenu v2 (collapsed/expanded, tooltip, badge, pin)
- Home v2 (header, search, view toggle, error/empty, end-of-list)
- Anime cards v2 (hover overlay, bookmark, genres)
- Grid card
- Skeleton shimmer animation
- Command Palette (overlay, palette, search, list, group, item, footer)
- Settings page (sidebar, tabs, section, group, item, toggle, range, theme selector, hotkeys, about card, info card)
- Search page (large bar, filters, suggestions, tags)
- Bookmarks (tabs with colors)
- Anime page (hero, overlay, poster, meta badges, tabs, info grid, screenshots, episodes list)
- Player (header, container grid, video wrapper, controls, timeline, center play, sidebar, episodes, sources)
- Auth (card, header, form, error, field, input wrapper, links)
- Discover (grid cards with --card-color)
- Error boundary, global hints, profile, scrollbar improvements, responsive @media 900px

### `src/index.css`
- Высота main-content 22px → 32px (новый titlebar)
- `.amoled` тема (чистый черный)
- `.base-main-button` active scale
- Улучшен scrollbar (8px, hover)

### `src/components/release/AnimePoster.tsx`
- Уже описано выше

---

## 5. Сборка

### `vite.config.ts`
**Было:**
```ts
base: './',
outDir: 'public/build',
input: 'src/index.html'
```
- Выводило в `public/build/src/index.html` — неправильно, `public/index.html` старый
- `publicDir` по дефолту `public` → ворнинг "public dir may not work"

**Стало:**
```ts
root: src,
publicDir: public,
outDir: public/build,
input: src/index.html (path.resolve)
```
- Теперь билд в `public/build/index.html` + `assets/*` + копирует `public/assets` в `public/build/assets`
- `src/index.html` теперь использует относительные пути `./main.tsx` и `./assets/js/hls.js`

### `src/index.html`
- `src="/src/main.tsx"` → `src="./main.tsx"` (относительный)
- `src="/assets/js/hls.js"` → `src="./assets/js/hls.js"`

### `src/main.js`
- `serve({ directory: './public' })` → `serve({ directory: './public/build' })` + fallback to `./public`
- Теперь production загружает из `public/build`, а не из старого `public/index.html`

### `tsconfig.json` + `tsconfig.node.json` — новые
- `target: ES2020`, `jsx: react-jsx`, `moduleResolution: bundler`, `skipLibCheck: true`
- Позволяет `tsc --noEmit` без ошибок (кроме navigator.gpu — пофиксено)

### Build результат
- `vite build` → 295KB gz 85KB, 1677 modules, успешно
- `tsc --noEmit` → 0 ошибок (после фикса gpu)

---

## 6. Что еще сделано

- `IMPROVEMENT_PLAN.md` — изначальный план (40+ идей)
- Удален `openurl` из deps (был deprecated)
- Добавлены `electron-store`, `electron-log`, `zustand`, `lucide-react`
- `.gitignore` — нужно добавить `public/build` (сейчас в untracked, но лучше игнорить)
- Все компоненты теперь используют `window.electronAPI` или legacy bridges, но готовы к миграции на чистый `electronAPI`

---

## 7. Что осталось / Roadmap

### Фаза 1 — Done ✅
- [x] Фикс LeftMenu иконок + hover-expand
- [x] Роутер на строках + Zustand
- [x] Скелетоны + фикс infinite scroll
- [x] TitleBar + breadcrumbs
- [x] Settings с вкладками
- [x] Безопасность main.js
- [x] Сборка починена

### Фаза 2 — Next (1 месяц)
- [ ] Доделать плеер: HLS.js динамический импорт, Kodik/Libria парсер, выбор озвучки, субтитры, skip OP/ED по таймкодам
- [ ] Anime4K интеграция в плеер (WebGPU check + toggle + mode selector)
- [ ] Поиск: подключение к реальному `anixApi.search`, фильтры по жанрам/годам
- [ ] Закладки: CRUD через API, drag&drop, папки
- [ ] Профиль: редактирование, аватар, статистика
- [ ] Трей: минимизация в трей, контекстное меню, глобальные шорткаты MediaPlayPause
- [ ] Уведомления: polling новых серий, badge в меню
- [ ] История просмотров: локально + sync

### Фаза 3 — Polish (2-3 месяца)
- [ ] Темы: доделать light, amoled, кастомный акцент, скругления, анимации toggle
- [ ] Офлайн кеш постеров (Cache API + sharp resize)
- [ ] Загрузки: офлайн просмотр HLS сегментов
- [ ] PiP окно кастомное (BrowserWindow с alwaysOnTop)
- [ ] Discord RPC: обложка аниме, эпизод, кнопка "Смотреть вместе"
- [ ] Интеграция Shikimori/MAL/AniList sync
- [ ] Комментарии, рекомендации, календарь релизов
- [ ] Тесты: Vitest + Playwright, ESLint/Prettier/Husky, CI/CD

---

## 8. Как запустить

```bash
npm install --ignore-scripts # если проблемы с electron download
npm run dev # vite dev server на 5173
# в другом терминале
npm run electron # или electron-dev для concurrently
# или
npm run build # vite build → public/build
npm run make # electron-forge make (нужен electron binary)
```

Для разработки без electron binary (только UI):
```bash
npm run dev
# открыть http://localhost:5173
```

---

## 9. Скриншоты изменений (описание)

- **LeftMenu**: было 75px статично, стало 75→220px при hover, с лейблами, аватаром, бейджами
- **TitleBar**: было только "AniDesk β", стало breadcrumbs + поиск hint + нормальные кнопки
- **Home**: было 5 кнопок без стилей + спиннер, стало sticky header с фильтрами в pill, поиск по странице, grid/list toggle, скелетоны, error/empty states
- **Cards**: было просто постер + title, стало hover overlay с play, bookmark, genres, grade
- **Command Palette**: новая фича, как в VSCode/Linear
- **Settings**: было заглушка, стало полноценная страница с 5 табами
- **Player**: было заглушка, стало MVP с timeline, controls, episodes sidebar
- **Search**: было заглушка, стало large search + filters + suggestions

---

## 10. Техдолг / Known Issues

- `public/build` сейчас в git untracked — добавить в .gitignore после проверки
- `electron` binary не скачивается в этом sandbox из-за сети (UNABLE_TO_VERIFY_LEAF_SIGNATURE) — нужен `npm install --ignore-scripts` + ручная загрузка electron или `ELECTRON_MIRROR`
- `hls.js` все еще грузится синхронно в index.html — нужно динамический импорт только в Player
- `anixartjs@0.0.7` — проверить есть ли новее, типизировать ответы (сейчас `any`)
- Light тема не оптимизирована — нужно пройтись по всем компонентам
- Нет тестов — добавить Vitest
- Нет ESLint/Prettier — добавить
- `forge.config.js` все еще использует squirrel только для win — добавить deb/rpm/zip для linux/mac, иконки
- `public/index.html` старый (bundle.css) — можно удалить, теперь используется `public/build/index.html`
- Некоторые страницы (Collections, Discover, Friends, Notifications) — заглушки, нужен API

---

## Автор

Реализовано в рамках задачи "Предложи идеи улучшения программы и её апгрейда и удобства" → "Добавляй начинай"
Ветка: `arena/01a091e3-anixart-pc-owl`
