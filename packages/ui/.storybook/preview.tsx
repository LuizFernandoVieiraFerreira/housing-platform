import type { Decorator, Preview } from '@storybook/react';
import { useEffect, type ComponentType } from 'react';

import {
  applyRoleTheme,
  type RoleThemeKey,
} from '@housing-platform/config/design-tokens/role-themes';

import '../src/styles.css';

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

const preview: Preview = {
  decorators: [roleThemeDecorator],
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
  },
  initialGlobals: {
    role: 'customer',
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
