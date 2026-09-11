const { contextBridge, ipcRenderer } = require('electron');

// Modern consolidated API + legacy compatibility
const electronAPI = {
  // Window controls
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    getSize: () => ipcRenderer.invoke('window:getSize'),
    getBounds: () => ipcRenderer.invoke('window:getBounds'),
    enterFullscreen: () => ipcRenderer.invoke('window:enterFullScreen'),
    leaveFullscreen: () => ipcRenderer.invoke('window:leaveFullScreen'),
    isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  },

  // Settings with validation
  settings: {
    getAll: () => ipcRenderer.invoke('settings:getAll'),
    get: (key) => {
      if (typeof key !== 'string') return Promise.resolve(null);
      return ipcRenderer.invoke('settings:get', key);
    },
    set: (key, value) => {
      if (typeof key !== 'string') return Promise.resolve();
      if (['__proto__', 'constructor', 'prototype'].includes(key)) return Promise.resolve();
      return ipcRenderer.invoke('settings:set', key, value);
    },
  },

  // External links with security
  shell: {
    openLink: (link) => {
      if (typeof link !== 'string') return Promise.resolve();
      try {
        const url = new URL(link);
        if (!['http:', 'https:'].includes(url.protocol)) return Promise.resolve();
        return ipcRenderer.invoke('winApi:openLink', link);
      } catch {
        return Promise.resolve();
      }
    },
  },

  // Video parsers
  sibnet: {
    parse: (link) => {
      if (typeof link !== 'string' || !link.includes('sibnet')) return Promise.resolve(null);
      return ipcRenderer.invoke('sibnet:parse', link);
    },
  },

  // Discord RPC
  discord: {
    setActivity: (activity) => {
      if (!activity || typeof activity !== 'object') return Promise.resolve();
      return ipcRenderer.invoke('discordRPC:setActivity', activity);
    },
  },

  // App info
  app: {
    getVersions: () => ipcRenderer.invoke('prc:getVersions'),
    getPath: (name) => ipcRenderer.invoke('app:getPath', name),
    clearCache: () => ipcRenderer.invoke('app:clearCache'),
  },

  // Analytics
  analytics: {
    trackEvent: (eventName, props) => {
      if (typeof eventName !== 'string' || eventName.length > 100) return Promise.resolve();
      return ipcRenderer.invoke("analytics:trackEvent", eventName, props);
    },
  },
};

// Expose modern API
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Legacy bridges for old code compatibility (will be removed later)
contextBridge.exposeInMainWorld('titleBarAPI', {
  minimize: electronAPI.window.minimize,
  maximize: electronAPI.window.maximize,
  close: electronAPI.window.close,
});

contextBridge.exposeInMainWorld('analytics', {
  trackEvent: electronAPI.analytics.trackEvent,
});

contextBridge.exposeInMainWorld('winApi', {
  openLink: electronAPI.shell.openLink,
});

contextBridge.exposeInMainWorld('Sibnet', {
  Parse: electronAPI.sibnet.parse,
});

contextBridge.exposeInMainWorld('elecWindow', {
  getSize: electronAPI.window.getSize,
  getBounds: electronAPI.window.getBounds,
  exitFullscreen: electronAPI.window.leaveFullscreen,
  enterFullscreen: electronAPI.window.enterFullscreen,
  isMaximized: electronAPI.window.isMaximized,
});

contextBridge.exposeInMainWorld('prc', {
  getVersions: electronAPI.app.getVersions,
});

contextBridge.exposeInMainWorld('discordRPC', {
  setActivity: electronAPI.discord.setActivity,
});

contextBridge.exposeInMainWorld('settings', {
  getAll: electronAPI.settings.getAll,
  get: electronAPI.settings.get,
  set: electronAPI.settings.set,
});

// Deprecated - for removal
contextBridge.exposeInMainWorld('netElec', {
  fetch: (url, requestInfo) => {
    console.warn('netElec.fetch is deprecated');
    return Promise.resolve(null);
  },
});
