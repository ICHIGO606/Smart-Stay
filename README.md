# SmartStay

SmartStay is a hotel and travel management application with a React frontend and an Express/MongoDB API.

## Applications

- [Frontend](frontend/README.md): React, Vite, and the customer/admin web interface.
- [Backend](Backend/README.md): Express API, MongoDB persistence, authentication, bookings, payments, and uploads.
- [API documentation](Backend/API_DOCUMENTATION.md): API endpoint examples and request/response details.

## Requirements

- Node.js 22 or newer
- npm
- MongoDB, local or hosted
- Razorpay test or live credentials for the backend payment integration
- Cloudinary credentials for image/document upload features

## Run locally

Start the backend first. Create `Backend/.env` using the variables described in the [backend README](Backend/README.md), then run:

```sh
cd Backend
npm ci
npm run dev
```

In a second terminal, start the frontend:

```sh
cd frontend
npm ci
npm run dev
```

The frontend is served at `http://localhost:3000`; the API listens at `http://localhost:8000` by default.

## Tests and CI

Run the test, lint, and build commands from each application directory. GitHub Actions runs frontend tests, build, and lint, plus backend tests and lint on pull requests targeting `main` and pushes to `main`.

Coverage thresholds are enforced for the configured test scopes: the frontend service layer and backend API utilities, payment/webhook controllers, and hotel-admin middleware. They do not represent coverage of every source file in the repositories.
