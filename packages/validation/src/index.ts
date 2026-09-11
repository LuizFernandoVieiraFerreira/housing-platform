import { z } from 'zod';

export const emailSchema = z.string().trim().email('Enter a valid email address');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters');

export const signUpSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    fullName: z.string().trim().min(1, 'Full name is required').max(120),
    marketingConsent: z.boolean().default(false),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const profileUpdateSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required').max(120),
  phone: z.string().trim().max(30, 'Phone number is too long').optional().or(z.literal('')),
  preferredLanguage: z.string().trim().min(2, 'Language is required').max(10),
  marketingConsent: z.boolean(),
  avatarUrl: z.string().url('Enter a valid URL').optional().or(z.literal('')),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

const accommodationTypeValues = [
  'share-house',
  'studio',
  'micro-studio',
  'multi-bedroom',
] as const;

export const accommodationTypeSchema = z.enum(accommodationTypeValues);

export const propertySearchSortSchema = z.enum([
  'recommended',
  'price_asc',
  'price_desc',
  'distance',
  'semantic',
]);

const optionalDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format')
  .optional()
  .or(z.literal(''));

export const propertySearchFiltersSchema = z
  .object({
    query: z.string().trim().max(120).optional().or(z.literal('')),
    propertyType: accommodationTypeSchema.optional().or(z.literal('')),
    checkIn: optionalDateSchema,
    checkOut: optionalDateSchema,
    guests: z.coerce.number().int().min(1).max(20).optional(),
    priceMin: z.coerce.number().int().min(0).optional(),
    priceMax: z.coerce.number().int().min(0).optional(),
    sort: propertySearchSortSchema.optional(),
    centerLat: z.coerce.number().min(-90).max(90).optional(),
    centerLng: z.coerce.number().min(-180).max(180).optional(),
    north: z.coerce.number().min(-90).max(90).optional(),
    south: z.coerce.number().min(-90).max(90).optional(),
    east: z.coerce.number().min(-180).max(180).optional(),
    west: z.coerce.number().min(-180).max(180).optional(),
  })
  .refine(
    (data) => {
      if (!data.checkIn || !data.checkOut) {
        return true;
      }

      return data.checkOut > data.checkIn;
    },
    {
      message: 'Check-out must be after check-in',
      path: ['checkOut'],
    },
  )
  .refine(
    (data) => {
      if (data.priceMin == null || data.priceMax == null) {
        return true;
      }

      return data.priceMax >= data.priceMin;
    },
    {
      message: 'Maximum price must be greater than minimum price',
      path: ['priceMax'],
    },
  );

export type PropertySearchFiltersInput = z.infer<typeof propertySearchFiltersSchema>;

export const aiPropertySearchRequestSchema = z
  .object({
    query: z.string().trim().max(500).optional().or(z.literal('')),
    referencePropertyId: z.string().uuid().optional().or(z.literal('')),
    context: z
      .object({
        checkIn: optionalDateSchema,
        checkOut: optionalDateSchema,
        guests: z.coerce.number().int().min(1).max(20).optional(),
        mapCenterLat: z.coerce.number().min(-90).max(90).optional(),
        mapCenterLng: z.coerce.number().min(-180).max(180).optional(),
      })
      .optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
  })
  .refine((data) => Boolean(data.query?.trim()) || Boolean(data.referencePropertyId), {
    message: 'Provide a search query or reference property',
    path: ['query'],
  });

export type AiPropertySearchRequestInput = z.infer<typeof aiPropertySearchRequestSchema>;

const bookingDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format');

const bookingInputBaseSchema = z.object({
  roomId: z.string().uuid('Select a room'),
  checkIn: bookingDateSchema,
  checkOut: bookingDateSchema,
  guestCount: z.coerce.number().int().min(1, 'At least 1 guest').max(20),
});

const bookingDateRangeRefinement = (data: { checkIn: string; checkOut: string }) =>
  data.checkOut > data.checkIn;

export const quoteBookingSchema = bookingInputBaseSchema.refine(bookingDateRangeRefinement, {
  message: 'Check-out must be after check-in',
  path: ['checkOut'],
});

export const createBookingHoldSchema = bookingInputBaseSchema
  .extend({
    customerNotes: z.string().trim().max(500).optional().or(z.literal('')),
  })
  .refine(bookingDateRangeRefinement, {
    message: 'Check-out must be after check-in',
    path: ['checkOut'],
  });

export type QuoteBookingInput = z.infer<typeof quoteBookingSchema>;
export type CreateBookingHoldInput = z.infer<typeof createBookingHoldSchema>;

export const createPaymentSchema = z.object({
  bookingId: z.string().uuid('Booking ID is required'),
});

export const confirmPaymentSchema = z.object({
  paymentKey: z.string().min(1, 'Payment key is required'),
  orderId: z.string().uuid('Order ID is required'),
  amount: z.coerce.number().int().positive('Amount must be positive'),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type ConfirmPaymentInput = z.infer<typeof confirmPaymentSchema>;

export const hostRegisterSchema = z.object({
  displayName: z.string().trim().min(1, 'Display name is required').max(120),
});

export const hostPropertySchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(160),
  description: z.string().trim().min(20, 'Description must be at least 20 characters').max(5000),
  propertyType: accommodationTypeSchema,
  addressLine1: z.string().trim().min(1, 'Address is required').max(200),
  addressLine2: z.string().trim().max(200).optional().or(z.literal('')),
  city: z.string().trim().min(1, 'City is required').max(80),
  postalCode: z.string().trim().max(20).optional().or(z.literal('')),
  district: z.string().trim().min(1, 'District is required').max(80),
  nearestStationName: z.string().trim().max(120).optional().or(z.literal('')),
  nearestStationWalkMin: z.coerce.number().int().min(1).max(120).optional().or(z.literal('')),
  bookingMode: z.enum(['instant', 'request']),
  minStayNights: z.coerce.number().int().min(1).max(365),
  tags: z.string().trim().max(200).optional().or(z.literal('')),
  amenityIds: z.array(z.string().uuid()).max(20).default([]),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
});

export const hostRoomSchema = z.object({
  name: z.string().trim().min(1, 'Room name is required').max(120),
  roomType: z.string().trim().max(80).optional().or(z.literal('')),
  sizeSqm: z.coerce.number().positive().max(500).optional().or(z.literal('')),
  maxOccupancy: z.coerce.number().int().min(1).max(20),
  monthlyPriceKrw: z.coerce.number().int().min(100000, 'Minimum price is ₩100,000'),
  availableFrom: optionalDateSchema,
});

export type HostRegisterInput = z.infer<typeof hostRegisterSchema>;
export type HostPropertyInput = z.infer<typeof hostPropertySchema>;
export type HostRoomInput = z.infer<typeof hostRoomSchema>;
