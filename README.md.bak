# EduEpic Backend (API Reference Scaffold)

This folder contains the **backend architecture** for EduEpic, designed to work
hand-in-hand with the `frontend` (React + Vite) application located at the
project root `src/` directory.

> ⚠️ **Note on this sandbox**: This build environment only compiles and serves
> the Vite frontend (`npm run build` → `dist/`). The backend below is provided
> as production-ready **reference source code** following clean MVC
> architecture. To run it for real, deploy it separately (e.g. Render,
> Railway, VPS) with Node.js 18+, then point the frontend's
> `VITE_API_BASE_URL` env variable to its URL — no frontend code changes are
> required because all data access already goes through the service layer in
> `src/services`.

## Stack

- Node.js + Express
- MongoDB Atlas + Mongoose (multilingual document schemas)
- JWT authentication
- MVC + Repository + Service layered architecture

## Getting Started (when deployed on a Node host)

```bash
cd backend
npm init -y
npm install express mongoose cors dotenv jsonwebtoken bcryptjs helmet compression morgan express-rate-limit joi
node server.js
```

Create a `.env` file:

```
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/eduepic
JWT_SECRET=your_super_secret_key
CLIENT_URL=https://www.eduepic.com
```

## Folder Structure

```
backend/
  config/        # DB connection, environment config
  controllers/   # Route handlers (thin, no business logic)
  services/      # Business logic layer
  repositories/  # Data-access layer (Mongoose queries)
  models/        # Mongoose schemas (multilingual blog, category, user...)
  routes/        # Express routers
  middlewares/   # Auth, error handling, validation
  validators/    # Joi request validation schemas
  helpers/       # Small reusable helper functions
  utils/         # apiResponse, logger, pagination utils
  constants/     # Roles, error codes
  database/      # Seed scripts / migrations
  uploads/       # Local file uploads (or swap for S3/Cloudinary)
  logs/          # Application logs
  jobs/          # Cron jobs (sitemap regeneration, cache warmup)
  scripts/       # One-off maintenance scripts
  server.js      # App entry point
```

## API Design Principles

- Every list endpoint supports `page`, `pageSize`, `search`, `category`, `tag`.
- Every blog document stores a `translations` map keyed by language code
  (`en`, `ur`, `ar`, `es`, `fr`, `de`, `zh`, `hi`, `tr`, ...) so unlimited
  languages can be added without a schema migration.
- `Accept-Language` header (sent automatically by the frontend Axios client)
  determines which translation is returned; falls back to English.
- All responses follow a consistent envelope: `{ success, data, message, meta }`.
