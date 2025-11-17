# QR Token (MVP)

Payload (no PII): `{ v, cid, tid, iat }`
- `v`: version
- `cid`: card UUID/ID (random)
- `tid`: token id (random)
- `iat`: issued at (ms)

Encoding: base64url(JSON).signature
- Signature: HMAC-SHA256 over `base64url(JSON)` with `HMAC_SECRET`.

Verification:
- Recompute signature; if match → lookup card/token in DB; return status.
- On approval, mark card as `is_redeemed = true` atomically.

Rotation:
- Printed card tokens are long-lived. If reprinted, generate a new `tid` and set old token status to `revoked`.

Hardening roadmap:
- Upgrade to Ed25519 (JWS) with KMS-managed keys.
- Use short-lived wrapper token for in-app display to reduce screenshot replay risk.
