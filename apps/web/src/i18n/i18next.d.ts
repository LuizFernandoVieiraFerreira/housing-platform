import 'i18next';

import type {
  DefaultNamespace,
  TranslationResources,
} from '@/i18n/types';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: DefaultNamespace;
    resources: TranslationResources;
  }
}
