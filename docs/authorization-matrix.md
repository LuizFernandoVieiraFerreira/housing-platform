# Authorization matrix

Python, Java, and Node connect as the database owner or with service credentials. That session **bypasses row level security**. The rules below are what those backends enforce in the service layer before any repository call.

RLS still applies to the Supabase client path (anon key, user JWT, user-scoped Edge Function clients). It is not a backup for a REST request.

This file maps every `CREATE POLICY` in `supabase/migrations/`. No later migration drops or replaces one. There are **56 policies**: 47 on `public`, 9 on `storage.objects`. `api_rate_limits` has RLS enabled and no policies.

When a migration adds, drops, or changes a policy, update this file in the same change. OpenAPI in `packages/api-contract/openapi.yaml` names the routes. It does not encode these checks.

## How to apply a policy

Policies here are permissive. On the Supabase path, PostgreSQL ORs every policy for the same command. REST does not expose one table endpoint, so it does not OR them onto every route. Each operation below implements the policies that match that route.

A service may return a subset of the rows a policy would allow. It must not return a row the policy would hide, and it must not write a row the policy would reject.

`anon` means no JWT. `caller` is `AuthUser.id` from the validated Supabase JWT. Role comes from `profiles`, not from a JWT claim.

### Helpers

Replicate these SQL helpers. Do not call them and expect `auth.uid()` to be the caller: a service session has no `auth.uid()` unless the backend sets it. Read the caller from the request context.

| SQL | Service | True when |
| --- | --- | --- |
| `is_admin()` | `AuthorizationService.isAdmin(caller)` | A `profiles` row exists with `id = caller`, `role = admin`, `deleted_at` null |
| `current_host_id()` | `HostService.getHostIdForProfile(caller)` | `hosts.id` where `profile_id = caller` and `deleted_at` is null. No row means null. Does **not** require `hosts.status = active` |
| `is_host_of_property(propertyId)` | `PropertyService.isHostOfProperty(caller, propertyId)` | That property joins a host with `profile_id = caller`, and both `deleted_at` values are null. Ignores `hosts.status` and `properties.status` |
| `is_host_of_booking(bookingId)` | `BookingService.isHostOfBooking(caller, bookingId)` | The booking exists and `isHostOfProperty(caller, booking.property_id)` |

A `pending` or `suspended` host still passes the host helpers. Only public host reads require `status = active`.

### Grants are not a REST control

`authenticated` has no write grant on `hosts`, `amenities`, or `location_aliases`, even where an admin `FOR ALL` policy exists. The missing grant blocks PostgREST. A service connection ignores grants. Enforce the policy anyway.

### Triggers that still run

`profiles_protect_role` runs on every `profiles` update and calls `is_admin()`. With `auth.uid()` unset, that check is false, so any `role` change is written back to the old value. `ProfileService.updateProfile` must not send `role`. `HostService.register` is the one exception: in the same transaction, disable `profiles_protect_role`, set the caller's role to `host`, enable the trigger again, then insert the `hosts` row. Do not leave the trigger disabled. This matches `register_as_host`.

Integrity constraints, the overlap exclusion, and price-sync triggers stay in PostgreSQL. They are not authorization.

### Not found and forbidden

Hide rows the caller must not see. For a public property route, a draft id is not found. For `createPaymentOrder`, a missing booking and another customer's booking are both denied (forbidden, matching `create-payment`). For `confirmPayment`, an unknown `orderId` is not found; a known order owned by someone else is forbidden (matching `confirm-payment`). Ownership failures whose SQL message is "Only the host..." or "Only admins..." are forbidden.

## `profiles`

Migration `20250821140000_profiles_auth.sql`. No insert policy: rows are created by `on_auth_user_created`. No delete policy. No admin update of another profile.

| # | Policy | Command | Roles | Service rule |
| --- | --- | --- | --- | --- |
| 1 | Profiles are viewable by owner or admin | SELECT | authenticated | `getProfile`: `id = caller` and `deleted_at` is null. The admin branch (any non-deleted profile) has no contract route. A later admin read still requires `isAdmin` and `deleted_at` null |
| 2 | Users can update their own profile | UPDATE | authenticated | `updateProfile`: same id, and both the stored row and the written row have `deleted_at` null. Reject changes to `id`, `role`, and `deleted_at` |

## `hosts`

Migration `20250822100000_properties_catalog.sql`. No host insert or update policy. Registration and approval are functions, listed after the policies. Authenticated callers have `SELECT` only; admin writes still require `isAdmin` on REST.

| # | Policy | Command | Roles | Service rule |
| --- | --- | --- | --- | --- |
| 3 | Active hosts are publicly readable | SELECT | anon, authenticated | Public host fields: `deleted_at` null and `status = active` |
| 4 | Hosts can view their own host profile | SELECT | authenticated | `getCurrentHost`: `profile_id = caller` and `deleted_at` null, any `host_status` |
| 5 | Admins can manage hosts | ALL | authenticated | `listAdminHosts`: `isAdmin`. Includes soft-deleted rows, because this policy does not filter `deleted_at`. `approveHost`: `isAdmin`, row not deleted, `status` is `pending`, then set `active` and `verified_at`, then write an audit log. No other caller updates `hosts` |

`registerHost`: caller required, display name non-blank after trim. If a non-deleted host row already exists, return it and do not insert another. Otherwise set the caller's profile role to `host` using the trigger bypass above, and insert `hosts` with `status = pending`.

## `properties`

Same migration for policies 6–11. Status changes that publish or submit are functions, not generic updates.

| # | Policy | Command | Roles | Service rule |
| --- | --- | --- | --- | --- |
| 6 | Published properties are publicly readable | SELECT | anon, authenticated | `searchProperties` and `getProperty`: `deleted_at` null and `status = published`. A draft, pending, or archived id on these routes is not found, including for an admin |
| 7 | Hosts can view their own properties | SELECT | authenticated | `listHostProperties` and `getHostProperty`: `isHostOfProperty` and `deleted_at` null, any status |
| 8 | Admins can view all properties | SELECT | authenticated | `listAdminProperties`: `isAdmin` and `deleted_at` null. Soft-deleted rows are still visible to admins via policy 11; include them on the admin list |
| 9 | Hosts can insert their own properties | INSERT | authenticated | `createProperty`: caller must have a host id. Set `host_id` from `getHostIdForProfile`. Force `status = draft` and `deleted_at` null. Ignore a client `host_id` or `status` |
| 10 | Hosts can update their own draft or pending properties | UPDATE | authenticated | `updateProperty` and `setPropertyLocation`: `isHostOfProperty`, stored and new `deleted_at` null, stored and new `status` in `draft` or `pending_review`. Do not change `host_id`. Do not change `status` on `updateProperty` |
| 11 | Admins can manage all properties | ALL | authenticated | Admin routes require `isAdmin` and may see soft-deleted rows. Do not add a generic admin insert or hard delete. `publishProperty` and `rejectPropertyReview` are the admin writes |

`submitPropertyForReview` (current body in `20250822140000_host_platform.sql`): `isHostOfProperty`, at least one room with `deleted_at` null and `status = available`, `location` not null, stored `status = draft` and not deleted, then set `pending_review`. Policy 10 would also allow a raw status flip. Do not honor that. This operation is the only host path into `pending_review`.

`setPropertyLocation`: `isHostOfProperty`, coordinates in range, property not deleted, `status` in `draft` or `pending_review`. `getHostProperty` coordinates: same host check, not deleted, `location` not null.

`publishProperty` and `rejectPropertyReview` (current bodies in `20250822150000_admin_platform.sql`): `isAdmin`, not deleted, stored `status = pending_review`. Publish sets `published` and `published_at`. Reject sets `draft`. Both write an audit log. Non-admins are forbidden.

## `rooms`

| # | Policy | Command | Roles | Service rule |
| --- | --- | --- | --- | --- |
| 12 | Rooms of published properties are publicly readable | SELECT | anon, authenticated | Rooms included in `getProperty`: room `deleted_at` null, parent property `deleted_at` null and `status = published` |
| 13 | Hosts can manage rooms on their properties | ALL | authenticated | `createRoom` and `deleteRoom`: `isHostOfProperty` for the property id on the route. This policy does not look at property status or room `deleted_at`, so a host may change rooms on a published property. Force `property_id` from the route |
| 14 | Admins can manage all rooms | ALL | authenticated | No admin room route. A later one requires `isAdmin`. It may see soft-deleted rooms |

## `property_images` and `room_images`

Metadata only. Bytes are `storage.objects` (policies 26–34). No image route in the contract. When a property or room response includes images, use the same visibility as that parent read: policy 15 or 18 on public routes, policy 16 or 19 on host routes, policy 17 or 20 on admin routes.

| # | Policy | Command | Roles | Service rule |
| --- | --- | --- | --- | --- |
| 15 | Images of published properties are publicly readable | SELECT | anon, authenticated | Parent property `deleted_at` null and `status = published` |
| 16 | Hosts can manage images on their properties | ALL | authenticated | `isHostOfProperty(property_id)` for select, insert, update, and delete |
| 17 | Admins can manage all property images | ALL | authenticated | `isAdmin` |
| 18 | Images of published rooms are publicly readable | SELECT | anon, authenticated | Room `deleted_at` null, parent property `deleted_at` null and `status = published` |
| 19 | Hosts can manage images on their rooms | ALL | authenticated | The room exists and `isHostOfProperty` of that room's `property_id` |
| 20 | Admins can manage all room images | ALL | authenticated | `isAdmin` |

## `amenities` and `property_amenities`

| # | Policy | Command | Roles | Service rule |
| --- | --- | --- | --- | --- |
| 21 | Amenities are publicly readable | SELECT | anon, authenticated | `listAmenities`: no auth. `using (true)` |
| 22 | Admins can manage amenities | ALL | authenticated | No write route. A later catalog write requires `isAdmin`. The missing `GRANT` does not replace that check |
| 23 | Amenities on published properties are publicly readable | SELECT | anon, authenticated | Junction rows included in `getProperty`: parent property `deleted_at` null and `status = published` |
| 24 | Hosts can manage amenities on their properties | ALL | authenticated | Host property reads and a later amenity editor: `isHostOfProperty(property_id)` |
| 25 | Admins can manage all property amenities | ALL | authenticated | `isAdmin` |

## `platform_settings`

Migration `20250822120000_bookings.sql`. No anon select. `quoteBooking` and booking holds may read settings inside the service. That does not make a public settings route.

| # | Policy | Command | Roles | Service rule |
| --- | --- | --- | --- | --- |
| 26 | Authenticated users can read platform settings | SELECT | authenticated | A settings read exposed to clients requires a caller. Any authenticated role, including customer |
| 27 | Admins can manage platform settings | ALL | authenticated | Writes require `isAdmin`. No settings write route today |

`quoteBooking` is anonymous. It still refuses a room that is missing, deleted, not `available`, or whose property is not published. That check lives in `validate_booking_inputs`, not in a policy.

## `bookings`

| # | Policy | Command | Roles | Service rule |
| --- | --- | --- | --- | --- |
| 28 | Customers can view their own bookings | SELECT | authenticated | `listBookings` and `getBooking` for a customer: `customer_id = caller` |
| 29 | Hosts can view bookings on their properties | SELECT | authenticated | `listHostBookings`: `isHostOfProperty(property_id)`. Not limited to `customer_id` |
| 30 | Admins can view all bookings | SELECT | authenticated | `listAdminBookings`: `isAdmin` |
| 31 | Customers can create their own bookings via RPC | INSERT | authenticated | Not a raw insert. `createBooking` follows `create_booking_hold` (below). The only identity rule in this policy is `customer_id = caller` |
| 32 | Admins can manage all bookings | ALL | authenticated | Customer and host routes do not take this branch. Admin booking writes that are not approve or reject have no route. Approve and reject are below |

No customer or host `UPDATE` or `DELETE` policy. Cancel, approve, and reject are the only status writes.

`createBooking`, current body in `20250902120000_notifications.sql`:

- Caller required.
- Rate limit `booking_hold:{caller}` to 10 calls per 60 seconds (`assert_rate_limit`).
- `validate_booking_inputs`: dates ordered, guest count positive, room available and not deleted, property published and not deleted, min stay, occupancy, `available_from`.
- No overlapping hold (`room_has_booking_conflict`). The `bookings_no_overlap` exclusion is the database backstop.
- Set `customer_id` from the caller. Ignore a client customer id.
- `booking_mode = instant` writes `pending_payment`, type `instant`, and `hold_expires_at` from `platform_settings.hold_ttl_minutes`. Otherwise `requested`, type `request`, no hold expiry.
- Insert the price snapshot from `calculate_booking_price`. Do not accept amounts from the client.
- Notify, as that function does.

`cancelBooking` (`cancel_own_booking`): `customer_id = caller` and `status` in `requested` or `pending_payment`, then `cancelled`. Anything else is "Booking cannot be cancelled" (forbidden). A host does not cancel through this operation.

`approveBooking` and `rejectBooking`, current bodies in `20250902120000_notifications.sql`: `isAdmin` or `isHostOfBooking`. Stored `status` must be `requested`. Approve also rechecks date conflicts, then sets `pending_payment`, `hold_expires_at`, `approved_at`, and `approved_by = caller`. Reject sets `rejected`. Both notify. Anyone else is forbidden.

`expire_booking_holds` is service-only. A scheduled job may run it. No user route.

## `booking_price_snapshots`

| # | Policy | Command | Roles | Service rule |
| --- | --- | --- | --- | --- |
| 33 | Customers can view their booking price snapshots | SELECT | authenticated | Return a snapshot only with a booking the caller can already read: `customer_id = caller`, or `isHostOfProperty` of that booking, or `isAdmin`. No insert or update route. `createBooking` writes the snapshot in the same transaction |

## `payments` and `payment_events`

Migration `20250822130000_payments.sql`. No customer insert policy. Creating an order is `create_payment_order`. Confirm and webhook use service-side functions that do not check `auth.uid()`.

| # | Policy | Command | Roles | Service rule |
| --- | --- | --- | --- | --- |
| 34 | Customers can view their own payments | SELECT | authenticated | Customer payment reads: `customer_id = caller` |
| 35 | Hosts can view payments on their properties | SELECT | authenticated | A host payment read joins `bookings` on `booking_id` and requires `isHostOfProperty`. No host payment route today |
| 36 | Admins can manage all payments | ALL | authenticated | `listAdminPayments`: `isAdmin`. No admin refund or status route. Do not let a customer update a payment row |
| 37 | Admins can view payment events | SELECT | authenticated | `isAdmin` only. No insert policy. `record_payment_event` stays inside the webhook handler |

`createPaymentOrder`: caller required. Lock the booking. If it is missing or `customer_id` is not the caller, forbidden (do not return it). `payment_failed` may retry once, then return to `pending_payment` and extend the hold. Any other status except `pending_payment` is forbidden. An expired hold is marked `expired` and rejected. Amount is `booking_price_snapshots.total_krw`, never the client.

`confirmPayment`: caller required. Unknown `orderId` is not found. `payments.customer_id` other than the caller is forbidden. Amount must equal the stored `amount_krw` before talking to Toss. Already `confirmed` returns the existing row. `finalize_successful_payment` then runs only after those checks. It is not a user-facing repository call on its own.

`receivePaymentWebhook`: no user JWT. Verify the payment with Toss, then `record_payment_event` and `finalize_successful_payment` or `mark_payment_failed`. Those three functions are granted to `service_role` only. Do not expose them as user operations.

## `housing_requests` and `audit_logs`

Migration `20250822150000_admin_platform.sql`. The contract has admin routes only. There is no public submit route yet.

| # | Policy | Command | Roles | Service rule |
| --- | --- | --- | --- | --- |
| 38 | Anyone can submit housing requests | INSERT | anon, authenticated | A future submit: anon may insert only when `customer_id` is null. An authenticated caller may set `customer_id` to themselves or leave it null, never to someone else |
| 39 | Customers can view own housing requests | SELECT | authenticated | Customer list: `customer_id = caller`. Rows submitted with a null `customer_id` are not readable by the submitter |
| 40 | Admins manage housing requests | ALL | authenticated | `listHousingRequests` and `updateHousingRequestStatus`: `isAdmin`. Status update writes an audit log, as `update_housing_request_status` does |
| 41 | Admins can view audit logs | SELECT | authenticated | `listAuditLogs`: `isAdmin`. No insert, update, or delete policy |

`write_audit_log` is granted to `authenticated` and only checks that `auth.uid()` is set. Do not copy that. REST does not expose an audit write route. Admin operations insert the row themselves with `actor_id = caller`.

## `location_aliases`

Migration `20250827110000_search_hardening.sql`.

| # | Policy | Command | Roles | Service rule |
| --- | --- | --- | --- | --- |
| 42 | Location aliases are publicly readable | SELECT | anon, authenticated | Search may resolve aliases with no auth. `using (true)` |
| 43 | Admins can manage location aliases | ALL | authenticated | Writes require `isAdmin`. No alias write route. The missing write grant is not the check |

## `property_search_embeddings`

Migration `20250827120000_property_search_embeddings.sql`.

| # | Policy | Command | Roles | Service rule |
| --- | --- | --- | --- | --- |
| 44 | Embeddings for published properties are publicly readable | SELECT | anon, authenticated | A semantic search read: parent property `status = published` and `deleted_at` null. Application authorization |
| 45 | Service role manages property search embeddings | ALL | service_role | Infrastructure. Embedding sync uses service credentials and may write any row. No user route, including for admins |

`search_properties` and `search_properties_hybrid` are `security invoker`, so RLS hides unpublished rows on the Supabase path. REST must apply policies 6 and 44 in the query. Do not select drafts and filter them after the fact.

## `notifications`

Migration `20250902120000_notifications.sql`. No insert policy for `authenticated`. Inserts happen in booking functions (`create_notification`). The service writes those rows as a side effect. The recipient comes from the booking or the host profile, never from the client body.

| # | Policy | Command | Roles | Service rule |
| --- | --- | --- | --- | --- |
| 46 | Users can view their own notifications | SELECT | authenticated | `listNotifications` and `getUnreadNotificationCount`: `user_id = caller`. Unread count is rows with `read_at` null |
| 47 | Users can mark their own notifications as read | UPDATE | authenticated | `markNotificationRead` and `markAllNotificationsRead`: `user_id = caller` on the stored row and on the written row. Set `read_at` only. `markNotificationRead` of another user's id is not found. Already-read is success |

## `storage.objects`

Policies 48–56, same catalog migration. Buckets `property-images` and `room-images` are public, 50 MB, `image/jpeg`, `image/png`, `image/webp`. Size and MIME are bucket configuration, not policies. Keep enforcing them if a backend proxies an upload.

Storage stays on Supabase until a backend proxies bytes. These policies stay in force on direct uploads. A proxied upload uses service credentials and must apply the same checks first. The first path segment is a UUID. An unparseable segment is denied.

| # | Policy | Command | Roles | Service rule |
| --- | --- | --- | --- | --- |
| 48 | Property images are publicly accessible | SELECT | public | `bucket_id = property-images`. This does not check the property status. Public object reads are not limited to published listings |
| 49 | Room images are publicly accessible | SELECT | public | `bucket_id = room-images`. Same, no parent-status check |
| 50 | Hosts can upload property images | INSERT | authenticated | Bucket `property-images`, and `isHostOfProperty` of the first folder segment (the property id) |
| 51 | Hosts can update property images | UPDATE | authenticated | Same bucket and `isHostOfProperty` on both the existing object and the new name |
| 52 | Hosts can delete property images | DELETE | authenticated | Same bucket and `isHostOfProperty` of the first folder segment |
| 53 | Hosts can upload room images | INSERT | authenticated | Bucket `room-images`. First folder segment is a room id. That room must exist and `isHostOfProperty` of its `property_id` |
| 54 | Hosts can update room images | UPDATE | authenticated | Same room-host check on the existing object and the new name |
| 55 | Hosts can delete room images | DELETE | authenticated | Same room-host check |
| 56 | Admins can manage property image storage | ALL | authenticated | `isAdmin`, and `bucket_id` is `property-images` or `room-images` |

## `api_rate_limits`

RLS is enabled and there is no policy, so `anon` and `authenticated` cannot read or write the table. `service_role` has `GRANT ALL`. Infrastructure only: the rate-limit middleware or `assert_rate_limit`. No REST route.

## What a passing authz suite covers

Each backend's authorization tests must fail closed. Minimum cases, tied to the policies above:

- Anonymous `getProperty` / `searchProperties` returns a published property and not a draft (6, 12, 15, 18, 23).
- Customer `listBookings` / `getBooking` omits another customer's booking (28).
- Customer `cancelBooking` does not cancel someone else's, or a `confirmed` stay (cancel function, not a policy).
- Customer `createPaymentOrder` does not open an order for someone else's booking (34, `create_payment_order`).
- Customer `confirmPayment` is forbidden for someone else's order and not-found for an unknown order (`confirm-payment`, 34).
- Non-host `updateProperty`, `setPropertyLocation`, `submitPropertyForReview`, `createRoom` are forbidden (9, 10, 13).
- Host `updateProperty` does not set `published` (10, publish function).
- Non-admin `publishProperty`, `rejectPropertyReview`, `approveHost`, `listAuditLogs`, `updateHousingRequestStatus` are forbidden (11, 5, 41, 40).
- Anonymous calls to those admin routes are unauthenticated, not an empty list.
- `markNotificationRead` does not mark another user's notification (47).
- `updateProfile` does not change `role` (2, `profiles_protect_role`).
