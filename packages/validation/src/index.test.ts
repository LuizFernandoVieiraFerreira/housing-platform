import { describe, expect, it } from 'vitest';

import {
  createPaymentSchema,
  loginSchema,
  profileUpdateSchema,
  propertySearchFiltersSchema,
  quoteBookingSchema,
  resetPasswordSchema,
  signUpSchema,
} from './index';

describe('signUpSchema', () => {
  it('accepts valid input', () => {
    const result = signUpSchema.safeParse({
      email: 'guest@example.com',
      password: 'password123',
      confirmPassword: 'password123',
      fullName: 'Guest User',
      marketingConsent: false,
    });

    expect(result.success).toBe(true);
  });

  it('rejects mismatched passwords', () => {
    const result = signUpSchema.safeParse({
      email: 'guest@example.com',
      password: 'password123',
      confirmPassword: 'different',
      fullName: 'Guest User',
      marketingConsent: false,
    });

    expect(result.success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('requires email and password', () => {
    expect(loginSchema.safeParse({ email: '', password: '' }).success).toBe(false);
    expect(loginSchema.safeParse({ email: 'guest@example.com', password: 'secret' }).success).toBe(
      true,
    );
  });
});

describe('resetPasswordSchema', () => {
  it('requires matching passwords', () => {
    expect(
      resetPasswordSchema.safeParse({
        password: 'password123',
        confirmPassword: 'password123',
      }).success,
    ).toBe(true);
  });
});

describe('profileUpdateSchema', () => {
  it('accepts optional empty phone and avatar URL', () => {
    expect(
      profileUpdateSchema.safeParse({
        fullName: 'Guest User',
        phone: '',
        preferredLanguage: 'en',
        marketingConsent: true,
        avatarUrl: '',
      }).success,
    ).toBe(true);
  });
});

describe('quoteBookingSchema', () => {
  it('accepts valid booking inputs', () => {
    expect(
      quoteBookingSchema.safeParse({
        roomId: '44444444-4444-4444-8444-444444444401',
        checkIn: '2026-09-01',
        checkOut: '2026-10-01',
        guestCount: 1,
      }).success,
    ).toBe(true);
  });
});

describe('createPaymentSchema', () => {
  it('accepts a booking id', () => {
    expect(
      createPaymentSchema.safeParse({
        bookingId: '44444444-4444-4444-8444-444444444401',
      }).success,
    ).toBe(true);
  });
});

describe('propertySearchFiltersSchema', () => {
  it('accepts valid search filters', () => {
    expect(
      propertySearchFiltersSchema.safeParse({
        query: 'Hongdae',
        propertyType: 'studio',
        checkIn: '2026-09-01',
        checkOut: '2026-10-01',
        guests: 2,
        priceMin: 500000,
        priceMax: 1200000,
        sort: 'price_asc',
      }).success,
    ).toBe(true);
  });

  it('rejects check-out before check-in', () => {
    expect(
      propertySearchFiltersSchema.safeParse({
        checkIn: '2026-10-01',
        checkOut: '2026-09-01',
      }).success,
    ).toBe(false);
  });
});
