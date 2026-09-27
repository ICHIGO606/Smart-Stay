# SmartStay Backend

The backend is an Express 5 API using MongoDB/Mongoose. It provides authentication, user profiles, hotels and rooms, bookings, travel packages, reviews, payment processing, and webhook handling.

## Requirements

- Node.js 22 or newer
- npm
- A reachable MongoDB instance
- Razorpay credentials (the Razorpay client is initialized when the application loads)
- Cloudinary credentials for upload features

## Configuration

Create `Backend/.env` and set the values for your environment. Do not commit credentials.

```dotenv
PORT=8000
NODE_ENV=development
MONGO_URL=mongodb://127.0.0.1:27017/smartstay

ACCESS_TOKEN_SECRET=replace-with-a-long-random-secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=replace-with-a-different-long-random-secret
REFRESH_TOKEN_EXPIRY=10d
CSRF_SECRET=replace-with-a-long-random-secret

RAZORPAY_KEY_ID=rzp_test_replace_me
RAZORPAY_KEY_SECRET=replace_me
RAZORPAY_WEBHOOK_SECRET=replace_me

CLOUDINARY_CLOUD_NAME=replace_me
CLOUDINARY_API_KEY=replace_me
CLOUDINARY_API_SECRET=replace_me
```

`MONGO_URL`, `RAZORPAY_KEY_ID`, and `RAZORPAY_KEY_SECRET` are needed for the normal server startup path. Token secrets are needed for authenticated user operations. Cloudinary values are needed for uploads, and the webhook secret is needed to verify Razorpay webhooks. The app has a development CSRF fallback, but set a strong `CSRF_SECRET` outside local development.

## Install and run

Run these commands from `Backend/`:

```sh
npm ci
npm run dev
```

The development server loads environment variables from `.env` and listens on port `8000` unless `PORT` is set. The frontend's local API client expects the backend at `http://localhost:8000/api/v1`. CORS is configured for frontend origins on `localhost:3000` and `127.0.0.1:3000`.

## Scripts

| Command                | Description                                                                   |
| ---------------------- | ----------------------------------------------------------------------------- |
| `npm run dev`          | Start with nodemon and load `.env` before the app starts.                     |
| `npm start`            | Start with Node.js; provide environment variables in the process environment. |
| `npm test`             | Run Jest tests and generate coverage.                                         |
| `npm run lint`         | Lint backend source and tests.                                                |
| `npm run format`       | Format backend JavaScript files under `src/`.                                 |
| `npm run format:check` | Check formatting without modifying files.                                     |

Coverage thresholds are currently applied to API utilities, payment and webhook controllers, and hotel-admin middleware. The threshold is not a whole-backend source coverage figure.

## API reference

See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for endpoint examples. The API's primary prefix is `http://localhost:8000/api/v1`.
