/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_REMOTE_CONF_URL: string;
  readonly VITE_CONF_PASSPHRASE: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
