const crypto = require("crypto");
const Razorpay = require("razorpay");
const Listing = require("../models/listing.js");
const Booking = require("../models/booking.js");
const ExpressError = require("../utils/ExpressError.js");

const TAX_RATE = 0.18;
const LONG_STAY_DISCOUNT_RATE = 0.1;

const getStartOfDay = (value) => {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    return date;
};

const buildBookingInput = ({ checkIn, checkOut, guests }) => {
    const today = getStartOfDay(new Date());
    const start = checkIn ? getStartOfDay(checkIn) : today;
    const end = checkOut ? getStartOfDay(checkOut) : new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const guestCount = Number(guests || 1);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        throw new ExpressError(400, "Invalid check-in/check-out date.");
    }

    if (start < today) {
        throw new ExpressError(400, "Check-in date cannot be in the past.");
    }

    if (end <= start) {
        throw new ExpressError(400, "Check-out must be after check-in.");
    }

    if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > 20) {
        throw new ExpressError(400, "Guests must be between 1 and 20.");
    }

    return {
        checkIn: start,
        checkOut: end,
        guests: guestCount,
    };
};

const buildPriceSummary = (listingPrice, checkIn, checkOut) => {
    const oneDay = 24 * 60 * 60 * 1000;
    const nights = Math.max(1, Math.round((checkOut - checkIn) / oneDay));
    const nightlyPrice = Number(listingPrice) || 0;
    const subtotal = nightlyPrice * nights;
    const taxes = Math.round(subtotal * TAX_RATE);
    const discount = nights >= 5 ? Math.round(subtotal * LONG_STAY_DISCOUNT_RATE) : 0;
    const total = Math.max(0, subtotal + taxes - discount);

    return {
        nights,
        nightlyPrice,
        subtotal,
        taxes,
        discount,
        total,
    };
};

const createRazorpayClient = () => {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
        throw new ExpressError(500, "Razorpay keys are missing in environment variables.");
    }

    return new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
    });
};

module.exports.renderConfirmAndPay = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);

    if (!listing) {
        req.flash("error", "Listing not found.");
        return res.redirect("/listings");
    }

    const bookingInput = buildBookingInput({
        checkIn: req.query.checkIn,
        checkOut: req.query.checkOut,
        guests: req.query.guests,
    });

    const summary = buildPriceSummary(listing.price, bookingInput.checkIn, bookingInput.checkOut);

    res.render("bookings/confirm.ejs", {
        listing,
        bookingInput,
        summary,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID || "",
    });
};

module.exports.createRazorpayOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const listing = await Listing.findById(id);

        if (!listing) {
            return res.status(404).json({ error: "Listing not found." });
        }

        const bookingInput = buildBookingInput(req.body || {});
        const summary = buildPriceSummary(listing.price, bookingInput.checkIn, bookingInput.checkOut);
        const razorpay = createRazorpayClient();

        const order = await razorpay.orders.create({
            amount: summary.total * 100,
            currency: "INR",
            // Razorpay receipt supports max 40 chars.
            receipt: `bk_${Date.now()}`,
            notes: {
                listingId: listing._id.toString(),
                userId: req.user._id.toString(),
            },
        });

        req.session.pendingBooking = {
            listingId: listing._id.toString(),
            checkIn: bookingInput.checkIn.toISOString(),
            checkOut: bookingInput.checkOut.toISOString(),
            guests: bookingInput.guests,
            totalPrice: summary.total,
            razorpayOrderId: order.id,
        };

        return res.json({
            key: process.env.RAZORPAY_KEY_ID,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            name: "WanderNest",
            description: `Booking for ${listing.title}`,
        });
    } catch (err) {
        console.error("createRazorpayOrder error:", err);
        const statusCode = err.statusCode || 500;
        const errorMessage =
            err?.error?.description ||
            err?.description ||
            err?.message ||
            "Unable to create payment order.";

        return res.status(statusCode).json({ error: errorMessage });
    }
};

module.exports.confirmBookingPayment = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);

    if (!listing) {
        req.flash("error", "Listing not found.");
        return res.redirect("/listings");
    }

    const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        checkIn,
        checkOut,
        guests,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        req.flash("error", "Payment verification failed. Please try again.");
        return res.redirect(`/listings/${id}/book`);
    }

    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

    if (expectedSignature !== razorpay_signature) {
        req.flash("error", "Payment signature mismatch.");
        return res.redirect(`/listings/${id}/book`);
    }

    const bookingInput = buildBookingInput({ checkIn, checkOut, guests });
    const summary = buildPriceSummary(listing.price, bookingInput.checkIn, bookingInput.checkOut);
    const pendingBooking = req.session.pendingBooking;

    if (
        pendingBooking &&
        (pendingBooking.razorpayOrderId !== razorpay_order_id ||
            pendingBooking.listingId !== listing._id.toString() ||
            Number(pendingBooking.totalPrice) !== Number(summary.total))
    ) {
        req.flash("error", "Booking session mismatch. Please try payment again.");
        return res.redirect(`/listings/${id}/book`);
    }

    const booking = new Booking({
        user: req.user._id,
        listing: listing._id,
        checkIn: bookingInput.checkIn,
        checkOut: bookingInput.checkOut,
        guests: bookingInput.guests,
        totalPrice: summary.total,
        paymentStatus: "paid",
        bookingStatus: "confirmed",
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
    });

    await booking.save();
    delete req.session.pendingBooking;

    req.flash("success", "Payment successful! Your booking is confirmed.");
    res.redirect(`/listings/bookings/${booking._id}/success`);
};

module.exports.renderBookingSuccess = async (req, res) => {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId).populate("listing").populate("user");

    if (!booking) {
        req.flash("error", "Booking not found.");
        return res.redirect("/listings");
    }

    if (!booking.user._id.equals(req.user._id)) {
        req.flash("error", "You are not allowed to view this booking.");
        return res.redirect("/listings");
    }

    res.render("bookings/success.ejs", { booking });
};

module.exports.renderMyOrders = async (req, res) => {
    const bookings = await Booking.find({ user: req.user._id })
        .populate("listing")
        .sort({ createdAt: -1 });

    res.render("bookings/orders.ejs", { bookings });
};

module.exports.destroyBooking = async (req, res) => {
    const { bookingId } = req.params;
    const deletedBooking = await Booking.findOneAndDelete({
        _id: bookingId,
        user: req.user._id,
    });

    if (!deletedBooking) {
        req.flash("error", "Booking not found or you are not allowed to delete it.");
        return res.redirect("/listings/orders");
    }

    req.flash("success", "Booking deleted successfully.");
    res.redirect("/listings/orders");
};
