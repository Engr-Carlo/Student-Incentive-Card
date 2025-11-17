# Incentive Card API (MVP)

Base URL: `/api`

Auth: TBD (OIDC + JWT suggested). For now, endpoints unsecured for local demo only.

## Health
GET `/health` → `{ ok: true }`

## Admin
POST `/admin/cards/issue`
- Body: `{ student_id, event_id, tier }`
- Returns: `{ card_id, tier, qr_payload }`

POST `/admin/verify`
- Body: `{ qr_payload }`
- Returns: `{ valid: boolean, card_id?, token_id?, status? }`

## Student
POST `/student/redeem-requests`
- Body: `{ card_id, course }`
- Returns: `{ ok: true, request_id }`

Notes:
- QR payload is HMAC-signed, no PII; server still checks DB.
- Production must enforce roles, rate limits, CSRF for unsafe methods (if cookie-based), and audit logging.
