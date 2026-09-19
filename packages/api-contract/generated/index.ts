/**
 * Generated from openapi.yaml. Do not edit.
 *
 * OpenAPI is the canonical cross-language contract. These Zod schemas are an
 * optional frontend convenience for runtime checks, not a second source of truth.
 *
 * Regenerate with: pnpm --filter @housing-platform/api-contract generate
 */
import { z } from 'zod';

export const accommodationTypeSchema = z.enum([
  'share-house',
  'studio',
  'micro-studio',
  'multi-bedroom',
]);
export type AccommodationType = z.infer<typeof accommodationTypeSchema>;

export const adminDashboardStatsSchema = z
  .object({
    pendingProperties: z.number().int().gte(0),
    pendingHosts: z.number().int().gte(0),
    openBookings: z.number().int().gte(0),
    openHousingRequests: z.number().int().gte(0),
  })
  .strict();
export type AdminDashboardStats = z.infer<typeof adminDashboardStatsSchema>;

export const bookingModeSchema = z.enum(['instant', 'request']);
export type BookingMode = z.infer<typeof bookingModeSchema>;

export const bookingStatusSchema = z.enum([
  'requested',
  'pending_payment',
  'expired',
  'confirmed',
  'payment_failed',
  'active',
  'completed',
  'cancelled',
  'rejected',
]);
export type BookingStatus = z.infer<typeof bookingStatusSchema>;

export const bookingTypeSchema = z.enum(['instant', 'request']);
export type BookingType = z.infer<typeof bookingTypeSchema>;

export const calendarDateSchema = z.string().date().describe('Calendar date in YYYY-MM-DD form.');
export type CalendarDate = z.infer<typeof calendarDateSchema>;

export const dateTimeSchema = z
  .string()
  .datetime({ offset: true })
  .describe('RFC 3339 timestamp with a timezone offset.');
export type DateTime = z.infer<typeof dateTimeSchema>;

export const errorCodeSchema = z.enum([
  'VALIDATION_ERROR',
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'BOOKING_CONFLICT',
  'BOOKING_EXPIRED',
  'PAYMENT_FAILED',
  'PAYMENT_AMOUNT_MISMATCH',
  'EXTERNAL_SERVICE_ERROR',
  'RATE_LIMITED',
  'INTERNAL_ERROR',
]);
export type ErrorCode = z.infer<typeof errorCodeSchema>;

export const hostStatusSchema = z.enum(['pending', 'active', 'suspended']);
export type HostStatus = z.infer<typeof hostStatusSchema>;

export const housingRequestStatusSchema = z.enum(['new', 'in_progress', 'closed']);
export type HousingRequestStatus = z.infer<typeof housingRequestStatusSchema>;

export const jsonObjectSchema = z.record(z.any()).describe('Arbitrary JSON object.');
export type JsonObject = z.infer<typeof jsonObjectSchema>;

export const markAllNotificationsReadResultSchema = z
  .object({ updatedCount: z.number().int().gte(0) })
  .strict();
export type MarkAllNotificationsReadResult = z.infer<typeof markAllNotificationsReadResultSchema>;

export const notificationTypeSchema = z.enum([
  'booking_request',
  'booking_confirmed',
  'booking_rejected',
]);
export type NotificationType = z.infer<typeof notificationTypeSchema>;

export const paymentStatusSchema = z.enum(['pending', 'confirmed', 'failed', 'cancelled']);
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;

export const propertySearchSortSchema = z.enum([
  'recommended',
  'price_asc',
  'price_desc',
  'distance',
  'semantic',
]);
export type PropertySearchSort = z.infer<typeof propertySearchSortSchema>;

export const propertyStatusSchema = z.enum(['draft', 'pending_review', 'published', 'archived']);
export type PropertyStatus = z.infer<typeof propertyStatusSchema>;

export const registerHostRequestSchema = z
  .object({ displayName: z.string().min(1).max(120) })
  .strict();
export type RegisterHostRequest = z.infer<typeof registerHostRequestSchema>;

export const roomStatusSchema = z.enum(['available', 'unavailable', 'archived']);
export type RoomStatus = z.infer<typeof roomStatusSchema>;

export const setPropertyLocationRequestSchema = z
  .object({ latitude: z.number().gte(-90).lte(90), longitude: z.number().gte(-180).lte(180) })
  .strict();
export type SetPropertyLocationRequest = z.infer<typeof setPropertyLocationRequestSchema>;

export const unreadNotificationCountSchema = z.object({ count: z.number().int().gte(0) }).strict();
export type UnreadNotificationCount = z.infer<typeof unreadNotificationCountSchema>;

export const updateProfileRequestSchema = z
  .object({
    fullName: z.string().min(1).max(120),
    phone: z.string().max(30).optional(),
    preferredLanguage: z.string().min(2).max(10),
    marketingConsent: z.boolean(),
    avatarUrl: z.string().url().optional(),
  })
  .strict();
export type UpdateProfileRequest = z.infer<typeof updateProfileRequestSchema>;

export const userRoleSchema = z.enum(['customer', 'host', 'admin']);
export type UserRole = z.infer<typeof userRoleSchema>;

export const uuidSchema = z.string().uuid();
export type Uuid = z.infer<typeof uuidSchema>;

export const webhookAckSchema = z
  .object({
    ok: z.boolean(),
    status: z.enum(['confirmed', 'failed', 'ignored', 'already_confirmed']),
  })
  .strict();
export type WebhookAck = z.infer<typeof webhookAckSchema>;

export const amenitySchema = z
  .object({ id: uuidSchema, slug: z.string(), name: z.string() })
  .strict();
export type Amenity = z.infer<typeof amenitySchema>;

export const apiErrorSchema = z
  .object({
    code: errorCodeSchema,
    message: z.string().min(1),
    details: jsonObjectSchema.optional(),
  })
  .strict();
export type ApiError = z.infer<typeof apiErrorSchema>;

export const auditLogSchema = z
  .object({
    id: uuidSchema,
    action: z.string(),
    entityType: z.string(),
    entityId: z.union([uuidSchema, z.null()]),
    actorName: z.string(),
    metadata: jsonObjectSchema,
    createdAt: dateTimeSchema,
  })
  .strict();
export type AuditLog = z.infer<typeof auditLogSchema>;

export const bookingQuoteSchema = z
  .object({
    roomId: uuidSchema,
    propertyId: uuidSchema,
    bookingMode: bookingModeSchema,
    nights: z.number().int().gte(1),
    rentKrw: z.number().int().gte(0),
    serviceFeeKrw: z.number().int().gte(0),
    totalKrw: z.number().int().gte(0),
    pricingVersion: z.string(),
  })
  .strict();
export type BookingQuote = z.infer<typeof bookingQuoteSchema>;

export const confirmPaymentRequestSchema = z
  .object({ paymentKey: z.string().min(1), orderId: uuidSchema, amount: z.number().int().gte(1) })
  .strict();
export type ConfirmPaymentRequest = z.infer<typeof confirmPaymentRequestSchema>;

export const confirmPaymentResultSchema = z
  .object({
    paymentId: uuidSchema,
    orderId: uuidSchema,
    bookingId: z.union([uuidSchema, z.null()]),
    status: paymentStatusSchema,
  })
  .strict();
export type ConfirmPaymentResult = z.infer<typeof confirmPaymentResultSchema>;

export const createBookingRequestSchema = z
  .object({
    roomId: uuidSchema,
    checkIn: calendarDateSchema,
    checkOut: calendarDateSchema,
    guestCount: z.number().int().gte(1).lte(20),
    customerNotes: z.string().max(500).optional(),
  })
  .strict();
export type CreateBookingRequest = z.infer<typeof createBookingRequestSchema>;

export const createPaymentOrderRequestSchema = z.object({ bookingId: uuidSchema }).strict();
export type CreatePaymentOrderRequest = z.infer<typeof createPaymentOrderRequestSchema>;

export const createPaymentOrderResultSchema = z
  .object({
    paymentId: uuidSchema,
    orderId: uuidSchema,
    bookingId: uuidSchema,
    amountKrw: z.number().int().gte(1),
    orderName: z.string(),
  })
  .strict();
export type CreatePaymentOrderResult = z.infer<typeof createPaymentOrderResultSchema>;

export const createRoomRequestSchema = z
  .object({
    name: z.string().min(1).max(120),
    roomType: z.string().max(80).optional(),
    sizeSqm: z.number().gt(0).lte(500).optional(),
    maxOccupancy: z.number().int().gte(1).lte(20),
    monthlyPriceKrw: z.number().int().gte(100000),
    availableFrom: calendarDateSchema.optional(),
  })
  .strict();
export type CreateRoomRequest = z.infer<typeof createRoomRequestSchema>;

export const createdIdSchema = z.object({ id: uuidSchema }).strict();
export type CreatedId = z.infer<typeof createdIdSchema>;

export const hostBookingSchema = z
  .object({
    id: uuidSchema,
    status: bookingStatusSchema,
    bookingType: bookingTypeSchema,
    checkIn: calendarDateSchema,
    checkOut: calendarDateSchema,
    guestCount: z.number().int().gte(1),
    customerNotes: z.union([z.string(), z.null()]),
    propertyTitle: z.string(),
    roomName: z.string(),
    totalKrw: z.number().int().gte(0),
    createdAt: dateTimeSchema,
  })
  .strict();
export type HostBooking = z.infer<typeof hostBookingSchema>;

export const hostPropertyListItemSchema = z
  .object({
    id: uuidSchema,
    title: z.string(),
    slug: z.string(),
    propertyType: accommodationTypeSchema,
    district: z.string(),
    status: propertyStatusSchema,
    bookingMode: bookingModeSchema,
    monthlyPriceMin: z.union([z.number().int(), z.null()]),
    roomCount: z.number().int().gte(0),
    updatedAt: dateTimeSchema,
  })
  .strict();
export type HostPropertyListItem = z.infer<typeof hostPropertyListItemSchema>;

export const hostPropertyRequestSchema = z
  .object({
    title: z.string().min(1).max(160),
    description: z.string().min(20).max(5000),
    propertyType: accommodationTypeSchema,
    addressLine1: z.string().min(1).max(200),
    addressLine2: z.string().max(200).optional(),
    city: z.string().min(1).max(80),
    postalCode: z.string().max(20).optional(),
    district: z.string().min(1).max(80),
    nearestStationName: z.string().max(120).optional(),
    nearestStationWalkMin: z.number().int().gte(1).lte(120).optional(),
    bookingMode: bookingModeSchema,
    minStayNights: z.number().int().gte(1).lte(365),
    tags: z.array(z.string().max(40)).max(20).optional(),
    amenityIds: z.array(uuidSchema).max(20).default([]),
    latitude: z.number().gte(-90).lte(90).optional(),
    longitude: z.number().gte(-180).lte(180).optional(),
  })
  .strict();
export type HostPropertyRequest = z.infer<typeof hostPropertyRequestSchema>;

export const nullableDateSchema = z.union([calendarDateSchema, z.null()]);
export type NullableDate = z.infer<typeof nullableDateSchema>;

export const nullableDateTimeSchema = z.union([dateTimeSchema, z.null()]);
export type NullableDateTime = z.infer<typeof nullableDateTimeSchema>;

export const profileSchema = z
  .object({
    id: uuidSchema,
    role: userRoleSchema,
    fullName: z.string(),
    phone: z.union([z.string(), z.null()]),
    avatarUrl: z.union([z.string(), z.null()]),
    preferredLanguage: z.string(),
    marketingConsent: z.boolean(),
    createdAt: dateTimeSchema,
    updatedAt: dateTimeSchema,
  })
  .strict();
export type Profile = z.infer<typeof profileSchema>;

export const propertyAmenitySchema = z
  .object({
    id: uuidSchema,
    slug: z.string(),
    name: z.string(),
    icon: z.union([z.string(), z.null()]),
  })
  .strict();
export type PropertyAmenity = z.infer<typeof propertyAmenitySchema>;

export const propertyCardSchema = z
  .object({
    id: uuidSchema,
    title: z.string(),
    slug: z.string(),
    propertyType: accommodationTypeSchema,
    district: z.string(),
    nearestStationName: z.union([z.string(), z.null()]),
    monthlyPriceMin: z.number().int().gte(0),
    coverImageUrl: z.union([z.string(), z.null()]),
    coverImageAlt: z.union([z.string(), z.null()]),
    tags: z.array(z.string()),
  })
  .strict();
export type PropertyCard = z.infer<typeof propertyCardSchema>;

export const propertyImageSchema = z
  .object({
    id: uuidSchema,
    storagePath: z.string(),
    url: z.string(),
    altText: z.union([z.string(), z.null()]),
    sortOrder: z.number().int(),
    isCover: z.boolean(),
  })
  .strict();
export type PropertyImage = z.infer<typeof propertyImageSchema>;

export const propertySearchQuerySchema = z
  .object({
    query: z.string().max(120).optional(),
    propertyType: accommodationTypeSchema.optional(),
    checkIn: calendarDateSchema.optional(),
    checkOut: calendarDateSchema.optional(),
    guests: z.number().int().gte(1).lte(20).optional(),
    priceMin: z.number().int().gte(0).optional(),
    priceMax: z.number().int().gte(0).optional(),
    sort: propertySearchSortSchema.optional(),
    centerLat: z.number().gte(-90).lte(90).optional(),
    centerLng: z.number().gte(-180).lte(180).optional(),
    north: z.number().gte(-90).lte(90).optional(),
    south: z.number().gte(-90).lte(90).optional(),
    east: z.number().gte(-180).lte(180).optional(),
    west: z.number().gte(-180).lte(180).optional(),
    amenitySlugs: z.array(z.string()).optional(),
    maxStationWalkMin: z.number().int().gte(1).lte(120).optional(),
    excludePropertyIds: z.array(uuidSchema).optional(),
  })
  .strict()
  .describe(
    'Check-out must be after check-in, and priceMax must be greater than or equal to priceMin.',
  );
export type PropertySearchQuery = z.infer<typeof propertySearchQuerySchema>;

export const propertyStatusChangeSchema = z
  .object({ id: uuidSchema, status: propertyStatusSchema })
  .strict();
export type PropertyStatusChange = z.infer<typeof propertyStatusChangeSchema>;

export const tossWebhookPayloadSchema = z
  .object({
    eventType: z.string().optional(),
    createdAt: dateTimeSchema.optional(),
    data: jsonObjectSchema.optional(),
  })
  .catchall(z.any());
export type TossWebhookPayload = z.infer<typeof tossWebhookPayloadSchema>;

export const updateHousingRequestStatusRequestSchema = z
  .object({ status: housingRequestStatusSchema })
  .strict();
export type UpdateHousingRequestStatusRequest = z.infer<
  typeof updateHousingRequestStatusRequestSchema
>;

export const adminHostSchema = z
  .object({
    id: uuidSchema,
    displayName: z.string(),
    status: hostStatusSchema,
    profileName: z.string(),
    verifiedAt: nullableDateTimeSchema,
    createdAt: dateTimeSchema,
  })
  .strict();
export type AdminHost = z.infer<typeof adminHostSchema>;

export const adminPaymentSchema = z
  .object({
    id: uuidSchema,
    orderId: uuidSchema,
    bookingId: uuidSchema,
    amountKrw: z.number().int().gte(0),
    status: paymentStatusSchema,
    propertyTitle: z.union([z.string(), z.null()]),
    customerName: z.union([z.string(), z.null()]),
    confirmedAt: nullableDateTimeSchema,
    createdAt: dateTimeSchema,
  })
  .strict();
export type AdminPayment = z.infer<typeof adminPaymentSchema>;

export const adminPropertySchema = z
  .object({
    id: uuidSchema,
    title: z.string(),
    slug: z.string(),
    propertyType: accommodationTypeSchema,
    district: z.string(),
    status: propertyStatusSchema,
    bookingMode: bookingModeSchema,
    monthlyPriceMin: z.union([z.number().int(), z.null()]),
    roomCount: z.number().int().gte(0),
    updatedAt: dateTimeSchema,
    hostDisplayName: z.string(),
  })
  .strict();
export type AdminProperty = z.infer<typeof adminPropertySchema>;

export const amenityListSchema = z.array(amenitySchema);
export type AmenityList = z.infer<typeof amenityListSchema>;

export const apiErrorResponseSchema = z.object({ error: apiErrorSchema }).strict();
export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>;

export const auditLogListSchema = z.array(auditLogSchema);
export type AuditLogList = z.infer<typeof auditLogListSchema>;

export const bookingSchema = z
  .object({
    id: uuidSchema,
    customerId: uuidSchema,
    roomId: uuidSchema,
    propertyId: uuidSchema,
    checkIn: calendarDateSchema,
    checkOut: calendarDateSchema,
    guestCount: z.number().int().gte(1),
    status: bookingStatusSchema,
    bookingType: bookingTypeSchema,
    holdExpiresAt: nullableDateTimeSchema,
    customerNotes: z.union([z.string(), z.null()]),
    approvedAt: nullableDateTimeSchema,
    approvedBy: z.union([uuidSchema, z.null()]),
    cancelledAt: nullableDateTimeSchema,
    paymentRetryCount: z.number().int().gte(0),
    createdAt: dateTimeSchema,
    updatedAt: dateTimeSchema,
  })
  .strict();
export type Booking = z.infer<typeof bookingSchema>;

export const bookingListItemSchema = z
  .object({
    id: uuidSchema,
    status: bookingStatusSchema,
    bookingType: bookingTypeSchema,
    checkIn: calendarDateSchema,
    checkOut: calendarDateSchema,
    guestCount: z.number().int().gte(1),
    propertyTitle: z.string(),
    district: z.string(),
    roomName: z.string(),
    totalKrw: z.number().int().gte(0),
    holdExpiresAt: nullableDateTimeSchema,
    createdAt: dateTimeSchema,
  })
  .strict();
export type BookingListItem = z.infer<typeof bookingListItemSchema>;

export const hostSchema = z
  .object({
    id: uuidSchema,
    profileId: uuidSchema,
    displayName: z.string(),
    status: hostStatusSchema,
    verifiedAt: nullableDateTimeSchema,
    createdAt: dateTimeSchema,
    updatedAt: dateTimeSchema,
  })
  .strict();
export type Host = z.infer<typeof hostSchema>;

export const hostBookingListSchema = z.array(hostBookingSchema);
export type HostBookingList = z.infer<typeof hostBookingListSchema>;

export const hostPropertyListSchema = z.array(hostPropertyListItemSchema);
export type HostPropertyList = z.infer<typeof hostPropertyListSchema>;

export const hostRoomSchema = z
  .object({
    id: uuidSchema,
    name: z.string(),
    roomType: z.union([z.string(), z.null()]),
    sizeSqm: z.union([z.number(), z.null()]),
    maxOccupancy: z.number().int().gte(1),
    monthlyPriceKrw: z.number().int().gte(0),
    status: roomStatusSchema,
    availableFrom: nullableDateSchema,
  })
  .strict();
export type HostRoom = z.infer<typeof hostRoomSchema>;

export const housingRequestSchema = z
  .object({
    id: uuidSchema,
    email: z.string().email(),
    desiredArea: z.string(),
    checkIn: nullableDateSchema,
    checkOut: nullableDateSchema,
    budgetMax: z.union([z.number().int(), z.null()]),
    accommodationType: z.union([accommodationTypeSchema, z.null()]),
    notes: z.union([z.string(), z.null()]),
    status: housingRequestStatusSchema,
    createdAt: dateTimeSchema,
  })
  .strict();
export type HousingRequest = z.infer<typeof housingRequestSchema>;

export const notificationSchema = z
  .object({
    id: uuidSchema,
    userId: uuidSchema,
    type: notificationTypeSchema,
    title: z.string(),
    body: z.string(),
    metadata: jsonObjectSchema,
    readAt: nullableDateTimeSchema,
    createdAt: dateTimeSchema,
  })
  .strict();
export type Notification = z.infer<typeof notificationSchema>;

export const propertyRoomSchema = z
  .object({
    id: uuidSchema,
    name: z.string(),
    roomType: z.union([z.string(), z.null()]),
    sizeSqm: z.union([z.number(), z.null()]),
    maxOccupancy: z.number().int().gte(1),
    monthlyPriceKrw: z.number().int().gte(0),
    status: roomStatusSchema,
    availableFrom: nullableDateSchema,
  })
  .strict();
export type PropertyRoom = z.infer<typeof propertyRoomSchema>;

export const searchPropertyCardSchema = z
  .object({
    id: uuidSchema,
    title: z.string(),
    slug: z.string(),
    propertyType: accommodationTypeSchema,
    district: z.string(),
    nearestStationName: z.union([z.string(), z.null()]),
    monthlyPriceMin: z.number().int().gte(0),
    coverImageUrl: z.union([z.string(), z.null()]),
    coverImageAlt: z.union([z.string(), z.null()]),
    tags: z.array(z.string()),
    latitude: z.number(),
    longitude: z.number(),
    distanceMeters: z.union([z.number(), z.null()]),
  })
  .strict();
export type SearchPropertyCard = z.infer<typeof searchPropertyCardSchema>;

export const adminHostListSchema = z.array(adminHostSchema);
export type AdminHostList = z.infer<typeof adminHostListSchema>;

export const adminPaymentListSchema = z.array(adminPaymentSchema);
export type AdminPaymentList = z.infer<typeof adminPaymentListSchema>;

export const adminPropertyListSchema = z.array(adminPropertySchema);
export type AdminPropertyList = z.infer<typeof adminPropertyListSchema>;

export const bookingDetailSchema = z
  .object({
    id: uuidSchema,
    status: bookingStatusSchema,
    bookingType: bookingTypeSchema,
    checkIn: calendarDateSchema,
    checkOut: calendarDateSchema,
    guestCount: z.number().int().gte(1),
    propertyTitle: z.string(),
    district: z.string(),
    roomName: z.string(),
    totalKrw: z.number().int().gte(0),
    holdExpiresAt: nullableDateTimeSchema,
    createdAt: dateTimeSchema,
    customerNotes: z.union([z.string(), z.null()]),
    rentKrw: z.number().int().gte(0),
    serviceFeeKrw: z.number().int().gte(0),
    serviceFeePercent: z.number().gte(0),
    pricingVersion: z.string(),
    propertyId: uuidSchema,
    roomId: uuidSchema,
  })
  .strict();
export type BookingDetail = z.infer<typeof bookingDetailSchema>;

export const bookingListSchema = z.array(bookingListItemSchema);
export type BookingList = z.infer<typeof bookingListSchema>;

export const hostPropertyDetailSchema = z
  .object({
    id: uuidSchema,
    title: z.string(),
    slug: z.string(),
    description: z.string(),
    propertyType: accommodationTypeSchema,
    addressLine1: z.string(),
    addressLine2: z.union([z.string(), z.null()]),
    city: z.string(),
    postalCode: z.union([z.string(), z.null()]),
    district: z.string(),
    nearestStationName: z.union([z.string(), z.null()]),
    nearestStationWalkMin: z.union([z.number().int(), z.null()]),
    status: propertyStatusSchema,
    bookingMode: bookingModeSchema,
    minStayNights: z.number().int().gte(1),
    tags: z.array(z.string()),
    latitude: z.union([z.number(), z.null()]),
    longitude: z.union([z.number(), z.null()]),
    amenityIds: z.array(uuidSchema),
    rooms: z.array(hostRoomSchema),
  })
  .strict();
export type HostPropertyDetail = z.infer<typeof hostPropertyDetailSchema>;

export const housingRequestListSchema = z.array(housingRequestSchema);
export type HousingRequestList = z.infer<typeof housingRequestListSchema>;

export const notificationListSchema = z.array(notificationSchema);
export type NotificationList = z.infer<typeof notificationListSchema>;

export const nullableHostSchema = z.union([hostSchema, z.null()]);
export type NullableHost = z.infer<typeof nullableHostSchema>;

export const propertyDetailSchema = z
  .object({
    id: uuidSchema,
    title: z.string(),
    slug: z.string(),
    description: z.string(),
    propertyType: accommodationTypeSchema,
    district: z.string(),
    nearestStationName: z.union([z.string(), z.null()]),
    nearestStationWalkMin: z.union([z.number().int(), z.null()]),
    addressLine1: z.string(),
    addressLine2: z.union([z.string(), z.null()]),
    city: z.string(),
    bookingMode: bookingModeSchema,
    minStayNights: z.number().int().gte(1),
    monthlyPriceMin: z.number().int().gte(0),
    tags: z.array(z.string()),
    hostDisplayName: z.string(),
    latitude: z.union([z.number(), z.null()]),
    longitude: z.union([z.number(), z.null()]),
    images: z.array(propertyImageSchema),
    rooms: z.array(propertyRoomSchema),
    amenities: z.array(propertyAmenitySchema),
  })
  .strict();
export type PropertyDetail = z.infer<typeof propertyDetailSchema>;

export const propertySearchResultSchema = z
  .object({ items: z.array(searchPropertyCardSchema), totalCount: z.number().int().gte(0) })
  .strict();
export type PropertySearchResult = z.infer<typeof propertySearchResultSchema>;
