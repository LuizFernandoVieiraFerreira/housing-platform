/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_BACKEND_AUTH?: string;
  readonly VITE_BACKEND_PROPERTIES?: string;
  readonly VITE_BACKEND_BOOKINGS?: string;
  readonly VITE_BACKEND_PAYMENTS?: string;
  readonly VITE_BACKEND_HOSTS?: string;
  readonly VITE_BACKEND_ADMIN?: string;
  readonly VITE_BACKEND_NOTIFICATIONS?: string;
  readonly VITE_BACKEND_PROFILE?: string;
  readonly VITE_BACKEND_SEARCH?: string;
}

declare module '~react-pages' {
  import type { RouteObject } from 'react-router-dom';
  const routes: RouteObject[];
  export default routes;
}
