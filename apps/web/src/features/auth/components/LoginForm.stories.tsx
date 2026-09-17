import type { Meta, StoryObj } from '@storybook/react';

import { LoginForm } from './LoginForm';

const meta: Meta<typeof LoginForm> = {
  title: 'Features/Auth/LoginForm',
  component: LoginForm,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-full max-w-md">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof LoginForm>;

export const GuestLogin: Story = {
  args: {
    title: 'Log in',
    description: 'Welcome back. Sign in to manage your stays and profile.',
    defaultRedirectTo: '/',
    signupPath: '/signup',
    signupPrompt: 'New to Housing Platform?',
    signupLinkLabel: 'Create an account',
    alternateLoginPath: '/host/login',
    alternateLoginPrompt: 'Are you a host?',
    alternateLoginLinkLabel: 'Log in to the host portal',
  },
};

export const HostLogin: Story = {
  args: {
    title: 'Host log in',
    description: 'Sign in with your host account to manage listings and bookings.',
    defaultRedirectTo: '/host',
    signupPath: '/host/signup',
    signupPrompt: 'Want to list a property?',
    signupLinkLabel: 'Create a host account',
    alternateLoginPath: '/login',
    alternateLoginPrompt: 'Looking to book a stay?',
    alternateLoginLinkLabel: 'Guest log in',
  },
};

export const AdminLogin: Story = {
  args: {
    title: 'Admin log in',
    description: 'Sign in to the Housing Platform admin console.',
    defaultRedirectTo: '/admin',
    // No signup or alternate login for admin
  },
};
