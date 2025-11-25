/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_XANO_AUTH_BASE: string;
  readonly VITE_XANO_STORE_BASE: string;
  readonly VITE_XANO_TOKEN_TTL_SEC: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
