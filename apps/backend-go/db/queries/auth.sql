-- name: GetAuthProfileByID :one
SELECT id, role
FROM profiles
WHERE id = $1
  AND deleted_at IS NULL;

-- name: ProfileIsAdmin :one
SELECT EXISTS (
  SELECT 1
  FROM profiles
  WHERE id = $1
    AND role = 'admin'::user_role
    AND deleted_at IS NULL
)::boolean AS is_admin;

-- name: GetHostIDForProfile :one
SELECT id
FROM hosts
WHERE profile_id = $1
  AND deleted_at IS NULL
LIMIT 1;

-- name: IsHostOfProperty :one
SELECT EXISTS (
  SELECT 1
  FROM properties p
  INNER JOIN hosts h ON h.id = p.host_id
  WHERE p.id = $1
    AND p.deleted_at IS NULL
    AND h.profile_id = $2
    AND h.deleted_at IS NULL
)::boolean AS is_host;

-- name: GetBookingPropertyID :one
SELECT property_id
FROM bookings
WHERE id = $1;
