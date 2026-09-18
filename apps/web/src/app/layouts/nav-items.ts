import {
  Building2,
  CalendarCheck,
  Home,
  LayoutDashboard,
  Map,
  MessageCircle,
  Shield,
  User,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type NavLabelKey =
  | 'home'
  | 'map'
  | 'booking'
  | 'chat'
  | 'my'
  | 'dashboard'
  | 'properties'
  | 'hostBookings'
  | 'adminHome';

export interface NavItem {
  labelKey: NavLabelKey;
  to: string;
  end: boolean;
  icon: LucideIcon;
  showInDesktopHeader: boolean;
  /** Hidden from nav when the user is logged out. */
  requiresAuth?: boolean;
}

export const customerNavItems: NavItem[] = [
  { labelKey: 'home', to: '/', end: true, icon: Home, showInDesktopHeader: true },
  { labelKey: 'map', to: '/map', end: true, icon: Map, showInDesktopHeader: true },
  {
    labelKey: 'booking',
    to: '/bookings',
    end: true,
    icon: CalendarCheck,
    showInDesktopHeader: true,
    requiresAuth: true,
  },
  {
    labelKey: 'chat',
    to: '/messages',
    end: true,
    icon: MessageCircle,
    showInDesktopHeader: true,
    requiresAuth: true,
  },
  {
    labelKey: 'my',
    to: '/account',
    end: false,
    icon: User,
    showInDesktopHeader: false,
    requiresAuth: true,
  },
];

export const hostNavItems: NavItem[] = [
  {
    labelKey: 'dashboard',
    to: '/host',
    end: true,
    icon: LayoutDashboard,
    showInDesktopHeader: true,
  },
  {
    labelKey: 'properties',
    to: '/host/properties',
    end: false,
    icon: Building2,
    showInDesktopHeader: true,
  },
  {
    labelKey: 'hostBookings',
    to: '/host/bookings',
    end: true,
    icon: CalendarCheck,
    showInDesktopHeader: true,
  },
  {
    labelKey: 'chat',
    to: '/messages',
    end: true,
    icon: MessageCircle,
    showInDesktopHeader: true,
  },
  { labelKey: 'my', to: '/account', end: false, icon: User, showInDesktopHeader: false },
];

export const adminNavItems: NavItem[] = [
  {
    labelKey: 'adminHome',
    to: '/admin',
    end: true,
    icon: Shield,
    showInDesktopHeader: true,
  },
  {
    labelKey: 'properties',
    to: '/admin/properties',
    end: true,
    icon: Building2,
    showInDesktopHeader: true,
  },
  {
    labelKey: 'hostBookings',
    to: '/admin/bookings',
    end: true,
    icon: CalendarCheck,
    showInDesktopHeader: true,
  },
  { labelKey: 'my', to: '/account', end: false, icon: User, showInDesktopHeader: false },
];

export function getNavItemsForRole(role: string | undefined): NavItem[] {
  if (role === 'admin') {
    return adminNavItems;
  }

  if (role === 'host') {
    return hostNavItems;
  }

  return customerNavItems;
}

export function getVisibleNavItems(
  role: string | undefined,
  options: { isAuthenticated: boolean; desktopHeaderOnly?: boolean },
): NavItem[] {
  let items = getNavItemsForRole(role);

  if (!options.isAuthenticated) {
    items = items.filter((item) => !item.requiresAuth);
  }

  if (options.desktopHeaderOnly) {
    items = items.filter((item) => item.showInDesktopHeader);
  }

  return items;
}

export function getHomePathForRole(role: string | undefined): string {
  if (role === 'admin') {
    return '/admin';
  }

  if (role === 'host') {
    return '/host';
  }

  return '/';
}
