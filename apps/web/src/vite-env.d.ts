/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_APP_URL: string;
  readonly VITE_NAVER_MAP_CLIENT_ID?: string;
  readonly VITE_TOSS_CLIENT_KEY?: string;
  readonly VITE_TOSS_SUCCESS_URL?: string;
  readonly VITE_TOSS_FAIL_URL?: string;
  readonly VITE_CHANNEL_PLUGIN_KEY?: string;
  readonly VITE_SENTRY_DSN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
