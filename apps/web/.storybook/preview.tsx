import type { Decorator, Preview } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, type ComponentType } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';

import {
  applyRoleTheme,
  type RoleThemeKey,
} from '@housing-platform/config/design-tokens/role-themes';

// Import i18n instance (initializes on import)
import i18n from '../src/i18n';

// Import styles - must come after i18n to ensure CSS variables are available
import '../src/index.css';

// ============================================================================
// Query Client for Stories
// ============================================================================

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: Infinity,
    },
  },
});

// ============================================================================
// Theme Decorator
// ============================================================================

function RoleThemeWrapper({ role, Story }: { role: RoleThemeKey; Story: ComponentType }) {
  useEffect(() => {
    applyRoleTheme(document.documentElement, role);
  }, [role]);

  return <Story />;
}

const roleThemeDecorator: Decorator = (Story, context) => {
  const role = (context.globals.role as RoleThemeKey | undefined) ?? 'customer';
  return <RoleThemeWrapper role={role} Story={Story} />;
};

// ============================================================================
// Provider Decorator
// ============================================================================

const withProviders: Decorator = (Story) => {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <Story />
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>
  );
};

// ============================================================================
// Preview Configuration
// ============================================================================

const preview: Preview = {
  decorators: [withProviders, roleThemeDecorator],
  globalTypes: {
    role: {
      description: 'Role-based primary color theme',
      toolbar: {
        title: 'Role theme',
        icon: 'paintbrush',
        items: [
          { value: 'customer', title: 'Customer (pink)' },
          { value: 'host', title: 'Host (blue)' },
          { value: 'admin', title: 'Admin (green)' },
        ],
        dynamicTitle: true,
      },
    },
    locale: {
      description: 'Locale for translations',
      toolbar: {
        title: 'Locale',
        icon: 'globe',
        items: [
          { value: 'en', title: 'English' },
          { value: 'ko', title: '한국어' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    role: 'customer',
    locale: 'en',
  },
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: 'centered',
    a11y: {
      test: 'todo',
    },
  },
};

export default preview;
