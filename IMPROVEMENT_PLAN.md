# План улучшения AniDesk / Anixart-PC-owl

> Анализ текущего состояния: `0.0.1-beta.2`, Electron 33 + React 18 + Vite 6, много заглушек (views только Home, иконки `<svg>...</svg>`, аватар всегда дефолтный). Ниже — идеи, сгруппированные по приоритету и категориям.

## 0. TL;DR - Что сломано прямо сейчас

1. **LeftMenu** — иконки не отображаются (строки-заглушки), `views[11]` и `views[7]` указывают в никуда → меню скрывается/крашится.
2. **Навигация по индексам** `updateViewportComponent(8)` — хрупко, нет мапы роутов.
3. **Глобальный стейт на `window.*`** — антипаттерн, гонки, нет типизации.
4. **Home infinite scroll** — баг с `page` стейтом (замыкание), нет дебаунса, нет виртуализации.
5. **Безопасность**: `certificate-error => true` для всех доменов, `Access-Control-Allow-Origin: *` в main процессе.
6. **Сборка**: `forge.config` только под squirrel win, нет иконок linux/mac, autoUpdater через `update.electronjs.org` (деприкейтед).
7. **Зависимости**: `openurl` (deprecated, 10 лет без обнов), `anixartjs@0.0.7` (есть новее?).

---

## 1. Архитектура — фундамент

### 1.1 Переписать main процесс на TypeScript
- `src/main.ts` вместо `main.js`
- `electron-store` вместо ручного `fs.readFileSync(settings.json)` — сейчас файл читается синхронно в 3 местах без try/catch.
- Валидация настроек через `zod`:
```ts
const SettingsSchema = z.object({
  AutoUpdate: z.boolean().default(true),
  EnableAnalytics: z.boolean().default(true),
  EnableRPC: z.boolean().default(false),
  EnableDevTools: z.boolean().default(false),
  theme: z.enum(['dark','light','system']).default('dark'),
  windowBounds: z.object({width, height, x, y}).optional()
})
```
- Убрать `openurl` → `shell.openExternal(link)`
- Логирование `electron-log`, ротация логов.

### 1.2 Нормальный IPC слой
Сейчас в `preload.js` 8 `exposeInMainWorld` без валидации. Сделать:
- Один неймспейс `window.electronAPI`
- Типизированный контракт (используй `electron-trpc` или `ipc` wrapper)
- Валидация аргументов в `ipcMain.handle`

### 1.3 Стейт-менеджмент
Заменить `window.anixApi`, `window.profileInfo` и т.д. на:
- `zustand` + `immer` (легкий, идеально для Electron)
- Отдельные сторы: `useAuthStore`, `usePlayerStore`, `useSettingsStore`, `useNavigationStore`
- Пример:
```ts
const useNavigationStore = create((set) => ({
  history: [],
  current: { page: 'home', args: null },
  navigate: (page, args) => set(s => ({ 
    history: [s.current, ...s.history].slice(0,50),
    current: {page, args}
  })),
  back: () => set(s => ({ current: s.history[0], history: s.history.slice(1)}))
}))
```

### 1.4 Роутер вместо индексов
Убрать `updateViewportComponent(8)`:
```ts
// routes.tsx
export const ROUTES = {
  home: { component: Home, title: 'Главная' },
  bookmarks: { component: Bookmarks, title: 'Закладки' },
  anime: { component: AnimePage, title: (args) => args.title },
  player: { component: PlayerPage, title: 'Плеер' },
  settings: { component: SettingsPage, title: 'Настройки' }
} as const
```
И использовать `navigate('anime', {id})` — читаемо, типобезопасно.

### 1.5 React паттерны
- Убрать `React.Suspense` с промисом (сейчас это не работает как ожидается) → использовать `useQuery` из `@tanstack/react-query` для кеша Anixart API
- `ErrorBoundary` на каждую страницу + глобальный fallback с кнопкой "Перезапустить" и отправкой логов
- `useLocalStorage` доработать: поддержка функционального апдейта `setValue(prev => ...)`, слушать `storage` event, `useSyncExternalStore`

---

## 2. UI/UX — удобство (самое важное для пользователя)

### 2.1 LeftMenu 2.0
- **Сейчас**: 75px, иконки не грузятся, нет тултипов.
- **Предложение**:
  - Hover-to-expand: 75px → 220px с анимацией 200ms, показывать лейблы
  - Реальные SVG иконки: использовать `lucide-react` или взять иконки из оригинала AniDesk
  - Тултипы `title` или `radix-ui/tooltip`
  - Индикаторы: бейдж уведомлений, точка "онлайн" у друзей
  - Аватар: грузить реальный из `profileInfo.avatar`, fallback + скелетон
  - Разделитель, драг для ресайза меню (сохранять в настройках)

### 2.2 TitleBar
- На macOS использовать `titleBarStyle: 'hiddenInset'`, на Windows — кастомный, на Linux — нативный (проверять `process.platform`)
- Добавить:
  - Breadcrumbs: `Главная > Наруто > 12 серия`
  - Поиск прямо в TitleBar (Ctrl+K) — как в VSCode/Spotlight
  - Кнопки назад/вперед с историей + жесты мыши (кнопки 4/5)
  - Отображение статуса сети (offline banner)

### 2.3 Главная страница
- **Скелетоны** вместо спиннера: `AnimeFullRowCardSkeleton` с shimmer
- Переключатель вида: **Row / Grid / Compact** (сохранять в `guiSettings.releaseCardType` — сейчас есть настройка но не используется)
- Виртуализация: `react-virtuoso` или `@tanstack/react-virtual` — сейчас рендерятся все 100+ карточек в DOM → лагает
- Фильтры: сделать не кнопками а `Tabs` + выпадающие `Select` для жанров, года, сортировки
- Сохранять скролл-позицию при возврате назад

### 2.4 Карточка аниме
- Hover-эффект: превью трейлера при наведении (если есть)
- Кнопка быстрого добавления в закладки прямо на карточке
- Прогресс-бар просмотра (если есть `profile_list_status`)
- Ленивая загрузка картинок: `loading="lazy"` + `IntersectionObserver` + blur placeholder

### 2.5 Плеер (главная фича которой сейчас нет)
Нужно реализовать полноценный:
- Кастомные контролы (а не нативные `<video>`)
- **Горячие клавиши**: Space, M, F, ←/→ 5с, ↑/↓ громкость, N/B след/пред серия
- Таймлайн с превью (thumbnails через `SibnetParser` или `Kodik`)
- Выбор озвучки / качества / источника (Kodik/Libria/Sibnet) — UI как в Anixart mobile
- Кнопки: Skip OP (пропуск опенинга, брать таймкоды с Anixart), Picture-in-Picture, Theater mode
- Запоминание: громкость, скорость, качество, источник → `playerDefaultSettings`
- **Anime4K**: переключатель в плеере + настройка пресета (сейчас в `utils.ts` есть `upscaleValues` но нигде не используется)
- Ambient light: свечение вокруг плеера цветом кадра (как в YouTube)
- Субтитры: поддержка .vtt, выбор языка

### 2.6 Поиск
- Глобальный поиск `Ctrl+K` модалка
- Автокомплит, история запросов, подсказки
- Фильтры: по типу, году, жанру, студии, озвучке
- Голосовой поиск (Web Speech API)

### 2.7 Модалки и UX мелочи
- Анимация появления `framer-motion`
- Focus trap, закрытие по Esc, клик вне
- Командная палитра `Cmd+K`

---

## 3. Новые функциональные фичи

### 3.1 Приоритет P0 (должны быть в бете)
- [ ] Страницы: Bookmarks, Profile, AnimePage, Player, Search, Settings, Notifications, Collections, Discover, Friends — сейчас их нет вообще
- [ ] Авторизация: логин/регистрация, восстановление, 2FA если есть в API
- [ ] Закладки: CRUD, сортировка (уже есть `bookmarkSortValues` но нет UI), папки
- [ ] История просмотра: локально + синхронизация с Anixart (если `disableHistory: false`)
- [ ] Продолжить просмотр: секция на главной

### 3.2 P1 (удобство)
- [ ] Трей: минимизация в трей, "Закрыть в трей", контекстное меню трей с "Продолжить", "Пауза"
- [ ] Глобальные шорткаты: `MediaPlayPause` для плеера даже когда окно не в фокусе
- [ ] Авто-обновление: нормальный UI (сейчас диалог нативный) — тостер "Доступно обновление" + ченджлог
- [ ] Discord RPC: показывать не только "Ожидание", а "Смотрит Наруто 12 серия", обложку аниме, кнопку "Смотреть вместе"
- [ ] Уведомления: о выходе новой серии (через Anixart API long-poll или WebSocket)
- [ ] Календарь релизов / расписание онгоингов на неделю
- [ ] Комментарии: просмотр и написание прямо в клиенте

### 3.3 P2 (вау-фичи)
- [ ] Синхронизация с Shikimori / MyAnimeList / AniList — отправлять прогресс
- [ ] Режим вечеринки: синхронизированный просмотр с друзьями (WebRTC)
- [ ] Загрузки: офлайн просмотр (кешировать HLS сегменты через `electron-dl`)
- [ ] Скриншотер: `S` делает скрин кадра в папку
- [ ] Расширения / плагины: система для кастомных источников
- [ ] AI рекомендации: на основе просмотренного (локально через TF-IDF по жанрам)
- [ ] Статистика: сколько часов просмотрено, график по месяцам

---

## 4. Производительность

- **Измерения**: добавить `web-vitals`, `electron-performance`
- **Банл**: сейчас весь `hls.js` (400KB) грузится в `index.html` синхронно → вынести в динамический импорт только на странице плеера
- **Картинки**: кеш на диск через `Cache API` или `electron-cache`, ресайз постеров через `sharp` на лету (не грузить 1080p постер в 140px карточке)
- **Мемоизация**: `React.memo` для `AnimeFullRowCard`, `useMemo` для фильтров
- **Воркеры**: парсинг Sibnet/Kodik в воркере, не блокировать UI
- **GPU**: проверка `checkGPUSupport` сейчас каждый раз при старте — кешировать, показывать бейдж "Anime4K доступен" только если WebGPU есть

---

## 5. Безопасность и стабильность

1. Убрать `certificate-error` bypass или сделать вайтлист только для `video.sibnet.ru` и `kodik.info`:
```js
app.on('certificate-error', (event, webContents, url, error, cert, cb) => {
  if (url.includes('sibnet.ru') || url.includes('kodik')) { cb(true); return; }
  cb(false);
})
```
2. Убрать `Access-Control-Allow-Origin: *` из `onHeadersReceived` — это дыра. Вместо этого проксировать нужные запросы через `net.request` в main процессе.
3. Включить `sandbox: true` уже есть, но также `allowRunningInsecureContent: false`, `experimentalFeatures: false`
4. CSP в `index.html`: `<meta http-equiv="Content-Security-Policy" content="default-src 'self' https://api-s.anixsekai.com ...">`
5. Валидация всех внешних ссылок перед `shell.openExternal`
6. Краш-репорты: `crashReporter` + Sentry
7. Логи: не писать токен в логи

---

## 6. Внешний вид и темизация

- **Дизайн-система**: завести `tailwindcss` или `vanilla-extract` вместо голого CSS. Сейчас стили размазаны по `components.css` 500+ строк без нейминга.
- **Темы**: доделать light тему, добавить `system` (следит за OS), `amoled` (чистый черный), кастомные акцент-цвета
- **Настройки внешнего вида**:
  - Размер постеров (S/M/L)
  - Плотность списка (комфортная/компактная)
  - Скругления, анимации вкл/выкл
  - Шрифт (Inter уже есть, добавить JetBrains Mono для цифр)
- **Анимации**: `prefers-reduced-motion` поддержка

---

## 7. Dev Experience и сборка

- **Скрипты**: сейчас `npm run dev` запускает `sirv public --no-clear` (странно). Сделать `electron-vite`:
```json
"dev": "electron-vite dev",
"build": "electron-vite build",
"preview": "electron-vite preview"
```
- **Линт**: ESLint + Prettier + `eslint-plugin-react-hooks`, pre-commit через `husky + lint-staged`
- **Типы**: включить `strict: true` в tsconfig, типизировать `anixartjs` ответы (сейчас `any` везде)
- **Тесты**: Vitest для utils, Playwright для e2e (клик по карточке → открывается страница)
- **CI**: GitHub Actions матрица `windows, macos, linux` + авто-релиз через `electron-builder` (лучше чем forge для кроссплатформы) + подпись
- **Автоапдейт**: перейти на `electron-updater` + GitHub Releases как провайдер, показывать ченджлог из `releaseNotes`
- **Иконки**: сгенерить все размеры через `electron-icon-builder`

---

## 8. Дорожная карта (предложение)

### Фаза 1 — Quick Wins (1-2 недели)
- Починить LeftMenu иконки (заменить на `lucide-react`)
- Заменить индексы на строковые роуты
- Переписать `useLocalStorage` + добавить `zustand`
- Добавить скелетоны, виртуализацию на главной
- Починить infinite scroll баг
- Убрать `openurl`, `certificate-error *`

### Фаза 2 — Core (1 месяц)
- Реализовать все отсутствующие страницы (Bookmarks, AnimePage, Settings, Search, Profile)
- Сделать нормальный плеер с HLS, выбором озвучки, Anime4K toggle
- Поиск `Ctrl+K`
- Трей, глобальные шорткаты, Discord RPC с инфой о релизе
- Настройки с вкладками + импорт/экспорт

### Фаза 3 — Polish (2-3 месяца)
- Темы, кастомизация, анимации
- Уведомления, календарь, комментарии
- Офлайн кеш, загрузки, PiP окно
- Интеграция Shikimori/MAL
- Тесты, CI, автоапдейт, подпись билдов
- Лендинг anidesk.ds1nc.ru обновить

---

## 9. Конкретные UX идеи для "вау, удобно"

1. **Командная палитра** как в Linear: `Ctrl+K` → "Перейти к закладкам", "Включить светлую тему", "Очистить кеш"
2. **Горячие клавиши везде**: `?` показывает шпаргалку
3. **Drag & Drop** постера в закладки
4. **Мини-плеер** при скролле: плеер уменьшается в угол при прокрутке комментариев
5. **Жесты**: свайп назад на тачпаде, pinch для изменения размера постера
6. **Rich presence в настройках**: галочка "Показывать что смотрю" + приватный режим
7. **Умная пауза**: пауза когда наушники отключили (через `navigator.mediaDevices`)
8. **Авто-пропуск опенинга/эндинга** по таймкодам с Anixart + настройка "всегда пропускать"
9. **Кнопка "Случайное аниме"** на главной — для тех кто не может выбрать
10. **Профили**: несколько аккаунтов Anixart в одном клиенте, быстрое переключение

---

## 10. Что можно сделать прямо сейчас в этом репозитории

Если хочешь, могу сразу в этой ветке реализовать:

- [ ] Фикс иконок LeftMenu + hover-expand + тултипы
- [ ] Роутер на строках + Zustand
- [ ] Скелетоны + виртуализация + фикс infinite scroll
- [ ] Нормальный TitleBar с breadcrumbs и поиском
- [ ] Страница Settings с вкладками (тема, плеер, RPC, обновления, о программе)
- [ ] Безопасность: убрать `*` CORS, пофиксить cert error, заменить openurl
- [ ] Переписать main.js на TS + electron-store
- [ ] Добавить ESLint, Prettier, electron-log
- [ ] Плеер MVP с hls.js динамическим импортом

Скажи какие пункты приоритетны — начну кодить.

