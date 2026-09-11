#!/usr/bin/env node
/**
 * Generates supabase/seed/catalog_properties.sql from a deterministic property catalog.
 * Re-run: node supabase/seed/generate-catalog.mjs
 */

import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const HOST_1 = '33333333-3333-4333-8333-333333333301';
const HOST_2 = '33333333-3333-4333-8333-333333333302';

const AMENITIES = {
  wifi: '11111111-1111-4111-8111-111111111101',
  desk: '11111111-1111-4111-8111-111111111102',
  ac: '11111111-1111-4111-8111-111111111103',
  washer: '11111111-1111-4111-8111-111111111104',
  kitchen: '11111111-1111-4111-8111-111111111105',
  elevator: '11111111-1111-4111-8111-111111111106',
  parking: '11111111-1111-4111-8111-111111111107',
  balcony: '11111111-1111-4111-8111-111111111108',
  heating: '11111111-1111-4111-8111-111111111109',
};

const UNSPLASH = [
  'photo-1522708323590-d24dbb6b0267',
  'photo-1555854877-bab0e564b8d5',
  'photo-1502672023488-70e25813eb80',
  'photo-1600210492486-724fe5c67fb0',
  'photo-1560448204-e02f11c3d0e2',
  'photo-1586023492125-27b2c045efd7',
  'photo-1493809842364-78817add7ffb',
  'photo-1505693416388-ac5ce068fe85',
  'photo-1512917774080-9991f1c4c750',
  'photo-1564013799919-ab600027ffc6',
];

/** @type {Array<Record<string, unknown>>} */
const catalog = [
  // --- Mapo / Hongdae cluster (studios) ---
  {
    n: 5,
    host: HOST_1,
    title: 'Sunny Hongdae studio under 1.2M',
    slug: 'sunny-hongdae-studio-under-1-2m',
    desc: 'Furnished studio on a quiet side street near Hongik University. Natural light, fast Wi-Fi, and a dedicated desk make it easy to work remotely after class.',
    type: 'studio',
    addr: '8 Yeonnam-ro 5-gil',
    lng: 126.9235,
    lat: 37.5578,
    district: 'Mapo-gu',
    station: 'Hongik Univ. Station',
    walk: 5,
    mode: 'instant',
    minStay: 30,
    featured: true,
    tags: ['#Hongdae', '#RemoteWork', '#NoDeposit'],
    rooms: [{ name: 'Studio', price: 950000, sqm: 17.0, occ: 1, avail: null }],
    amenities: ['wifi', 'desk', 'ac', 'heating'],
  },
  {
    n: 6,
    host: HOST_1,
    title: 'Premium Hongdae loft studio',
    slug: 'premium-hongdae-loft-studio',
    desc: 'Stylish loft studio steps from Hongdae nightlife. Great for exchange students who want cafes and live music, with subway access in under ten minutes.',
    type: 'studio',
    addr: '22 Wausan-ro 21-gil',
    lng: 126.9208,
    lat: 37.5549,
    district: 'Mapo-gu',
    station: 'Sangsu Station',
    walk: 8,
    mode: 'instant',
    minStay: 30,
    featured: false,
    tags: ['#Hongdae', '#Nightlife', '#Exchange'],
    rooms: [{ name: 'Loft studio', price: 1150000, sqm: 20.0, occ: 1, avail: null }],
    amenities: ['wifi', 'ac', 'kitchen', 'balcony'],
  },
  {
    n: 7,
    host: HOST_1,
    title: 'Compact studio by Mangwon Market',
    slug: 'compact-studio-by-mangwon-market',
    desc: 'Affordable studio near Mangwon Market with laundry in-unit. Ideal for budget-conscious stays with local food options and a calm residential feel.',
    type: 'studio',
    addr: '14 Poeun-ro 8-gil',
    lng: 126.9102,
    lat: 37.5555,
    district: 'Mapo-gu',
    station: 'Mangwon Station',
    walk: 6,
    mode: 'request',
    minStay: 60,
    featured: false,
    tags: ['#Budget', '#LowDeposit'],
    rooms: [{ name: 'Market studio', price: 780000, sqm: 14.5, occ: 1, avail: 'current_date + 14' }],
    amenities: ['wifi', 'washer', 'heating'],
  },
  // --- Gangnam cluster ---
  {
    n: 8,
    host: HOST_1,
    title: 'Budget room in Gangnam share-house',
    slug: 'budget-room-gangnam-share-house',
    desc: 'Private lockable room in a friendly share-house south of Gangnam Station. Shared kitchen and rooftop; perfect if you want a cheap base in Gangnam.',
    type: 'share-house',
    addr: '12 Teheran-ro 4-gil',
    lng: 127.0312,
    lat: 37.4955,
    district: 'Gangnam-gu',
    station: 'Gangnam Station',
    walk: 9,
    mode: 'request',
    minStay: 30,
    featured: true,
    tags: ['#Gangnam', '#Budget', '#Social'],
    rooms: [
      { name: 'Room 101', price: 520000, sqm: 10.5, occ: 1, avail: null },
      { name: 'Room 102', price: 540000, sqm: 11.0, occ: 1, avail: null },
      { name: 'Room 103', price: 580000, sqm: 12.0, occ: 1, avail: 'current_date + 21' },
    ],
    amenities: ['wifi', 'kitchen', 'elevator'],
  },
  {
    n: 9,
    host: HOST_1,
    title: 'Gangnam studio with city views',
    slug: 'gangnam-studio-city-views',
    desc: 'Modern studio tower near Gangnam with elevator access and parking. Monthly rent reflects the prime location; best for professionals on longer contracts.',
    type: 'studio',
    addr: '521 Teheran-ro',
    lng: 127.0395,
    lat: 37.5048,
    district: 'Gangnam-gu',
    station: 'Yeoksam Station',
    walk: 4,
    mode: 'instant',
    minStay: 90,
    featured: false,
    tags: ['#Gangnam'],
    rooms: [{ name: 'City view studio', price: 1400000, sqm: 22.0, occ: 1, avail: null }],
    amenities: ['wifi', 'ac', 'elevator', 'parking', 'kitchen'],
  },
  {
    n: 10,
    host: HOST_1,
    title: 'Sinnonhyeon share-house for interns',
    slug: 'sinnonhyeon-share-house-interns',
    desc: 'Clean share-house near Sinnonhyeon with fast Wi-Fi and a shared kitchen. Popular with interns working in Gangnam offices.',
    type: 'share-house',
    addr: '7 Nonhyeon-ro 151-gil',
    lng: 127.0255,
    lat: 37.5042,
    district: 'Gangnam-gu',
    station: 'Sinnonhyeon Station',
    walk: 5,
    mode: 'request',
    minStay: 30,
    featured: false,
    tags: ['#Gangnam', '#RemoteWork'],
    rooms: [
      { name: 'Private room A', price: 620000, sqm: 11.5, occ: 1, avail: null },
      { name: 'Private room B', price: 650000, sqm: 12.0, occ: 1, avail: null },
    ],
    amenities: ['wifi', 'desk', 'kitchen'],
  },
  // --- Gwanak / student ---
  {
    n: 11,
    host: HOST_1,
    title: 'Ultra-budget micro studio near SNU',
    slug: 'ultra-budget-micro-studio-near-snu',
    desc: 'Tiny but functional micro studio walking distance to Seoul National University. Desk, Wi-Fi, and low key money—built for students on a tight budget.',
    type: 'micro-studio',
    addr: '62 Gwanak-ro 1-gil',
    lng: 126.951,
    lat: 37.461,
    district: 'Gwanak-gu',
    station: 'Seoul National Univ. Station',
    walk: 12,
    mode: 'instant',
    minStay: 30,
    featured: true,
    tags: ['#SNU', '#Student', '#Budget', '#LowDeposit'],
    rooms: [{ name: 'Micro unit', price: 480000, sqm: 8.0, occ: 1, avail: null }],
    amenities: ['wifi', 'desk', 'heating'],
  },
  {
    n: 12,
    host: HOST_1,
    title: 'Quiet Gwanak studio for researchers',
    slug: 'quiet-gwanak-studio-researchers',
    desc: 'Serene studio on a hillside lane near SNU. Double-glazed windows and a proper desk—excellent for researchers who need quiet focus time.',
    type: 'studio',
    addr: '15 Gwanak-ro 14-gil',
    lng: 126.958,
    lat: 37.456,
    district: 'Gwanak-gu',
    station: 'Nakseongdae Station',
    walk: 8,
    mode: 'request',
    minStay: 60,
    featured: false,
    tags: ['#SNU', '#Quiet', '#RemoteWork'],
    rooms: [{ name: 'Research studio', price: 820000, sqm: 16.0, occ: 1, avail: null }],
    amenities: ['wifi', 'desk', 'ac', 'washer'],
  },
  // --- Songpa / Jamsil ---
  {
    n: 13,
    host: HOST_1,
    title: 'Jamsil lakeside multi-bedroom',
    slug: 'jamsil-lakeside-multi-bedroom',
    desc: 'Spacious two-bedroom flat near Seokchon Lake. Washing machine, full kitchen, and family-friendly layout for semester-long stays.',
    type: 'multi-bedroom',
    addr: '88 Songpa-daero',
    lng: 127.078,
    lat: 37.512,
    district: 'Songpa-gu',
    station: 'Jamsil Station',
    walk: 7,
    mode: 'request',
    minStay: 90,
    featured: false,
    tags: ['#Family', '#Jamsil'],
    rooms: [
      { name: 'Primary bedroom', price: 1050000, sqm: 15.0, occ: 2, avail: null },
      { name: 'Guest bedroom', price: 850000, sqm: 12.0, occ: 1, avail: null },
    ],
    amenities: ['wifi', 'washer', 'kitchen', 'elevator'],
  },
  {
    n: 14,
    host: HOST_1,
    title: 'Sports city studio near Jamsil',
    slug: 'sports-city-studio-jamsil',
    desc: 'Bright studio close to Jamsil Sports Complex. Good transit links and a calm building—no nightclub noise on the ground floor.',
    type: 'studio',
    addr: '25 Olympic-ro',
    lng: 127.072,
    lat: 37.515,
    district: 'Songpa-gu',
    station: 'Sports Complex Station',
    walk: 6,
    mode: 'instant',
    minStay: 30,
    featured: false,
    tags: ['#Quiet', '#Jamsil'],
    rooms: [{ name: 'Sports city studio', price: 920000, sqm: 17.5, occ: 1, avail: 'current_date + 7' }],
    amenities: ['wifi', 'ac', 'heating'],
  },
  // --- Yongsan / Itaewon ---
  {
    n: 15,
    host: HOST_1,
    title: 'Lively Itaewon share-house',
    slug: 'lively-itaewon-share-house',
    desc: 'Social share-house in the heart of Itaewon with bars and restaurants downstairs. Expect weekend street noise—great if you love nightlife.',
    type: 'share-house',
    addr: '54 Itaewon-ro',
    lng: 126.994,
    lat: 37.534,
    district: 'Yongsan-gu',
    station: 'Itaewon Station',
    walk: 3,
    mode: 'request',
    minStay: 30,
    featured: false,
    tags: ['#Nightlife', '#Social'],
    rooms: [
      { name: 'Street-facing room', price: 590000, sqm: 10.0, occ: 1, avail: null },
      { name: 'Courtyard room', price: 610000, sqm: 10.5, occ: 1, avail: null },
    ],
    amenities: ['wifi', 'kitchen'],
  },
  {
    n: 16,
    host: HOST_1,
    title: 'Hannam-dong quiet studio',
    slug: 'hannam-dong-quiet-studio',
    desc: 'Refined studio in leafy Hannam-dong with balcony views. Very quiet building popular with remote workers and diplomats on extended stays.',
    type: 'studio',
    addr: '18 Hannam-daero 27-gil',
    lng: 127.001,
    lat: 37.536,
    district: 'Yongsan-gu',
    station: 'Hangangjin Station',
    walk: 10,
    mode: 'instant',
    minStay: 60,
    featured: true,
    tags: ['#Quiet', '#RemoteWork'],
    rooms: [{ name: 'Hannam studio', price: 1280000, sqm: 19.0, occ: 1, avail: null }],
    amenities: ['wifi', 'desk', 'ac', 'balcony', 'parking'],
  },
  // --- Seongdong / Seongsu ---
  {
    n: 17,
    host: HOST_1,
    title: 'Seongsu creative loft share-house',
    slug: 'seongsu-creative-loft-share-house',
    desc: 'Industrial-style share-house in trendy Seongsu with coworking nook and fast fiber. Designers and startup folks love the creative vibe.',
    type: 'share-house',
    addr: '33 Ttukseom-ro',
    lng: 127.056,
    lat: 37.544,
    district: 'Seongdong-gu',
    station: 'Seongsu Station',
    walk: 4,
    mode: 'request',
    minStay: 30,
    featured: true,
    tags: ['#RemoteWork', '#Social'],
    rooms: [
      { name: 'Loft room A', price: 680000, sqm: 12.5, occ: 1, avail: null },
      { name: 'Loft room B', price: 700000, sqm: 13.0, occ: 1, avail: null },
      { name: 'Loft room C', price: 720000, sqm: 13.5, occ: 1, avail: 'current_date + 30' },
    ],
    amenities: ['wifi', 'desk', 'kitchen', 'elevator'],
  },
  {
    n: 18,
    host: HOST_1,
    title: 'Eungbong micro studio',
    slug: 'eungbong-micro-studio',
    desc: 'Affordable micro studio near Eungbong Station with Han River walks nearby. Compact but well heated for winter semesters.',
    type: 'micro-studio',
    addr: '9 Eungbong-ro',
    lng: 127.034,
    lat: 37.549,
    district: 'Seongdong-gu',
    station: 'Eungbong Station',
    walk: 5,
    mode: 'instant',
    minStay: 30,
    featured: false,
    tags: ['#Budget', '#Student'],
    rooms: [{ name: 'River micro', price: 550000, sqm: 9.0, occ: 1, avail: null }],
    amenities: ['wifi', 'heating'],
  },
  // --- Jongno ---
  {
    n: 19,
    host: HOST_1,
    title: 'Insadong heritage studio',
    slug: 'insadong-heritage-studio',
    desc: 'Renovated hanok-style studio in Insadong with modern heating. Cultural district charm with subway three minutes away.',
    type: 'studio',
    addr: '5 Insadong-gil',
    lng: 126.986,
    lat: 37.574,
    district: 'Jongno-gu',
    station: 'Anguk Station',
    walk: 3,
    mode: 'request',
    minStay: 60,
    featured: false,
    tags: ['#Quiet'],
    rooms: [{ name: 'Heritage studio', price: 990000, sqm: 16.5, occ: 1, avail: null }],
    amenities: ['wifi', 'heating', 'washer'],
  },
  {
    n: 20,
    host: HOST_1,
    title: 'Dongdaemun market micro studio',
    slug: 'dongdaemun-market-micro-studio',
    desc: 'Micro studio above Dongdaemun wholesale shops. Busy area but good for fashion students; desk and AC included.',
    type: 'micro-studio',
    addr: '281 Eulji-ro',
    lng: 127.009,
    lat: 37.566,
    district: 'Jongno-gu',
    station: 'Dongdaemun Station',
    walk: 4,
    mode: 'instant',
    minStay: 30,
    featured: false,
    tags: ['#Student', '#Budget'],
    rooms: [{ name: 'Market micro', price: 510000, sqm: 8.5, occ: 1, avail: 'current_date + 45' }],
    amenities: ['wifi', 'desk', 'ac'],
  },
  // --- Yeongdeungpo / Yeouido ---
  {
    n: 21,
    host: HOST_1,
    title: 'Yeouido finance district studio',
    slug: 'yeouido-finance-district-studio',
    desc: 'Sleek studio in Yeouido with dedicated desk, dual monitors allowed, and four-minute walk to the subway. Built for finance and tech remote workers.',
    type: 'studio',
    addr: '24 Yeouidaero',
    lng: 126.924,
    lat: 37.521,
    district: 'Yeongdeungpo-gu',
    station: 'Yeouido Station',
    walk: 4,
    mode: 'instant',
    minStay: 30,
    featured: true,
    tags: ['#RemoteWork', '#NoDeposit'],
    rooms: [{ name: 'Finance studio', price: 1080000, sqm: 18.0, occ: 1, avail: null }],
    amenities: ['wifi', 'desk', 'ac', 'elevator'],
  },
  {
    n: 22,
    host: HOST_1,
    title: 'Yeouido park-view multi-bedroom',
    slug: 'yeouido-park-view-multi-bedroom',
    desc: 'Two-bedroom flat overlooking Yeouido Park. Full kitchen, washer, and elevator—suited for couples on three-month assignments.',
    type: 'multi-bedroom',
    addr: '8 Yeouigongwon-ro',
    lng: 126.919,
    lat: 37.526,
    district: 'Yeongdeungpo-gu',
    station: 'Yeouinaru Station',
    walk: 8,
    mode: 'request',
    minStay: 90,
    featured: false,
    tags: ['#Family', '#RemoteWork'],
    rooms: [
      { name: 'Park view primary', price: 1200000, sqm: 14.5, occ: 2, avail: null },
      { name: 'Park view secondary', price: 950000, sqm: 11.0, occ: 1, avail: null },
    ],
    amenities: ['wifi', 'desk', 'washer', 'kitchen', 'elevator'],
  },
  // --- Seodaemun / Sinchon ---
  {
    n: 23,
    host: HOST_1,
    title: 'Sinchon student share-house',
    slug: 'sinchon-student-share-house',
    desc: 'Classic student share-house near Yonsei and Ewha. Shared kitchen, affordable rooms, and a ten-minute walk to Sinchon Station.',
    type: 'share-house',
    addr: '17 Yonsei-ro',
    lng: 126.937,
    lat: 37.558,
    district: 'Seodaemun-gu',
    station: 'Sinchon Station',
    walk: 10,
    mode: 'request',
    minStay: 30,
    featured: false,
    tags: ['#Student', '#Budget'],
    rooms: [
      { name: 'Room A', price: 500000, sqm: 10.0, occ: 1, avail: null },
      { name: 'Room B', price: 520000, sqm: 10.5, occ: 1, avail: null },
      { name: 'Room C', price: 530000, sqm: 10.5, occ: 1, avail: null },
      { name: 'Room D', price: 560000, sqm: 11.0, occ: 1, avail: 'current_date + 10' },
    ],
    amenities: ['wifi', 'kitchen', 'heating'],
  },
  {
    n: 24,
    host: HOST_1,
    title: 'Sinchon micro studio for exchange',
    slug: 'sinchon-micro-studio-exchange',
    desc: 'Furnished micro studio popular with exchange students. Campus shuttles nearby; low deposit and utilities included in rent.',
    type: 'micro-studio',
    addr: '42 Baekbeom-ro',
    lng: 126.941,
    lat: 37.555,
    district: 'Seodaemun-gu',
    station: 'Sinchon Station',
    walk: 7,
    mode: 'instant',
    minStay: 30,
    featured: false,
    tags: ['#Student', '#Exchange', '#LowDeposit'],
    rooms: [{ name: 'Exchange micro', price: 620000, sqm: 9.5, occ: 1, avail: null }],
    amenities: ['wifi', 'desk', 'ac'],
  },
  // --- Dongdaemun ---
  {
    n: 25,
    host: HOST_1,
    title: 'Cheongnyangni studio near KTX',
    slug: 'cheongnyangni-studio-near-ktx',
    desc: 'Convenient studio next to Cheongnyangni KTX hub. Good for travelers splitting time between Seoul and other cities.',
    type: 'studio',
    addr: '123 Wangsan-ro',
    lng: 127.048,
    lat: 37.58,
    district: 'Dongdaemun-gu',
    station: 'Cheongnyangni Station',
    walk: 5,
    mode: 'instant',
    minStay: 30,
    featured: false,
    tags: ['#Exchange'],
    rooms: [{ name: 'KTX studio', price: 760000, sqm: 15.0, occ: 1, avail: null }],
    amenities: ['wifi', 'heating', 'elevator'],
  },
  {
    n: 26,
    host: HOST_1,
    title: 'Dongdaemun design share-house',
    slug: 'dongdaemun-design-share-house',
    desc: 'Share-house for design students near DDP. Shared studio space downstairs; private rooms upstairs with lockable doors.',
    type: 'share-house',
    addr: '61 Eulji-ro',
    lng: 127.004,
    lat: 37.565,
    district: 'Dongdaemun-gu',
    station: 'Dongdaemun History & Culture Park Station',
    walk: 6,
    mode: 'request',
    minStay: 60,
    featured: false,
    tags: ['#Student', '#Social'],
    rooms: [
      { name: 'Design room 1', price: 570000, sqm: 11.0, occ: 1, avail: null },
      { name: 'Design room 2', price: 590000, sqm: 11.5, occ: 1, avail: null },
    ],
    amenities: ['wifi', 'desk', 'kitchen'],
  },
  // --- Nowon ---
  {
    n: 27,
    host: HOST_1,
    title: 'Nowon family multi-bedroom',
    slug: 'nowon-family-multi-bedroom',
    desc: 'Large three-bedroom apartment in Nowon for families relocating to Seoul. Parking included; quiet residential towers with playground nearby.',
    type: 'multi-bedroom',
    addr: '15 Dongil-ro',
    lng: 127.061,
    lat: 37.655,
    district: 'Nowon-gu',
    station: 'Nowon Station',
    walk: 12,
    mode: 'request',
    minStay: 180,
    featured: false,
    tags: ['#Family', '#Quiet'],
    rooms: [
      { name: 'Master suite', price: 950000, sqm: 16.0, occ: 2, avail: null },
      { name: 'Bedroom 2', price: 750000, sqm: 12.0, occ: 1, avail: null },
      { name: 'Bedroom 3', price: 700000, sqm: 11.0, occ: 1, avail: null },
    ],
    amenities: ['wifi', 'washer', 'kitchen', 'parking', 'elevator', 'heating'],
  },
  {
    n: 28,
    host: HOST_1,
    title: 'Kwangwoon Univ micro studio',
    slug: 'kwangwoon-univ-micro-studio',
    desc: 'Budget micro studio serving Kwangwoon University students. Basic furnishings, strong heating, and a short bus to campus.',
    type: 'micro-studio',
    addr: '20 Wolgye-ro',
    lng: 127.058,
    lat: 37.619,
    district: 'Nowon-gu',
    station: 'Kwangwoon Univ. Station',
    walk: 8,
    mode: 'instant',
    minStay: 30,
    featured: false,
    tags: ['#Student', '#Budget'],
    rooms: [{ name: 'Campus micro', price: 460000, sqm: 7.5, occ: 1, avail: null }],
    amenities: ['wifi', 'heating'],
  },
  // --- Gangbuk ---
  {
    n: 29,
    host: HOST_1,
    title: 'Bukhansan quiet studio',
    slug: 'bukhansan-quiet-studio',
    desc: 'Peaceful studio at the foot of Bukhansan trails. Perfect if you want fresh air and silence after work—far from nightlife districts.',
    type: 'studio',
    addr: '9 Solsa-gil',
    lng: 127.011,
    lat: 37.638,
    district: 'Gangbuk-gu',
    station: 'Suyu Station',
    walk: 11,
    mode: 'request',
    minStay: 60,
    featured: false,
    tags: ['#Quiet', '#RemoteWork'],
    rooms: [{ name: 'Mountain studio', price: 740000, sqm: 16.0, occ: 1, avail: null }],
    amenities: ['wifi', 'desk', 'washer', 'balcony'],
  },
  // --- Host 2 listings ---
  {
    n: 30,
    host: HOST_2,
    title: 'Mapo workstation studio',
    slug: 'mapo-workstation-studio',
    desc: 'Studio optimized for remote work with ergonomic desk, fiber internet, and sound-insulated walls. Five minutes to the subway.',
    type: 'studio',
    addr: '3 Worldcupbuk-ro',
    lng: 126.915,
    lat: 37.568,
    district: 'Mapo-gu',
    station: 'World Cup Stadium Station',
    walk: 5,
    mode: 'instant',
    minStay: 30,
    featured: true,
    tags: ['#RemoteWork', '#NoDeposit'],
    rooms: [{ name: 'Workstation studio', price: 870000, sqm: 17.0, occ: 1, avail: null }],
    amenities: ['wifi', 'desk', 'ac', 'washer'],
  },
  {
    n: 31,
    host: HOST_2,
    title: 'Hapjeong designer studio',
    slug: 'hapjeong-designer-studio',
    desc: 'Design-forward studio in Hapjeong with balcony and AC. Walk to cafes and the Han River; popular with creative remote workers.',
    type: 'studio',
    addr: '44 Yanghwa-ro',
    lng: 126.914,
    lat: 37.549,
    district: 'Mapo-gu',
    station: 'Hapjeong Station',
    walk: 6,
    mode: 'instant',
    minStay: 30,
    featured: false,
    tags: ['#RemoteWork', '#Hongdae'],
    rooms: [{ name: 'Designer studio', price: 1020000, sqm: 18.5, occ: 1, avail: null }],
    amenities: ['wifi', 'desk', 'ac', 'balcony', 'kitchen'],
  },
  {
    n: 32,
    host: HOST_2,
    title: 'Gangnam premium share-house',
    slug: 'gangnam-premium-share-house',
    desc: 'Upscale share-house with elevator and parking near Apgujeong. Private rooms with hotel-like finishes—not a budget option.',
    type: 'share-house',
    addr: '33 Apgujeong-ro',
    lng: 127.028,
    lat: 37.523,
    district: 'Gangnam-gu',
    station: 'Apgujeong Station',
    walk: 7,
    mode: 'request',
    minStay: 90,
    featured: false,
    tags: ['#Gangnam'],
    rooms: [
      { name: 'Premium room A', price: 780000, sqm: 13.0, occ: 1, avail: null },
      { name: 'Premium room B', price: 820000, sqm: 14.0, occ: 1, avail: null },
    ],
    amenities: ['wifi', 'kitchen', 'elevator', 'parking', 'ac'],
  },
  {
    n: 33,
    host: HOST_2,
    title: 'Konkuk Univ student studio',
    slug: 'konkuk-univ-student-studio',
    desc: 'Small studio marketed to Konkuk University students. Affordable rent, desk included, and campus shuttle stop outside.',
    type: 'micro-studio',
    addr: '120 Neungdong-ro',
    lng: 127.071,
    lat: 37.542,
    district: 'Gwangjin-gu',
    station: 'Children\'s Grand Park Station',
    walk: 9,
    mode: 'instant',
    minStay: 30,
    featured: false,
    tags: ['#Student', '#Budget'],
    rooms: [{ name: 'Campus micro', price: 530000, sqm: 9.0, occ: 1, avail: 'current_date + 20' }],
    amenities: ['wifi', 'desk', 'heating'],
  },
  {
    n: 34,
    host: HOST_2,
    title: 'Gwangjin riverside studio',
    slug: 'gwangjin-riverside-studio',
    desc: 'Studio overlooking the Han River with washing machine in-unit. Quiet floor; strong option for three-month remote contracts.',
    type: 'studio',
    addr: '5 Achasan-ro',
    lng: 127.082,
    lat: 37.538,
    district: 'Gwangjin-gu',
    station: 'Guui Station',
    walk: 8,
    mode: 'request',
    minStay: 90,
    featured: false,
    tags: ['#Quiet', '#RemoteWork'],
    rooms: [{ name: 'Riverside studio', price: 890000, sqm: 17.0, occ: 1, avail: null }],
    amenities: ['wifi', 'desk', 'washer', 'ac', 'balcony'],
  },
  {
    n: 35,
    host: HOST_2,
    title: 'Jung-gu business studio',
    slug: 'jung-gu-business-studio',
    desc: 'Central Seoul studio near City Hall for business travelers. Instant booking, elevator building, and 24-hour convenience stores nearby.',
    type: 'studio',
    addr: '2 Sejong-daero',
    lng: 126.975,
    lat: 37.566,
    district: 'Jung-gu',
    station: 'City Hall Station',
    walk: 4,
    mode: 'instant',
    minStay: 30,
    featured: true,
    tags: ['#Exchange', '#NoDeposit'],
    rooms: [{ name: 'Business studio', price: 1150000, sqm: 19.5, occ: 1, avail: null }],
    amenities: ['wifi', 'desk', 'ac', 'elevator'],
  },
  {
    n: 36,
    host: HOST_2,
    title: 'Myeongdong compact studio',
    slug: 'myeongdong-compact-studio',
    desc: 'Compact studio in touristy Myeongdong—expect street noise at night. Great if you want to be in the middle of everything.',
    type: 'studio',
    addr: '27 Myeongdong-gil',
    lng: 126.985,
    lat: 37.563,
    district: 'Jung-gu',
    station: 'Myeongdong Station',
    walk: 3,
    mode: 'instant',
    minStay: 30,
    featured: false,
    tags: ['#Nightlife'],
    rooms: [{ name: 'Myeongdong studio', price: 980000, sqm: 14.0, occ: 1, avail: null }],
    amenities: ['wifi', 'ac', 'heating'],
  },
  {
    n: 37,
    host: HOST_2,
    title: 'Mapo triple-room share-house',
    slug: 'mapo-triple-room-share-house',
    desc: 'Affordable share-house with three private rooms and a shared kitchen near Gongdeok Station. Social but not a party house.',
    type: 'share-house',
    addr: '55 Mapo-daero',
    lng: 126.951,
    lat: 37.541,
    district: 'Mapo-gu',
    station: 'Gongdeok Station',
    walk: 6,
    mode: 'request',
    minStay: 30,
    featured: false,
    tags: ['#Budget', '#Social'],
    rooms: [
      { name: 'Room 1', price: 540000, sqm: 10.5, occ: 1, avail: null },
      { name: 'Room 2', price: 560000, sqm: 11.0, occ: 1, avail: null },
      { name: 'Room 3', price: 580000, sqm: 11.5, occ: 1, avail: null },
    ],
    amenities: ['wifi', 'kitchen', 'washer'],
  },
  {
    n: 38,
    host: HOST_2,
    title: 'Songpa luxury multi-bedroom',
    slug: 'songpa-luxury-multi-bedroom',
    desc: 'High-end two-bedroom near Lotte World Tower with premium finishes and parking. Semester-long corporate relocations welcome.',
    type: 'multi-bedroom',
    addr: '300 Olympic-ro',
    lng: 127.102,
    lat: 37.513,
    district: 'Songpa-gu',
    station: 'Jamsil Station',
    walk: 5,
    mode: 'request',
    minStay: 180,
    featured: true,
    tags: ['#Family'],
    rooms: [
      { name: 'Luxury primary', price: 1500000, sqm: 18.0, occ: 2, avail: null },
      { name: 'Luxury secondary', price: 1100000, sqm: 13.0, occ: 1, avail: null },
    ],
    amenities: ['wifi', 'washer', 'kitchen', 'elevator', 'parking', 'ac'],
  },
  {
    n: 39,
    host: HOST_2,
    title: 'Gwanak budget share-house',
    slug: 'gwanak-budget-share-house',
    desc: 'No-frills share-house for students near SNU. Low rent, shared kitchen, and a community board for language exchange.',
    type: 'share-house',
    addr: '91 Sillim-ro',
    lng: 126.945,
    lat: 37.463,
    district: 'Gwanak-gu',
    station: 'Sillim Station',
    walk: 7,
    mode: 'request',
    minStay: 30,
    featured: false,
    tags: ['#Student', '#Budget', '#Social'],
    rooms: [
      { name: 'Budget room A', price: 450000, sqm: 9.5, occ: 1, avail: null },
      { name: 'Budget room B', price: 470000, sqm: 10.0, occ: 1, avail: null },
    ],
    amenities: ['wifi', 'kitchen', 'heating'],
  },
  {
    n: 40,
    host: HOST_2,
    title: 'Yeongdeungpo value studio',
    slug: 'yeongdeungpo-value-studio',
    desc: 'Value studio near Yeongdeungpo Market with washer and desk. Good compromise between price and subway access.',
    type: 'studio',
    addr: '18 Yeongdeungpo-ro',
    lng: 126.907,
    lat: 37.517,
    district: 'Yeongdeungpo-gu',
    station: 'Yeongdeungpo Market Station',
    walk: 5,
    mode: 'instant',
    minStay: 30,
    featured: false,
    tags: ['#Budget'],
    rooms: [{ name: 'Value studio', price: 680000, sqm: 15.5, occ: 1, avail: null }],
    amenities: ['wifi', 'desk', 'washer', 'heating'],
  },
  {
    n: 41,
    host: HOST_2,
    title: 'Hongdae entry studio 980k',
    slug: 'hongdae-entry-studio-980k',
    desc: 'Entry-level Hongdae studio similar to our bright flagship listing but on a busier avenue. Furnished with desk and AC.',
    type: 'studio',
    addr: '5 Hongik-ro',
    lng: 126.926,
    lat: 37.552,
    district: 'Mapo-gu',
    station: 'Hongik Univ. Station',
    walk: 6,
    mode: 'instant',
    minStay: 30,
    featured: false,
    tags: ['#Hongdae', '#Exchange'],
    rooms: [{ name: 'Entry studio', price: 980000, sqm: 16.0, occ: 1, avail: null }],
    amenities: ['wifi', 'desk', 'ac'],
  },
  {
    n: 42,
    host: HOST_2,
    title: 'Gangnam station micro loft',
    slug: 'gangnam-station-micro-loft',
    desc: 'Micro loft literally above Gangnam Station shops. Premium micro price—choose this only if location beats space.',
    type: 'micro-studio',
    addr: '396 Gangnam-daero',
    lng: 127.028,
    lat: 37.498,
    district: 'Gangnam-gu',
    station: 'Gangnam Station',
    walk: 2,
    mode: 'instant',
    minStay: 30,
    featured: false,
    tags: ['#Gangnam'],
    rooms: [{ name: 'Micro loft', price: 890000, sqm: 8.5, occ: 1, avail: 'current_date + 60' }],
    amenities: ['wifi', 'ac', 'elevator'],
  },
];

/** @type {Array<Record<string, unknown>>} */
const workflowListings = [
  {
    n: 97,
    host: HOST_2,
    title: 'Draft studio in Euljiro',
    slug: 'draft-studio-euljiro',
    desc: 'Unpublished draft used to test host editing workflow before review submission.',
    type: 'studio',
    addr: '10 Eulji-ro',
    lng: 126.991,
    lat: 37.566,
    district: 'Jung-gu',
    station: 'Euljiro 3-ga Station',
    walk: 5,
    mode: 'request',
    minStay: 30,
    featured: false,
    tags: ['#Draft'],
    status: 'draft',
    rooms: [{ name: 'Draft room', price: 650000, sqm: 12.0, occ: 1, avail: null }],
    amenities: ['wifi'],
  },
  {
    n: 98,
    host: HOST_2,
    title: 'Pending review studio in Mapo',
    slug: 'pending-review-studio-mapo',
    desc: 'Submitted for admin review—should not appear in search until published.',
    type: 'studio',
    addr: '2 Seogyo-ro',
    lng: 126.918,
    lat: 37.554,
    district: 'Mapo-gu',
    station: 'Hongik Univ. Station',
    walk: 9,
    mode: 'request',
    minStay: 30,
    featured: false,
    tags: ['#Draft'],
    status: 'pending_review',
    rooms: [{ name: 'Review room', price: 720000, sqm: 13.0, occ: 1, avail: null }],
    amenities: ['wifi', 'desk'],
  },
];

function pad2(n) {
  return String(n).padStart(2, '0');
}

function propertyId(n) {
  return `44444444-4444-4444-8444-4444444444${pad2(n)}`;
}

function roomId(propN, roomIndex) {
  return `55555555-5555-4555-8555-55555555${pad2(propN)}${pad2(roomIndex)}`;
}

function imageId(n) {
  return `66666666-6666-4666-8666-6666666666${pad2(n)}`;
}

function sqlString(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function sqlTags(tags) {
  return `array[${tags.map((t) => sqlString(t)).join(', ')}]`;
}

function sqlAvail(avail) {
  if (avail == null) return 'null';
  if (typeof avail === 'string' && avail.startsWith('current_date')) return avail;
  return sqlString(avail);
}

function emitProperty(p, { published = true } = {}) {
  const id = propertyId(p.n);
  const status = p.status ?? (published ? 'published' : 'draft');
  const publishedAt =
    status === 'published' ? 'timezone(\'utc\', now())' : 'null';

  return `  (
    ${sqlString(id)},
    ${sqlString(p.host)},
    ${sqlString(p.title)},
    ${sqlString(p.slug)},
    ${sqlString(p.desc)},
    ${sqlString(p.type)}::public.accommodation_type,
    ${sqlString(p.addr)},
    'Seoul',
    'KR',
    extensions.st_setsrid(extensions.st_makepoint(${p.lng}, ${p.lat}), 4326)::extensions.geography,
    ${sqlString(p.district)},
    ${sqlString(p.station)},
    ${p.walk},
    ${sqlString(status)}::public.property_status,
    ${sqlString(p.mode)}::public.booking_mode,
    ${p.minStay},
    ${p.featured ? 'true' : 'false'},
    ${sqlTags(p.tags)},
    ${status === 'published' ? "timezone('utc', now())" : 'null'}
  )`;
}

function generate() {
  const lines = [];
  lines.push('-- Generated by supabase/seed/generate-catalog.mjs — do not edit by hand');
  lines.push('-- Phase 0: expanded synthetic catalog (properties 05–42 published, 97–98 workflow)');
  lines.push('');

  // Properties
  lines.push('insert into public.properties (');
  lines.push('  id, host_id, title, slug, description, property_type,');
  lines.push('  address_line1, city, country, location, district,');
  lines.push('  nearest_station_name, nearest_station_walk_min, status, booking_mode,');
  lines.push('  min_stay_nights, is_featured, tags, published_at');
  lines.push(')');
  lines.push('values');
  const propRows = catalog.map((p) => emitProperty(p));
  const workflowRows = workflowListings.map((p) => emitProperty(p, { published: false }));
  lines.push([...propRows, ...workflowRows].join(',\n'));
  lines.push('on conflict (id) do nothing;');
  lines.push('');

  // Rooms
  lines.push('insert into public.rooms (');
  lines.push('  id, property_id, name, room_type, size_sqm, max_occupancy, monthly_price_krw, status, available_from');
  lines.push(')');
  lines.push('values');
  const roomRows = [];
  for (const p of [...catalog, ...workflowListings]) {
    p.rooms.forEach((room, idx) => {
      roomRows.push(`  (
    ${sqlString(roomId(p.n, idx + 1))},
    ${sqlString(propertyId(p.n))},
    ${sqlString(room.name)},
    'private',
    ${room.sqm},
    ${room.occ},
    ${room.price},
    'available',
    ${sqlAvail(room.avail)}
  )`);
    });
  }
  lines.push(roomRows.join(',\n'));
  lines.push('on conflict (id) do nothing;');
  lines.push('');

  // Images (published catalog only)
  lines.push('insert into public.property_images (id, property_id, storage_path, sort_order, alt_text, is_cover)');
  lines.push('values');
  const imageRows = catalog.map((p) => {
    const photo = UNSPLASH[p.n % UNSPLASH.length];
    return `  (
    ${sqlString(imageId(p.n))},
    ${sqlString(propertyId(p.n))},
    ${sqlString(`https://images.unsplash.com/${photo}?auto=format&fit=crop&w=1200&q=80`)},
    0,
    ${sqlString(p.title)},
    true
  )`;
  });
  lines.push(imageRows.join(',\n'));
  lines.push('on conflict (id) do nothing;');
  lines.push('');

  // Amenities
  lines.push('insert into public.property_amenities (property_id, amenity_id)');
  lines.push('values');
  const amenityRows = [];
  for (const p of [...catalog, ...workflowListings]) {
    for (const slug of p.amenities) {
      amenityRows.push(
        `  (${sqlString(propertyId(p.n))}, ${sqlString(AMENITIES[slug])})`,
      );
    }
  }
  lines.push(amenityRows.join(',\n'));
  lines.push('on conflict do nothing;');
  lines.push('');

  lines.push('-- Fix legacy broken Unsplash photo IDs if seed re-runs without db reset');
  lines.push('update public.property_images');
  lines.push("set storage_path = 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80'");
  lines.push("where storage_path like '%photo-1484154218962-a197022257a8%';");
  lines.push('');

  return `${lines.join('\n')}\n`;
}

const outputPath = join(__dirname, 'catalog_properties.sql');
writeFileSync(outputPath, generate());
console.log(`Wrote ${outputPath} (${catalog.length} published + ${workflowListings.length} workflow listings)`);
