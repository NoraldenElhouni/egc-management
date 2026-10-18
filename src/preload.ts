// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  getVersion: () => ipcRenderer.invoke("get-app-version"),
  openExternal: (url: string) => ipcRenderer.invoke("open-external", url),
  getSystemInfo: () =>
    ipcRenderer.invoke("get-system-info") as Promise<{
      platform: string;
      osVersion: string;
    }>,
  isWindowFocused: () => ipcRenderer.invoke("window-is-focused") as Promise<boolean>,
  showNotification: (payload: { title: string; body: string; route?: string | null }) =>
    ipcRenderer.invoke("notify-show", payload) as Promise<boolean>,
  setBadgeCount: (count: number) => ipcRenderer.invoke("notify-badge", count) as Promise<void>,
  /** Clicking an OS notification asks the app to open this route. Returns an unsubscribe. */
  onNotificationOpen: (callback: (route: string) => void) => {
    const listener = (_event: unknown, route: string) => callback(route);
    ipcRenderer.on("notify-open", listener);
    return () => {
      ipcRenderer.removeListener("notify-open", listener);
    };
  },
});
