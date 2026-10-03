# WanderNest — React + Node/Express + MongoDB

A complete React migration of the original WanderNest Travel & Accommodation Booking Platform. The backend keeps the original business logic and integrations, while the new frontend provides a modern responsive UI.

## Architecture

```text
WanderNest-React-FullStack/
├── backend/
│   ├── app.js
│   ├── api.js
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── views/                 # Original EJS fallback/reference
│   ├── public/                # Original browser assets
│   ├── cloudConfig.js
│   ├── middleware.js
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   └── services/api.js
    ├── index.html
    ├── vite.config.js
    └── .env.example
```

## Original functionality preserved

- Passport.js signup, login, logout and persistent session authentication
- Session-backed MongoDB store
- Username dropdown, wishlist, My Orders and logout
- Forgot password token flow + old-password/new-password change flow
- Password reset token hashing and expiry
- Listing search across title/location/country/category
- Category filters
- Create, edit and delete listings with owner authorization
- Cloudinary image upload
- Mapbox geocoding and stored GeoJSON coordinates
- Property detail pages and map preview
- Wishlist add/remove
- Guest reviews with author-only deletion
- Booking date/guest validation
- 18% tax and 10% long-stay discount for 5+ nights
- Razorpay order creation
- Razorpay payment signature verification
- Booking history / My Orders
- Booking cancellation and Razorpay refund initiation
- Booking deletion
- Completed-stay Reality Check feedback with 7 structured ratings
- Reality Check feedback editing
- AI-assisted property discovery through the existing AI backend
- Legacy EJS routes/views remain in the backend as a fallback/reference

## Important booking fix

The React version now returns JSON after Razorpay signature verification instead of redirecting an Axios request to an EJS page. The frontend then opens the confirmed booking page directly.

It also checks confirmed bookings for overlapping dates before creating a Razorpay order, reducing accidental double-booking of the same property.

## Extra UI/features added

- Premium responsive travel UI
- Animated hero section with Framer Motion
- Category discovery pills
- Better property cards with ratings/category badges
- Owner dashboard actions for edit/delete
- Add/edit listing UI with image preview
- Secure booking summary with live nights/tax/discount/total calculation
- Booking confirmation page
- Mapped property location preview
- Profile/security page
- Reality Check rating UI
- Mobile-responsive navigation and user dropdown
- Toast feedback for common actions

## Local setup

### 1. Backend

```powershell
cd backend
npm install
copy .env.example .env
npm run dev
```

Backend runs on `http://localhost:8080`.

Fill `backend/.env` with the same MongoDB, session, Mapbox, Cloudinary, Razorpay and optional OpenAI values used by the original project.

### 2. Frontend

Open a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

Vite proxies `/api` to the backend, so browser requests and Passport session cookies stay same-origin during local development.

## Demo account

The original backend creates this demo user if it does not already exist:

- Username: `delta-student`
- Password: `helloworld`

Remove that behavior before production if a demo account is not desired.

## Environment variable names

Backend uses:

```text
ATLASDB_URL
SECRET
MAP_TOKEN
CLOUD_NAME
CLOUD_API_KEY
CLOUD_API_SECRET
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
OPENAI_API_KEY        # optional
OPENAI_MODEL          # optional
NODE_ENV
```

Frontend:

```text
VITE_API_URL=/api
```

Never commit `.env` files or real API keys.
