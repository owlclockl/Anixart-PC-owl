const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('node:path');
const serve = require('electron-serve');
// Serve from public/build in production (vite output), public in dev fallback
const loadURL = serve({ directory: './public/build' });
const loadURLFallback = serve({ directory: './public' });
const fs = require('fs');
const rpc = require("@xhayper/discord-rpc");
const { initialize, trackEvent } = require("./aptabase/main");
const { SibnetParser } = require('anixartjs');

/**
 * @type {BrowserWindow}
 */
let mainWindow;
let log = console;

// Try to use electron-log if available, fallback to console
try {
  const electronLog = require('electron-log');
  electronLog.initialize();
  log = electronLog;
  log.transports.file.level = 'info';
} catch (e) {
  console.warn('electron-log not available, using console');
}

const UserAgent = "AnixartApp/9.0 BETA 3-25021818 (Android 9; SDK 28; x86_64; ROG ASUS AI2201_B; ru)";
const rpcClientId = '1372649290438148137';
const SettingsPath = path.join(app.getPath("userData"), "settings.json");

const DefaultSettings = {
  AutoUpdate: true,
  EnableAnalytics: true,
  EnableRPC: false,
  EnableDevTools: false,
  minimizeToTray: false,
  closeToTray: false,
  windowBounds: { width: 1280, height: 720 },
};

// Safe settings read/write with error handling
function readSettings() {
  try {
    if (fs.existsSync(SettingsPath)) {
      const raw = fs.readFileSync(SettingsPath, 'utf-8');
      const parsed = JSON.parse(raw);
      return { ...DefaultSettings, ...parsed };
    }
  } catch (e) {
    log.error('Failed to read settings:', e);
  }
  return { ...DefaultSettings };
}

function writeSettings(settings) {
  try {
    fs.mkdirSync(path.dirname(SettingsPath), { recursive: true });
    fs.writeFileSync(SettingsPath, JSON.stringify(settings, null, 2));
  } catch (e) {
    log.error('Failed to write settings:', e);
  }
}

const SettingsFirst = readSettings();

const discordRpcClient = new rpc.Client({
  clientId: rpcClientId
});

discordRpcClient.on('ready', () => {
  log.info("[RPC] Hooked!");
});

discordRpcClient.on('error', (err) => {
  log.warn("[RPC] Error:", err);
});

// Auto-updater with better handling - only in production
if (SettingsFirst.AutoUpdate && app.isPackaged) {
  try {
    const { autoUpdater } = require('electron');
    const server = 'https://update.electronjs.org';
    const feed = `${server}/theDesConnet/AniDesk/${process.platform}-${process.arch}/${app.getVersion()}`;

    autoUpdater.on("checking-for-update", () => log.info("checking-for-update"));
    autoUpdater.on("update-available", () => log.info("update-available"));
    autoUpdater.on("update-not-available", () => log.info("update-not-available"));
    autoUpdater.on('error', (message) => {
      log.error('AutoUpdater error:', message);
    });
    autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
      const dialogOpts = {
        type: 'info',
        buttons: ['Перезапустить', 'Позже', 'Список изменений'],
        title: 'Обновление AniDesk',
        message: process.platform === 'win32' ? releaseNotes : releaseName,
        detail: 'Новая версия была скачана, перезапустите приложение для установки.'
      };
      dialog.showMessageBox(dialogOpts).then((returnValue) => {
        if (returnValue.response === 0) autoUpdater.quitAndInstall();
        if (returnValue.response === 2 && releaseNotes) {
          shell.openExternal('https://github.com/owlclockl/Anixart-PC-owl/releases');
        }
      });
    });

    autoUpdater.setFeedURL(feed);
    // Delay check to not block startup
    setTimeout(() => autoUpdater.checkForUpdates().catch(e => log.warn('Update check failed', e)), 5000);
  } catch (e) {
    log.warn('AutoUpdater not available:', e.message);
  }
}

if (require('electron-squirrel-startup')) app.quit();

const isFirstInstance = app.requestSingleInstanceLock();

if (!isFirstInstance) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

if (SettingsFirst.EnableRPC) {
  discordRpcClient.login().catch(err => log.warn("[RPC] Login failed:", err.message));
}

if (SettingsFirst.EnableAnalytics) {
  try {
    initialize("A-EU-5850138901");
    trackEvent("app_started", { version: app.getVersion(), platform: process.platform });
  } catch (e) {
    log.warn('Analytics init failed', e);
  }
}

function isDev() {
  return !app.isPackaged;
}

function UpsertKeyValue(obj, keyToChange, value) {
  const keyToChangeLower = keyToChange.toLowerCase();
  for (const key of Object.keys(obj)) {
    if (key.toLowerCase() === keyToChangeLower) {
      obj[key] = value;
      return;
    }
  }
  obj[keyToChange] = value;
}

// Whitelist for certificate bypass - only for video sources that may have issues
const CERT_WHITELIST = [
  'video.sibnet.ru',
  'kodik.info',
  'kodik.cc',
  'anixart',
];

function isWhitelistedForCert(url) {
  try {
    const host = new URL(url).host;
    return CERT_WHITELIST.some(w => host.includes(w));
  } catch {
    return false;
  }
}

function createWindow() {
  const bounds = SettingsFirst.windowBounds || { width: 1280, height: 720 };
  
  mainWindow = new BrowserWindow({
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'hidden',
    width: bounds.width || 1280,
    height: bounds.height || 720,
    x: bounds.x,
    y: bounds.y,
    minHeight: 720,
    minWidth: 1280,
    autoHideMenuBar: true,
    backgroundColor: '#121212',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
      devTools: SettingsFirst.EnableDevTools || isDev(),
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
    },
    icon: "./public/assets/icons/anidesk-icon.png",
    show: false,
  });

  // Save bounds on close/move
  const saveBounds = () => {
    try {
      const currentBounds = mainWindow.getBounds();
      const settings = readSettings();
      settings.windowBounds = currentBounds;
      writeSettings(settings);
    } catch (e) {
      log.warn('Failed to save bounds', e);
    }
  };

  mainWindow.on('close', (event) => {
    const settings = readSettings();
    if (settings.closeToTray && !app.isQuiting) {
      event.preventDefault();
      mainWindow.hide();
      return;
    }
    saveBounds();
  });

  mainWindow.on('closed', function () {
    mainWindow = null;
  });

  mainWindow.once('ready-to-show', async () => {
    mainWindow.show();
    if (isDev() && SettingsFirst.EnableDevTools) {
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
  });

  // Secure headers handling
  mainWindow.webContents.session.webRequest.onBeforeSendHeaders(
    (details, callback) => {
      const { url, requestHeaders } = details;
      let host = '';
      try { host = new URL(url).host; } catch {}

      // Only modify headers for specific hosts, not all
      if (host === "video.sibnet.ru") {
        UpsertKeyValue(requestHeaders, 'Referer', url);
      }

      // Spoof as mobile only for Anixart API, not for everything
      if (host.includes('anixart') || host.includes('anixsekai')) {
        UpsertKeyValue(requestHeaders, 'sec-ch-ua-platform', "Android");
        UpsertKeyValue(requestHeaders, 'sec-ch-ua-mobile', "?1");
        UpsertKeyValue(requestHeaders, 'sec-ch-ua', "AnixartApp");
        UpsertKeyValue(requestHeaders, 'User-Agent', UserAgent);
      }

      callback({ requestHeaders });
    },
  );

  // Only allow CORS for specific API domains, not wildcard
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    const { url, responseHeaders } = details;
    let host = '';
    try { host = new URL(url).host; } catch {}

    // Only add CORS for our API domains and video sources
    if (host.includes('anixart') || host.includes('anixsekai') || host.includes('sibnet') || host.includes('kodik')) {
      UpsertKeyValue(responseHeaders, 'Access-Control-Allow-Origin', ['*']);
      UpsertKeyValue(responseHeaders, 'Access-Control-Allow-Headers', ['*']);
    }

    callback({ responseHeaders });
  });

  if (isDev()) {
    mainWindow.loadURL('http://localhost:5173').catch(() => {
      log.warn('Dev server not available, trying 8080');
      mainWindow.loadURL('http://localhost:8080/').catch(e => {
        log.error('Failed to load dev server', e);
        loadURL(mainWindow);
      });
    });
  } else {
    // Try new build location first, fallback to old public
    loadURL(mainWindow).catch(() => {
      log.warn('Failed to load from public/build, trying public');
      loadURLFallback(mainWindow);
    });
  }

  // Security: prevent new windows, open external links in browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    const parsed = new URL(url);
    if (parsed.origin !== mainWindow.webContents.getURL() && !url.startsWith('http://localhost')) {
      event.preventDefault();
      if (url.startsWith('https://')) {
        shell.openExternal(url);
      }
    }
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
  if (mainWindow === null) createWindow();
});

app.on('before-quit', () => {
  app.isQuiting = true;
});

// SECURE certificate handling - only whitelist, not all
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  if (isWhitelistedForCert(url)) {
    log.warn(`Allowing cert error for whitelisted domain: ${url} - ${error}`);
    event.preventDefault();
    callback(true);
  } else {
    log.warn(`Blocked cert error for non-whitelisted domain: ${url} - ${error}`);
    callback(false);
  }
});

// IPC handlers with validation
ipcMain.handle("analytics:trackEvent", (_, eventName, props) => {
  try {
    if (typeof eventName !== 'string' || eventName.length > 100) return;
    trackEvent(eventName, props);
  } catch (e) {
    log.warn('Analytics track failed', e);
  }
});

ipcMain.handle("settings:get", (_, key) => {
  if (typeof key !== 'string') return null;
  const settings = readSettings();
  return settings?.[key] ?? null;
});

ipcMain.handle("settings:set", (_, key, value) => {
  if (typeof key !== 'string') return;
  // Basic validation - prevent prototype pollution
  if (['__proto__', 'constructor', 'prototype'].includes(key)) return;
  const settings = readSettings();
  settings[key] = value;
  writeSettings(settings);
});

ipcMain.handle("settings:getAll", (_) => {
  return readSettings();
});

ipcMain.handle("window:minimize", (_) => {
  mainWindow?.minimize();
});

ipcMain.handle("window:maximize", (_) => {
  if (!mainWindow) return;
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});

ipcMain.handle("window:close", (_) => {
  mainWindow?.close();
});

ipcMain.handle("window:getSize", (_) => {
  return mainWindow?.getSize() || [1280, 720];
});

ipcMain.handle("window:getBounds", (_) => {
  return mainWindow?.getBounds() || { width: 1280, height: 720 };
});

ipcMain.handle("window:enterFullScreen", (_) => {
  mainWindow?.setFullScreen(true);
});

ipcMain.handle("window:leaveFullScreen", (_) => {
  mainWindow?.setFullScreen(false);
});

ipcMain.handle("window:isMaximized", (_) => {
  return mainWindow?.isMaximized() || false;
});

ipcMain.handle("sibnet:parse", async (_, link) => {
  try {
    if (typeof link !== 'string' || !link.includes('sibnet')) return null;
    const res = await SibnetParser.getDirectLink(link);
    return res;
  } catch (e) {
    log.warn('Sibnet parse failed', e);
    return null;
  }
});

ipcMain.handle("winApi:openLink", (_, link) => {
  try {
    if (typeof link !== 'string') return;
    const url = new URL(link);
    // Only allow http/https
    if (!['http:', 'https:'].includes(url.protocol)) {
      log.warn('Blocked non-http link:', link);
      return;
    }
    // Block localhost and private IPs for security
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname.startsWith('192.168.') || url.hostname.startsWith('10.')) {
      log.warn('Blocked private IP link:', link);
      return;
    }
    shell.openExternal(link);
  } catch (e) {
    log.warn('Failed to open link:', link, e);
  }
});

ipcMain.handle("discordRPC:setActivity", (_, activity) => {
  try {
    const settings = readSettings();
    if (!settings.EnableRPC) {
      log.info("[RPC] Disabled in settings");
      return;
    }
    if (discordRpcClient.user) {
      discordRpcClient.user.setActivity(activity).then(() => log.info("[RPC] Activity set!")).catch(err => log.warn("[RPC] Failed:", err.message));
    }
  } catch (e) {
    log.warn('RPC setActivity failed', e);
  }
});

ipcMain.handle("prc:getVersions", (_) => {
  return {
    chrome: process.versions.chrome,
    electron: process.versions.electron,
    anidesk: app.getVersion(),
    node: process.versions.node,
    platform: process.platform,
    arch: process.arch,
  };
});

ipcMain.handle("app:getPath", (_, name) => {
  try {
    return app.getPath(name);
  } catch {
    return null;
  }
});

ipcMain.handle("app:clearCache", async (_) => {
  try {
    const session = mainWindow?.webContents.session;
    if (session) {
      await session.clearCache();
      await session.clearStorageData({ storages: ['cookies', 'localstorage'] });
      return true;
    }
  } catch (e) {
    log.warn('Clear cache failed', e);
  }
  return false;
});
