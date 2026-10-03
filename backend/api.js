const express = require("express");
const passport = require("passport");
const crypto = require("crypto");
const Listing = require("./models/listing");
const User = require("./models/user");
const Booking = require("./models/booking");
const Review = require("./models/review");
const PasswordResetToken = require("./models/passwordResetToken");
const RealityCheckFeedback = require("./models/realityCheckFeedback");
const { isLoggedIn } = require("./middleware");
const bookingController = require("./controllers/booking");
const aiController = require("./controllers/ai");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const { storage } = require("./cloudConfig");
const multer = require("multer");
const upload = multer({ storage });

const router = express.Router();
const geocodingClient = process.env.MAP_TOKEN
  ? mbxGeocoding({ accessToken: process.env.MAP_TOKEN })
  : null;

const safeUser = (u) =>
  u
    ? {
        id: String(u._id),
        username: u.username,
        email: u.email,
        wishlist: (u.wishlist || []).map(String),
      }
    : null;
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

async function geocode(location) {
  if (!geocodingClient)
    throw Object.assign(
      new Error(
        "MAP_TOKEN is missing. Add it to backend/.env to create or edit listings.",
      ),
      { statusCode: 500 },
    );
  const response = await geocodingClient
    .forwardGeocode({ query: location, limit: 1 })
    .send();
  const feature = response.body.features?.[0];
  if (!feature)
    throw Object.assign(new Error("Location could not be found on the map."), {
      statusCode: 400,
    });
  return feature.geometry;
}

function listingPayload(body) {
  const l = body?.listing || {};
  return {
    title: l.title?.trim(),
    description: l.description?.trim(),
    location: l.location?.trim(),
    country: l.country?.trim(),
    price: Number(l.price),
    category: l.category || undefined,
  };
}

async function ownerOr403(req, res, id) {
  const listing = await Listing.findById(id);
  if (!listing) {
    res.status(404).json({ error: "Listing not found." });
    return null;
  }
  if (!listing.owner || String(listing.owner) !== String(req.user._id)) {
    res
      .status(403)
      .json({ error: "You are not allowed to modify this listing." });
    return null;
  }
  return listing;
}

router.get("/health", (req, res) =>
  res.json({ ok: true, service: "WanderNest API" }),
);
router.get("/auth/me", (req, res) =>
  res.json({ authenticated: !!req.user, user: safeUser(req.user) }),
);

router.post("/auth/signup", async (req, res, next) => {
  try {
    const { username, email, password } = req.body || {};
    if (!username || !email || !password)
      return res
        .status(400)
        .json({ error: "Username, email and password are required." });
    if (password.length < 6)
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters." });
    const user = await User.register(
      new User({
        username: username.trim(),
        email: email.trim().toLowerCase(),
      }),
      password,
    );
    req.login(user, (err) => {
      if (err) return next(err);
      req.session.save((saveErr) =>
        saveErr
          ? next(saveErr)
          : res
              .status(201)
              .json({
                message: "Welcome to WanderNest!",
                user: safeUser(user),
              }),
      );
    });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post("/auth/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);
    if (!user)
      return res
        .status(401)
        .json({ error: info?.message || "Invalid username or password" });
    req.session.regenerate((sessionErr) => {
      if (sessionErr) return next(sessionErr);
      req.logIn(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        req.session.save((saveErr) =>
          saveErr
            ? next(saveErr)
            : res.json({
                message: "Welcome back to WanderNest!",
                user: safeUser(user),
              }),
        );
      });
    });
  })(req, res, next);
});

router.post("/auth/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy((sessionErr) => {
      if (sessionErr) return next(sessionErr);
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out successfully." });
    });
  });
});

router.post("/auth/change-password", isLoggedIn, async (req, res, next) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body || {};

    // Check all fields
    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        error: "Please fill all password fields.",
      });
    }

    // Minimum password length
    if (newPassword.length < 6) {
      return res.status(400).json({
        error: "New password must be at least 6 characters.",
      });
    }

    // Confirm password
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        error: "New passwords do not match.",
      });
    }

    // Get logged-in user
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        error: "User account not found.",
      });
    }

    // Verify current password
    user.authenticate(
      oldPassword,
      async (err, authenticatedUser, passwordError) => {
        if (err) {
          return next(err);
        }

        // Wrong current password
        if (passwordError || !authenticatedUser) {
          return res.status(400).json({
            error: "Current password is incorrect.",
          });
        }

        try {
          // Set new password
          await user.setPassword(newPassword);

          // Save updated user
          await user.save();

          return res.status(200).json({
            message: "Password changed successfully.",
          });
        } catch (saveError) {
          return next(saveError);
        }
      }
    );
  } catch (e) {
    next(e);
  }
});

router.post("/auth/forgot-password", async (req, res, next) => {
  try {
    const identifier = String(
      req.body?.identifier || req.body?.email || "",
    ).trim();
    if (!identifier)
      return res.status(400).json({ error: "Username or email is required." });
    const user = await User.findOne({
      $or: [{ username: identifier }, { email: identifier.toLowerCase() }],
    });
    if (!user)
      return res
        .status(404)
        .json({ error: "No account found with this username or email." });
    await PasswordResetToken.deleteMany({ userId: user._id });
    const rawToken = crypto.randomBytes(32).toString("hex");
    const token = crypto.createHash("sha256").update(rawToken).digest("hex");
    await PasswordResetToken.create({
      userId: user._id,
      token,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });
    const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password/${rawToken}`;
    console.log(`PASSWORD RESET LINK: ${resetUrl}`);
    res.json({
      message:
        "Reset link generated. Check the backend terminal in local development.",
      resetUrl: process.env.NODE_ENV === "production" ? undefined : resetUrl,
    });
  } catch (e) {
    next(e);
  }
});

router.post("/auth/reset-password/:token", async (req, res, next) => {
  try {
    const { password, confirmPassword } = req.body || {};
    if (!password || password.length < 6)
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters." });
    if (password !== confirmPassword)
      return res.status(400).json({ error: "Passwords do not match." });
    const token = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");
    const reset = await PasswordResetToken.findOne({
      token,
      expiresAt: { $gt: new Date() },
    });
    if (!reset)
      return res
        .status(400)
        .json({ error: "This password reset link is invalid or expired." });
    const user = await User.findById(reset.userId);
    if (!user)
      return res.status(404).json({ error: "User account not found." });
    await user.setPassword(password);
    await user.save();
    await PasswordResetToken.deleteOne({ _id: reset._id });
    res.json({ message: "Password reset successfully. Please login." });
  } catch (e) {
    next(e);
  }
});

router.get("/listings", async (req, res, next) => {
  try {
    const { search = "", category = "" } = req.query;
    const query = {};
    if (category.trim()) query.category = category.trim();
    if (search.trim()) {
      const re = new RegExp(escapeRegex(search.trim()), "i");
      query.$or = [
        { title: re },
        { location: re },
        { country: re },
        { category: re },
      ];
    }
    const listings = await Listing.find(query)
      .populate("owner", "username")
      .lean();
    const wishlist = new Set((req.user?.wishlist || []).map(String));
    res.json({
      listings: listings.map((x) => ({
        ...x,
        isWishlisted: wishlist.has(String(x._id)),
        isOwner:
          !!req.user &&
          String(x.owner?._id || x.owner) === String(req.user._id),
      })),
      searchQuery: search.trim(),
      activeCategory: category.trim(),
    });
  } catch (e) {
    next(e);
  }
});

router.post(
  "/listings",
  isLoggedIn,
  upload.single("image"),
  async (req, res, next) => {
    try {
      const l = listingPayload(req.body);
      if (
        !l.title ||
        !l.description ||
        !l.location ||
        !l.country ||
        !Number.isFinite(l.price) ||
        l.price < 0
      )
        return res
          .status(400)
          .json({
            error:
              "Please provide valid title, description, location, country and price.",
          });
      const geometry = await geocode(l.location);
      const listing = new Listing({ ...l, owner: req.user._id, geometry });
      if (req.file)
        listing.image = { url: req.file.path, filename: req.file.filename };
      else
        listing.image = {
          url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
          filename: "default",
        };
      await listing.save();
      res
        .status(201)
        .json({ message: "Listing created successfully.", listing });
    } catch (e) {
      next(e);
    }
  },
);

router.get("/listings/wishlist", isLoggedIn, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: "wishlist",
        populate: { path: "owner", select: "username" },
      })
      .lean();
    res.json({
      listings: (user?.wishlist || [])
        .filter(Boolean)
        .map((x) => ({
          ...x,
          isWishlisted: true,
          isOwner: String(x.owner?._id || x.owner) === String(req.user._id),
        })),
    });
  } catch (e) {
    next(e);
  }
});

router.get("/listings/:id", async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate({
        path: "reviews",
        populate: { path: "author", select: "username" },
      })
      .populate("owner", "username")
      .lean();
    if (!listing) return res.status(404).json({ error: "Listing not found." });
    const isWishlisted = !!req.user?.wishlist?.some(
      (id) => String(id) === String(listing._id),
    );
    res.json({
      listing,
      isWishlisted,
      isOwner:
        !!req.user &&
        String(listing.owner?._id || listing.owner) === String(req.user._id),
      mapToken: process.env.MAP_TOKEN || "",
    });
  } catch (e) {
    next(e);
  }
});

router.put(
  "/listings/:id",
  isLoggedIn,
  upload.single("image"),
  async (req, res, next) => {
    try {
      const listing = await ownerOr403(req, res, req.params.id);
      if (!listing) return;
      const l = listingPayload(req.body);
      if (
        !l.title ||
        !l.description ||
        !l.location ||
        !l.country ||
        !Number.isFinite(l.price) ||
        l.price < 0
      )
        return res
          .status(400)
          .json({ error: "Please provide valid listing details." });
      Object.assign(listing, l, { geometry: await geocode(l.location) });
      if (req.file)
        listing.image = { url: req.file.path, filename: req.file.filename };
      await listing.save();
      res.json({ message: "Listing updated successfully.", listing });
    } catch (e) {
      next(e);
    }
  },
);
router.delete("/listings/:id", isLoggedIn, async (req, res, next) => {
  try {
    const listing = await ownerOr403(req, res, req.params.id);
    if (!listing) return;
    await Listing.findByIdAndDelete(req.params.id);
    res.json({ message: "Listing deleted successfully." });
  } catch (e) {
    next(e);
  }
});

router.post("/listings/:id/wishlist", isLoggedIn, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!(await Listing.exists({ _id: req.params.id })))
      return res.status(404).json({ error: "Listing not found." });
    if (!(user.wishlist || []).some((id) => String(id) === req.params.id)) {
      user.wishlist.push(req.params.id);
      await user.save();
    }
    res.json({ isWishlisted: true, wishlist: user.wishlist.map(String) });
  } catch (e) {
    next(e);
  }
});
router.delete("/listings/:id/wishlist", isLoggedIn, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    user.wishlist = (user.wishlist || []).filter(
      (id) => String(id) !== req.params.id,
    );
    await user.save();
    res.json({ isWishlisted: false, wishlist: user.wishlist.map(String) });
  } catch (e) {
    next(e);
  }
});

router.get("/orders", isLoggedIn, async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate("listing")
      .sort({ createdAt: -1 })
      .lean();
    res.json({ bookings });
  } catch (e) {
    next(e);
  }
});
router.get("/orders/:bookingId", isLoggedIn, async (req, res, next) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.bookingId,
      user: req.user._id,
    })
      .populate("listing")
      .populate("user", "username email")
      .lean();
    if (!booking) return res.status(404).json({ error: "Booking not found." });
    res.json({ booking });
  } catch (e) {
    next(e);
  }
});

router.post("/listings/:id/reviews", isLoggedIn, async (req, res, next) => {
  try {
    const { rating, comment } = req.body || {};
    const n = Number(rating);
    if (!Number.isInteger(n) || n < 1 || n > 5 || !String(comment || "").trim())
      return res
        .status(400)
        .json({ error: "Rating 1-5 and a comment are required." });
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: "Listing not found." });
    const review = await Review.create({
      rating: n,
      comment: String(comment).trim(),
      author: req.user._id,
    });
    listing.reviews.push(review._id);
    await listing.save();
    res
      .status(201)
      .json({
        review: await Review.findById(review._id)
          .populate("author", "username")
          .lean(),
      });
  } catch (e) {
    next(e);
  }
});
router.delete(
  "/listings/:id/reviews/:reviewId",
  isLoggedIn,
  async (req, res, next) => {
    try {
      const review = await Review.findById(req.params.reviewId);
      if (!review || String(review.author) !== String(req.user._id))
        return res
          .status(403)
          .json({ error: "You are not allowed to delete this review." });
      await Listing.findByIdAndUpdate(req.params.id, {
        $pull: { reviews: req.params.reviewId },
      });
      await Review.findByIdAndDelete(req.params.reviewId);
      res.json({ message: "Review deleted." });
    } catch (e) {
      next(e);
    }
  },
);

router.post(
  "/listings/:id/book/create-order",
  isLoggedIn,
  bookingController.createRazorpayOrder,
);
router.post(
  "/listings/:id/book/confirm",
  isLoggedIn,
  bookingController.confirmBookingPayment,
);
router.get(
  "/bookings/:bookingId/success",
  isLoggedIn,
  async (req, res, next) => {
    try {
      const booking = await Booking.findOne({
        _id: req.params.bookingId,
        user: req.user._id,
      })
        .populate("listing")
        .lean();
      if (!booking)
        return res.status(404).json({ error: "Booking not found." });
      res.json({ booking });
    } catch (e) {
      next(e);
    }
  },
);
router.patch(
  "/bookings/:bookingId/cancel",
  isLoggedIn,
  async (req, res, next) => {
    try {
      const booking = await Booking.findOne({
        _id: req.params.bookingId,
        user: req.user._id,
      });
      if (!booking)
        return res.status(404).json({ error: "Booking not found." });
      if (booking.bookingStatus !== "confirmed")
        return res
          .status(400)
          .json({ error: "Only confirmed bookings can be cancelled." });
      const original = res.redirect.bind(res);
      res.redirect = (url) =>
        res.json({ message: "Booking cancelled.", redirect: url });
      await bookingController.cancelBooking(req, res, next);
      res.redirect = original;
    } catch (e) {
      next(e);
    }
  },
);
router.delete("/bookings/:bookingId", isLoggedIn, async (req, res, next) => {
  try {
    const deleted = await Booking.findOneAndDelete({
      _id: req.params.bookingId,
      user: req.user._id,
    });
    if (!deleted) return res.status(404).json({ error: "Booking not found." });
    res.json({ message: "Booking deleted successfully." });
  } catch (e) {
    next(e);
  }
});

router.get(
  "/bookings/:bookingId/reality-check-feedback",
  isLoggedIn,
  async (req, res, next) => {
    try {
      const booking = await Booking.findOne({
        _id: req.params.bookingId,
        user: req.user._id,
      })
        .populate("listing")
        .lean();
      if (!booking)
        return res.status(404).json({ error: "Booking not found." });
      const existing = await RealityCheckFeedback.findOne({
        booking: booking._id,
      }).lean();
      res.json({ booking, feedback: existing });
    } catch (e) {
      next(e);
    }
  },
);
router.post(
  "/bookings/:bookingId/reality-check-feedback",
  isLoggedIn,
  async (req, res, next) => {
    try {
      const booking = await Booking.findOne({
        _id: req.params.bookingId,
        user: req.user._id,
      });
      if (!booking)
        return res.status(404).json({ error: "Booking not found." });
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (
        booking.bookingStatus !== "confirmed" ||
        booking.paymentStatus !== "paid" ||
        booking.checkOut > today
      )
        return res
          .status(400)
          .json({
            error: "Feedback is available only after a completed paid stay.",
          });
      if (await RealityCheckFeedback.exists({ booking: booking._id }))
        return res
          .status(400)
          .json({ error: "Feedback already submitted for this booking." });
      const fields = [
        "cleanliness",
        "wifiQuality",
        "parkingAvailability",
        "roadAccessibility",
        "locationAccuracy",
        "amenitiesAccuracy",
        "hostExperience",
      ];
      const ratings = {};
      for (const f of fields) {
        const n = Number(req.body?.ratings?.[f]);
        if (!Number.isInteger(n) || n < 1 || n > 5)
          return res.status(400).json({ error: `Invalid rating for ${f}.` });
        ratings[f] = n;
      }
      const valid = [
        "better_than_expected",
        "as_described",
        "partially_different",
        "significantly_different",
      ];
      if (!valid.includes(req.body.listingAccuracy))
        return res.status(400).json({ error: "Select listing accuracy." });
      const feedback = await RealityCheckFeedback.create({
        booking: booking._id,
        user: req.user._id,
        listing: booking.listing,
        ratings,
        listingAccuracy: req.body.listingAccuracy,
        comment: String(req.body.comment || "").trim(),
      });
      res
        .status(201)
        .json({ message: "Reality Check feedback submitted.", feedback });
    } catch (e) {
      next(e);
    }
  },
);
router.put(
  "/reality-check-feedback/:feedbackId",
  isLoggedIn,
  async (req, res, next) => {
    try {
      const f = await RealityCheckFeedback.findOne({
        _id: req.params.feedbackId,
        user: req.user._id,
      });
      if (!f) return res.status(404).json({ error: "Feedback not found." });
      const fields = [
        "cleanliness",
        "wifiQuality",
        "parkingAvailability",
        "roadAccessibility",
        "locationAccuracy",
        "amenitiesAccuracy",
        "hostExperience",
      ];
      for (const key of fields) {
        const n = Number(req.body?.ratings?.[key]);
        if (!Number.isInteger(n) || n < 1 || n > 5)
          return res.status(400).json({ error: `Invalid rating for ${key}.` });
        f.ratings[key] = n;
      }
      const valid = [
        "better_than_expected",
        "as_described",
        "partially_different",
        "significantly_different",
      ];
      if (!valid.includes(req.body.listingAccuracy))
        return res.status(400).json({ error: "Select listing accuracy." });
      f.listingAccuracy = req.body.listingAccuracy;
      f.comment = String(req.body.comment || "").trim();
      await f.save();
      res.json({ message: "Feedback updated.", feedback: f });
    } catch (e) {
      next(e);
    }
  },
);
router.get(
  "/listings/:listingId/reality-check-feedback",
  async (req, res, next) => {
    try {
      const listing = await Listing.findById(req.params.listingId);
      if (!listing)
        return res.status(404).json({ error: "Listing not found." });
      const feedback = await RealityCheckFeedback.find({
        listing: req.params.listingId,
      })
        .populate("user", "username")
        .populate("booking", "checkIn checkOut")
        .sort({ createdAt: -1 })
        .lean();
      res.json({
        listing: listing.title,
        feedbackCount: feedback.length,
        feedback,
      });
    } catch (e) {
      next(e);
    }
  },
);

router.post("/ai/chat", aiController.chat);
module.exports = router;
