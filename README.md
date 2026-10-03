<div align="center">

# 🌍 WanderNest

### Full-Stack Travel & Accommodation Booking Platform

**Discover stays. Explore destinations. Book experiences.**

<br/>

<a href="https://wandernest-7dn2.onrender.com/">
  <img src="https://img.shields.io/badge/🚀%20LIVE%20DEMO-WanderNest-ff385c?style=for-the-badge" />
</a>

<a href="https://github.com/as588895/WanderNest-Travel-Accommodation-Platform">
  <img src="https://img.shields.io/badge/💻%20SOURCE%20CODE-GitHub-181717?style=for-the-badge&logo=github" />
</a>

<a href="https://www.aman-singh.dev/">
  <img src="https://img.shields.io/badge/👨‍💻%20PORTFOLIO-Aman%20Singh-0f172a?style=for-the-badge" />
</a>

<br/><br/>

<img src="https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB"/>
<img src="https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white"/>
<img src="https://img.shields.io/badge/Express.js-000000?style=flat-square&logo=express&logoColor=white"/>
<img src="https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white"/>
<img src="https://img.shields.io/badge/Cloudinary-3448C5?style=flat-square&logo=cloudinary&logoColor=white"/>
<img src="https://img.shields.io/badge/Mapbox-000000?style=flat-square&logo=mapbox&logoColor=white"/>
<img src="https://img.shields.io/badge/Render-46E3B7?style=flat-square&logo=render&logoColor=000000"/>

</div>

---

## ✨ Overview

**WanderNest** is a full-stack travel and accommodation booking platform designed to provide a complete property discovery and booking experience.

Users can **explore destinations, browse accommodations, view property details, create listings, upload images, write reviews, make bookings, and securely manage their accounts** through a REST API powered application.

> 🚀 Built as a real-world full-stack project with authentication, database modeling, cloud storage, maps, payments, API integration, and production deployment.

---

## 🌟 Key Features

<table>
<tr>
<td width="33%">

### 🏠 Listings

- Create & manage properties
- Property details
- Categories & destinations
- Image uploads
- Cloudinary integration

</td>

<td width="33%">

### 🔐 Authentication

- User registration
- Secure login
- Passport.js
- Session management
- Protected routes

</td>

<td width="33%">

### 📅 Booking

- Accommodation booking
- Date-based reservations
- Booking validation
- Booking management
- Payment integration

</td>
</tr>

<tr>
<td>

### ⭐ Reviews

- User reviews
- Ratings
- Review management
- Protected review routes

</td>

<td>

### 🗺️ Maps

- Mapbox integration
- Property locations
- Interactive location data
- Destination visualization

</td>

<td>

### 🤖 AI Assistant

- Travel assistance
- Interactive experience
- AI-powered functionality

</td>
</tr>
</table>

### ⚡ Additional Features

- 🔎 Accommodation & destination discovery
- 📱 Responsive user interface
- ❤️ Wishlist / favorites
- 💳 Razorpay payment integration
- ☁️ Cloudinary image management
- 🗺️ Mapbox location integration
- 🛡️ Protected API routes
- ⚡ RESTful API architecture
- 📊 MongoDB Atlas database
- 🚀 Render deployment

---

## 🧠 Engineering Highlights

WanderNest follows a **modular full-stack architecture** where the frontend communicates with the backend through RESTful APIs.

```text
                         👤 USER
                           │
                           ▼
                ┌────────────────────┐
                │   React + Vite     │
                │    Frontend UI     │
                └─────────┬──────────┘
                          │
                          │ Axios / REST API
                          ▼
                ┌────────────────────┐
                │   Express.js       │
                │    Backend API     │
                └─────────┬──────────┘
                          │
             ┌────────────┼────────────┐
             │            │            │
             ▼            ▼            ▼
        🔐 Passport   🏠 Listings   📅 Booking
        Authentication Business     Management
             │         Logic            │
             └────────────┬────────────┘
                          │
                          ▼
                ┌────────────────────┐
                │   MongoDB Atlas    │
                │     Mongoose       │
                └────────────────────┘
