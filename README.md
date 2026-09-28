# 🌍 WanderNest — Travel & Accommodation Booking Platform

<p align="center">
  <b>A full-stack travel & accommodation booking platform for discovering stays, managing properties, booking accommodations and sharing reviews.</b>
</p>

<p align="center">

  <a href="https://wandernest-travel-accommodation-platform.onrender.com/">
    <img src="https://img.shields.io/badge/🌐_Live_Demo-WanderNest-fe424d?style=for-the-badge" />
  </a>

  <a href="https://github.com/as588895/WanderNest-Travel-Accommodation-Platform">
    <img src="https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github" />
  </a>

</p>

---

## ✨ Overview

**WanderNest** is a full-stack travel and accommodation booking platform inspired by modern property-booking applications.

The platform allows users to:

- 🔐 Create an account and securely log in
- 🏡 Explore accommodation listings
- 🔎 Search and discover properties
- 📝 Create, edit and delete their own listings
- ☁️ Upload property images using Cloudinary
- 🗺️ View property locations using Mapbox
- ⭐ Add ratings and reviews
- 💳 Make bookings and payments using Razorpay
- 👤 Manage authenticated user sessions
- 🔑 Change / reset passwords
- 📱 Use the platform through a responsive interface

The application follows an **MVC-based architecture** with a Node.js + Express.js backend and MongoDB database.

---

# 🎯 Problem Statement

Finding suitable accommodations involves searching through multiple platforms, checking property information, viewing locations, reading reviews and completing bookings.

WanderNest brings these core activities together into a single platform with:

- Property discovery
- Listing management
- Interactive maps
- Reviews & ratings
- Authentication & authorization
- Booking workflow
- Payment integration

---

# 🚀 Key Features

## 🔐 Authentication & User Management

- User registration
- Secure login/logout
- Passport.js authentication
- Session management
- Password hashing
- Password change functionality
- Password confirmation validation
- Protected routes
- Authorization middleware

---

## 🏡 Property Listing Management

Authenticated users can:

- Create listings
- View listings
- Edit listings
- Delete listings
- Manage listing information
- Upload property images
- Associate listings with their owners

---

## 🔎 Search & Discovery

Users can:

- Browse available accommodations
- Search destinations
- Explore listing details
- View property information
- Discover properties through categories and locations

---

## ⭐ Reviews & Ratings

Users can:

- Add reviews
- Give ratings
- Read reviews from other users
- Manage their own reviews

This creates a community-driven property discovery experience.

---

## 🗺️ Interactive Maps

WanderNest integrates **Mapbox** to provide location-based visualization.

The system stores geographic information for listings and displays property locations through an interactive map.

---

## ☁️ Cloud Image Upload

Property images are uploaded and managed using:

- Cloudinary
- Multer

This keeps image storage separate from the application server.

---

## 💳 Payment Integration

The booking workflow integrates **Razorpay** for payment processing.

```text
Browse Listing
      ↓
View Property
      ↓
Book Property
      ↓
Payment
      ↓
Booking Confirmation
