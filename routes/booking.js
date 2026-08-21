const express = require("express");
const router = express.Router({ mergeParams: true });
const wrapAsync = require("../utils/wrapAsync.js");
const bookingController = require("../controllers/booking.js");
const { isLoggedIn } = require("../middleware.js");

router.get("/:id/book", isLoggedIn, wrapAsync(bookingController.renderConfirmAndPay));
router.post("/:id/book/create-order", isLoggedIn, wrapAsync(bookingController.createRazorpayOrder));
router.post("/:id/book/confirm", isLoggedIn, wrapAsync(bookingController.confirmBookingPayment));
router.get("/bookings/:bookingId/success", isLoggedIn, wrapAsync(bookingController.renderBookingSuccess));
router.delete("/bookings/:bookingId", isLoggedIn, wrapAsync(bookingController.destroyBooking));

module.exports = router;
