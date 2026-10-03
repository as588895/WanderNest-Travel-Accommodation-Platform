<div align="center">

# 🌍 WanderNest

### ✈️ Travel & Accommodation Booking Platform

**Discover stays • Explore destinations • Book experiences**

<br />

<a href="https://wandernest-7dn2.onrender.com/">
  <img src="https://img.shields.io/badge/🚀%20LIVE%20DEMO-Visit%20WanderNest-ff385c?style=for-the-badge" />
</a>
&nbsp;
<a href="https://github.com/as588895/WanderNest-Travel-Accommodation-Platform">
  <img src="https://img.shields.io/badge/💻%20GITHUB-Source%20Code-181717?style=for-the-badge&logo=github" />
</a>
&nbsp;
<a href="https://www.aman-singh.dev/">
  <img src="https://img.shields.io/badge/👨‍💻%20PORTFOLIO-Aman%20Singh-0f172a?style=for-the-badge" />
</a>

<br /><br />

<img src="https://img.shields.io/badge/React.js-61DAFB?style=flat-square&logo=react&logoColor=black" />
<img src="https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white" />
<img src="https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white" />
<img src="https://img.shields.io/badge/Express.js-000000?style=flat-square&logo=express&logoColor=white" />
<img src="https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white" />
<img src="https://img.shields.io/badge/Cloudinary-3448C5?style=flat-square&logo=cloudinary&logoColor=white" />
<img src="https://img.shields.io/badge/Mapbox-000000?style=flat-square&logo=mapbox&logoColor=white" />
<img src="https://img.shields.io/badge/Razorpay-3395FF?style=flat-square&logo=razorpay&logoColor=white" />
<img src="https://img.shields.io/badge/Render-46E3B7?style=flat-square&logo=render&logoColor=black" />

</div>

---

## 🏡 What is WanderNest?

**WanderNest** is a full-stack travel and accommodation platform that provides an end-to-end experience for discovering and booking stays.

Users can browse accommodations, search destinations, view detailed property information, manage wishlists, create and manage listings, upload property images, write reviews, make bookings, complete payments, and manage their accounts through a secure authentication system.

The project combines a **React + Vite frontend** with a **Node.js + Express REST API**, **MongoDB Atlas**, session-based authentication, cloud image storage, maps, payment processing, and an AI-powered travel assistant.

> 🎯 **Goal:** Build a production-oriented full-stack application that demonstrates real-world frontend, backend, database, authentication, API integration, and deployment concepts.

---

# ✨ Features

<table>
<tr>

<td width="33%" valign="top">

### 🏠 Accommodation

- Browse available stays
- Search & explore listings
- View detailed property pages
- Create new listings
- Edit existing listings
- Delete owned listings
- Property categories
- Destination & location data
- Cloud image uploads

</td>

<td width="33%" valign="top">

### 🔐 Authentication

- User registration
- Secure login/logout
- Passport.js authentication
- Session-based authentication
- Protected routes
- Change password
- Forgot password flow
- Password reset tokens
- Persistent user sessions

</td>

<td width="33%" valign="top">

### 📅 Booking System

- Date-based bookings
- Guest selection
- Booking validation
- Price calculation
- Tax calculation
- Long-stay discount
- Razorpay order creation
- Payment confirmation
- Booking cancellation
- Booking history

</td>

</tr>

<tr>

<td valign="top">

### ⭐ Reviews & Ratings

- Add reviews
- Rating system
- Delete own reviews
- Protected review actions
- Listing-specific reviews

</td>

<td valign="top">

### ❤️ Wishlist

- Add listings to wishlist
- Remove listings
- View saved accommodations
- User-specific wishlist data

</td>

<td valign="top">

### 🗺️ Location & Maps

- Mapbox integration
- Location geocoding
- Property coordinates
- Location visualization
- Destination-based discovery

</td>

</tr>

<tr>

<td valign="top">

### 🤖 AI Travel Assistant

- Interactive AI assistant
- Destination understanding
- Budget extraction
- Listing matching
- Travel-oriented responses
- Relevant accommodation suggestions

</td>

<td valign="top">

### 🧠 Reality Check

- Booking-related feedback
- Listing feedback flow
- User feedback management
- Feedback connected with listings & bookings

</td>

<td valign="top">

### 💳 Payments

- Razorpay integration
- Secure order creation
- Payment confirmation
- Booking price summary
- Tax & discount calculation

</td>

</tr>
</table>

---

# 🧩 How WanderNest Works

```text
                         👤 USER
                           │
                           ▼
              ┌────────────────────────┐
              │     React + Vite        │
              │      Frontend           │
              └────────────┬───────────┘
                           │
                           │ Axios
                           │ REST API
                           ▼
              ┌────────────────────────┐
              │      Express.js        │
              │       API Layer        │
              └────────────┬───────────┘
                           │
          ┌────────────────┼─────────────────┐
          │                │                 │
          ▼                ▼                 ▼
    🔐 Authentication   🏠 Listings      📅 Booking
    Passport + Session   CRUD Logic       Payments
          │                │                 │
          └────────────────┼─────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │      MongoDB Atlas      │
              │       Mongoose          │
              └────────────────────────┘
                           │
          ┌────────────────┼─────────────────┐
          │                │                 │
          ▼                ▼                 ▼
      ☁️ Cloudinary      🗺️ Mapbox       💳 Razorpay
      Image Storage      Geocoding         Payments
