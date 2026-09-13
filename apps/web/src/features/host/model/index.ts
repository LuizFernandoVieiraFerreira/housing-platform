/**
 * Host model layer - pure domain definitions.
 *
 * This layer contains:
 * - Types (shared + feature-local)
 * - Schemas (Zod validation)
 * - Constants (business rules, configuration)
 * - Utils (pure functions, no React/i18n dependencies)
 *
 * Rules:
 * - No React imports
 * - No i18n dependencies
 * - No external API calls
 * - Fully testable without mocking
 */

// Types
export type {
  // Shared types
  HostRecord,
  HostStatus,
  HostPropertyListItem,
  HostPropertyDetail,
  HostRoomDetail,
  HostBookingListItem,
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
} from './types';

// Schemas
export { hostRegisterSchema, hostPropertySchema, hostRoomSchema } from './schemas';

// Constants
export {
  // Host status groups
  HOST_ACTIVE_STATUSES,
  HOST_BLOCKED_STATUSES,
  // Property status groups
  PROPERTY_EDITABLE_STATUSES,
  PROPERTY_SUBMITTABLE_STATUSES,
  PROPERTY_PUBLIC_STATUSES,
  PROPERTY_TERMINAL_STATUSES,
  // Room status groups
  ROOM_BOOKABLE_STATUSES,
  ROOM_UNAVAILABLE_STATUSES,
  // Business rules
  MAX_HOST_PROPERTIES,
  MAX_ROOMS_PER_PROPERTY,
  MAX_AMENITIES_PER_PROPERTY,
  MAX_TAGS_PER_PROPERTY,
  MIN_MONTHLY_RENT_KRW,
  MAX_MONTHLY_RENT_KRW,
  MIN_STAY_NIGHTS,
  MAX_STAY_NIGHTS,
  MAX_STATION_WALK_MIN,
  // Status configs
  HOST_STATUS_CONFIG,
  PROPERTY_STATUS_CONFIG,
  ROOM_STATUS_CONFIG,
  BOOKING_MODE_CONFIG,
} from './constants';

// Utils
export {
  isHostProfile,
  canHostCreateProperty,
  isHostBlocked,
  getHostStatusConfig,
  canEditProperty,
  canSubmitProperty,
  isPropertyPublic,
  isPropertyTerminal,
  getPropertyStatusConfig,
  canRoomBook,
  getRoomStatusConfig,
  createPropertySlug,
  parseTags,
  getRelation,
} from './utils';
