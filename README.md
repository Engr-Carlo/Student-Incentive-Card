# Incentive Card Portal (QR-only, Unified Admin)

A secure portal to issue, track, verify, and redeem Incentive Cards.

Stack:
- Frontend: React + Tailwind (two SPAs: Student & Admin)
- Backend: Node.js (Express) on Vercel Serverless Functions
- Database: Neon (PostgreSQL)
- Storage: Vercel Blob (PDF/JPEG assets), optional S3 later

Dev quick start (Windows PowerShell):

```
# Prereqs: Node 18+, Git, Vercel CLI (optional)
# Install deps
npm install

# Student app (dev)
npm run dev:student

# Admin app (dev)
npm run dev:admin

# API (local via Vercel dev)
npm run dev:api
```

Environment variables (create `.env.local` in `api/`):
- DATABASE_URL: Neon connection string
- HMAC_SECRET: long random base64url string for QR signing
- BLOB_READ_WRITE_TOKEN: Vercel Blob RW token
- ISSUER_NAME: e.g., "Engr. Carlo"
- BASE_URL: public API base (e.g., https://incentive-card.vercel.app)

Deploy:
- SPAs → GitHub Pages (or Vercel for same-site auth)
- API → Vercel

See `docs/` for schema, API, and security notes.
