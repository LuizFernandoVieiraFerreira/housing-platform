/**
 * Host feature public API.
 *
 * Host admin types (HostStatus, HostBookingListItem) and status helpers live in
 * @/features/admin. Import other host-only utilities from @/features/host/model.
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
