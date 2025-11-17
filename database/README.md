# Backend Setup Instructions

## Prerequisites
1. **PostgreSQL** must be installed and running on your machine
   - Download from: https://www.postgresql.org/download/windows/
   - Default port: 5432
   - Default user: postgres

## Setup Steps

### 1. Create Database
Open PostgreSQL command line (psql) or pgAdmin and run:
```sql
CREATE DATABASE incentive_card;
```

### 2. Run Schema
Navigate to the database folder and execute the schema:
```bash
psql -U postgres -d incentive_card -f schema.sql
```

Or using pgAdmin:
- Connect to `incentive_card` database
- Open Query Tool
- Paste contents of `schema.sql`
- Execute

### 3. Install Dependencies
```bash
cd backend
npm install
```

### 4. Configure Environment
Edit `backend/.env` if your PostgreSQL credentials are different:
```
DATABASE_URL=postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/incentive_card
PORT=3001
```

### 5. Start Backend Server
```bash
npm run dev
```

Server will run on `http://localhost:3001`

## Verify Setup
- Check console for: ✅ Database connected successfully
- Test endpoint: http://localhost:3001/api/cards
