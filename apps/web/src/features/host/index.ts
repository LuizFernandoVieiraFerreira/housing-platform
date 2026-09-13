/**
 * Host feature public API
 *
 * Usage:
 *   import { useCurrentHost, HostRoute, hostKeys } from '@/features/host';
 *
 * Note: Some utilities (HOST_STATUS_CONFIG, getHostStatusConfig, getRelation)
 * are not re-exported here to avoid conflicts with @/features/admin.
 * Import directly from '@/features/host/model' if needed.
 */

// ============================================================================
// Model Layer (types, schemas, constants, utils)
// ============================================================================
export type {
  // Shared types
  HostRecord,
  HostPropertyListItem,
  HostPropertyDetail,
  HostRoomDetail,
  AccommodationType,
  BookingMode,
  PropertyStatus,
  RoomStatus,
  AmenityOption,
  // Input types
  HostRegisterInput,
  HostPropertyInput,
  HostRoomInput,
  // Feature-local row types
  HostPropertyListRow,
  HostPropertyDetailRow,
  HostRoomRow,
  HostBookingRow,
  CoordinatesRow,
} from './model';

// Note: HostStatus is exported from @/features/admin to avoid conflicts
// Note: HostBookingListItem is exported from @/features/admin to avoid conflicts

export {
  // Schemas
  hostRegisterSchema,
  hostPropertySchema,
  hostRoomSchema,
  // Constants (host-specific, not conflicting with admin)
  HOST_ACTIVE_STATUSES,
  HOST_BLOCKED_STATUSES,
  PROPERTY_EDITABLE_STATUSES,
  PROPERTY_SUBMITTABLE_STATUSES,
  PROPERTY_PUBLIC_STATUSES,
  PROPERTY_TERMINAL_STATUSES,
  ROOM_BOOKABLE_STATUSES,
  ROOM_UNAVAILABLE_STATUSES,
  MAX_HOST_PROPERTIES,
  MAX_ROOMS_PER_PROPERTY,
  MAX_AMENITIES_PER_PROPERTY,
  MAX_TAGS_PER_PROPERTY,
  MIN_MONTHLY_RENT_KRW,
  MAX_MONTHLY_RENT_KRW,
  MIN_STAY_NIGHTS,
  MAX_STAY_NIGHTS,
  MAX_STATION_WALK_MIN,
  PROPERTY_STATUS_CONFIG,
  ROOM_STATUS_CONFIG,
  BOOKING_MODE_CONFIG,
  // Utils (host-specific, not conflicting with admin)
  isHostProfile,
  canHostCreateProperty,
  isHostBlocked,
  canEditProperty,
  canSubmitProperty,
  isPropertyPublic,
  isPropertyTerminal,
  getPropertyStatusConfig,
  canRoomBook,
  getRoomStatusConfig,
  createPropertySlug,
  parseTags,
} from './model';

// Note: HOST_STATUS_CONFIG, getHostStatusConfig, getRelation are available
// from @/features/admin or import directly from '@/features/host/model'

// ============================================================================
// Query Keys
// ============================================================================
export { hostKeys } from './keys';

// ============================================================================
// Hooks
// ============================================================================
export { useCurrentHost } from './hooks/useHost';

// ============================================================================
// Components
// ============================================================================
export { HostRoute } from './components/HostRoute';

// ============================================================================
// Layouts
// ============================================================================
export { HostLayout } from './layouts/HostLayout';
