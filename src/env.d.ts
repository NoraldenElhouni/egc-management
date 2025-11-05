/// <reference types="vite/client" />

declare global {
  interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL?: string;
    readonly VITE_SUPABASE_ANON_KEY?: string;
    // add other VITE_ variables here
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}
