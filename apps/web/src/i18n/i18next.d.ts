import 'i18next';

import type enAccount from '@/i18n/locales/en/account.json';
import type enAuth from '@/i18n/locales/en/auth.json';
import type enBooking from '@/i18n/locales/en/booking.json';
import type enCommon from '@/i18n/locales/en/common.json';
import type enHome from '@/i18n/locales/en/home.json';
import type enPlatforms from '@/i18n/locales/en/platforms.json';
import type enSearch from '@/i18n/locales/en/search.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof enCommon;
      auth: typeof enAuth;
      home: typeof enHome;
      search: typeof enSearch;
      booking: typeof enBooking;
      account: typeof enAccount;
      platforms: typeof enPlatforms;
    };
  }
}
