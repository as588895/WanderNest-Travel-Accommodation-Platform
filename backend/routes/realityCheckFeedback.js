const express = require("express");
const router = express.Router({ mergeParams: true });
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn } = require("../middleware.js");
const feedbackController = require("../controllers/realityCheckFeedback.js");

// POST - Create feedback (form submission)
router.post(
    "/bookings/:bookingId/reality-check-feedback",
    isLoggedIn,
    wrapAsync(feedbackController.createFeedback)
);

// GET - Render feedback form for a booking
router.get(
    "/bookings/:bookingId/reality-check-feedback",
    isLoggedIn,
    wrapAsync(feedbackController.renderFeedbackForm)
);

// GET - Render existing feedback for editing
router.get(
    "/reality-check-feedback/:feedbackId/edit",
    isLoggedIn,
    wrapAsync(feedbackController.renderEditForm)
);

// PUT - Update existing feedback
router.put(
    "/reality-check-feedback/:feedbackId",
    isLoggedIn,
    wrapAsync(feedbackController.updateFeedback)
);

// GET - Fetch feedback for a listing (API endpoint for future dashboard)
router.get(
    "/listings/:listingId/reality-check-feedback",
    wrapAsync(feedbackController.getFeedbackForListing)
);

module.exports = router;
