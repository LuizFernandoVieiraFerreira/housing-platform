/**
 * Pure utility functions for host domain logic.
 *
 * These functions have no React or i18n dependencies.
 * They operate on pure data and can be easily tested.
 */

import type { HostStatus, PropertyStatus, RoomStatus } from './types';
import {
  HOST_ACTIVE_STATUSES,
  HOST_BLOCKED_STATUSES,
  PROPERTY_EDITABLE_STATUSES,
  PROPERTY_SUBMITTABLE_STATUSES,
  PROPERTY_PUBLIC_STATUSES,
  PROPERTY_TERMINAL_STATUSES,
  ROOM_BOOKABLE_STATUSES,
  HOST_STATUS_CONFIG,
  PROPERTY_STATUS_CONFIG,
  ROOM_STATUS_CONFIG,
} from './constants';

// ============================================================================
// Role Checks
// ============================================================================

/**
 * Check if a user role indicates they are a host.
 */
export function isHostProfile(role: string | undefined): boolean {
  return role === 'host' || role === 'admin';
}

// ============================================================================
// Host Status Checks
// ============================================================================

/**
 * Check if a host can create new properties.
 */
export function canHostCreateProperty(status: HostStatus): boolean {
  return HOST_ACTIVE_STATUSES.includes(status);
}

/**
 * Check if a host is blocked from actions.
 */
export function isHostBlocked(status: HostStatus): boolean {
  return HOST_BLOCKED_STATUSES.includes(status);
}

/**
 * Get host status configuration for UI rendering.
 */
export function getHostStatusConfig(status: HostStatus) {
  return HOST_STATUS_CONFIG[status];
}

// ============================================================================
// Property Status Checks
// ============================================================================

/**
 * Check if a property can be edited by the host.
 */
export function canEditProperty(status: PropertyStatus): boolean {
  return PROPERTY_EDITABLE_STATUSES.includes(status);
}

/**
 * Check if a property can be submitted for review.
 */
export function canSubmitProperty(status: PropertyStatus): boolean {
  return PROPERTY_SUBMITTABLE_STATUSES.includes(status);
}

/**
 * Check if a property is publicly visible.
 */
export function isPropertyPublic(status: PropertyStatus): boolean {
  return PROPERTY_PUBLIC_STATUSES.includes(status);
}

/**
 * Check if a property is in a terminal state.
 */
export function isPropertyTerminal(status: PropertyStatus): boolean {
  return PROPERTY_TERMINAL_STATUSES.includes(status);
}

/**
 * Get property status configuration for UI rendering.
 */
export function getPropertyStatusConfig(status: PropertyStatus) {
  return PROPERTY_STATUS_CONFIG[status];
}

// ============================================================================
// Room Status Checks
// ============================================================================

/**
 * Check if a room can accept bookings.
 */
export function canRoomBook(status: RoomStatus): boolean {
  return ROOM_BOOKABLE_STATUSES.includes(status);
}

/**
 * Get room status configuration for UI rendering.
 */
export function getRoomStatusConfig(status: RoomStatus) {
  return ROOM_STATUS_CONFIG[status];
}

// ============================================================================
// Property Slug Generation
// ============================================================================

/**
 * Generate a unique slug for a property title.
 */
export function createPropertySlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  return `${base || 'listing'}-${crypto.randomUUID().slice(0, 8)}`;
}

// ============================================================================
// Tag Parsing
// ============================================================================

/**
 * Parse comma-separated tags string into an array.
 * Trims whitespace and limits to 10 tags.
 */
export function parseTags(tags: string | undefined): string[] {
  if (!tags?.trim()) {
    return [];
  }

  return tags
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 10);
}

// ============================================================================
// Relation Helpers
// ============================================================================

/**
 * Extract a single value from a Supabase relation that may be an array or single value.
 * Supabase returns relations as arrays, but we often need just the first item.
 */
export function getRelation<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) {
    return null;
  }

  return Array.isArray(value) ? (value[0] ?? null) : value;
}
