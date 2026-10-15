// What preload.ts exposes on window through contextBridge. Optional: the
// renderer can also run in a plain browser (vite dev without Electron).
export {};

declare global {
  interface Window {
    electronAPI?: {
      getVersion: () => Promise<string>;
      openExternal: (url: string) => Promise<void>;
      getSystemInfo: () => Promise<{ platform: string; osVersion: string }>;
    };
  }
}
