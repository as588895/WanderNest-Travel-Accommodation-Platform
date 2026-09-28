const RealityCheckFeedback = require("../models/realityCheckFeedback.js");
const Booking = require("../models/booking.js");
const Listing = require("../models/listing.js");
const ExpressError = require("../utils/ExpressError.js");

// Render feedback form (only for completed bookings)
module.exports.renderFeedbackForm = async (req, res) => {
    try {
        const { bookingId } = req.params;

        // Find the booking
        const booking = await Booking.findById(bookingId)
            .populate("user")
            .populate("listing");

        if (!booking) {
            req.flash("error", "Booking not found!");
            return res.redirect("/listings");
        }

        // Check if current user is the booking user
        if (!booking.user._id.equals(req.user._id)) {
            req.flash("error", "You can only submit feedback for your own bookings!");
            return res.redirect("/listings");
        }

        // Check if booking is confirmed (completed)
        if (booking.bookingStatus !== "confirmed") {
            req.flash("error", "Feedback can only be submitted for confirmed bookings!");
            return res.redirect("/listings");
        }

        // Check if payment is completed
        if (booking.paymentStatus !== "paid") {
            req.flash("error", "Feedback can only be submitted for paid bookings!");
            return res.redirect("/listings");
        }

        // Check if checkout date has passed (stay is completed)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (booking.checkOut > today) {
            req.flash("error", "You can submit feedback only after your stay is completed!");
            return res.redirect("/listings");
        }

        // Check if feedback already exists for this booking
        const existingFeedback = await RealityCheckFeedback.findOne({
            booking: bookingId,
        });

        if (existingFeedback) {
            req.flash("error", "You have already submitted feedback for this booking!");
            return res.redirect(`/listings/${booking.listing._id}`);
        }

        res.render("feedback/form.ejs", {
            booking,
            listing: booking.listing,
        });
    } catch (error) {
        req.flash("error", "An error occurred while loading the feedback form!");
        res.redirect("/listings");
    }
};

// Create feedback submission
module.exports.createFeedback = async (req, res) => {
    try {
        const { bookingId } = req.params;
        
        // Fetch booking
        const booking = await Booking.findById(bookingId).populate("user");

        if (!booking) {
            return res.status(404).json({
                error: "Booking not found!",
            });
        }

        // Verify user owns this booking
        if (!booking.user._id.equals(req.user._id)) {
            return res.status(403).json({
                error: "You can only submit feedback for your own bookings!",
            });
        }

        // Verify booking is confirmed
        if (booking.bookingStatus !== "confirmed" || booking.paymentStatus !== "paid") {
            return res.status(400).json({
                error: "Invalid booking status for feedback submission!",
            });
        }

        // Check if stay is completed
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (booking.checkOut > today) {
            return res.status(400).json({
                error: "You can submit feedback only after your stay is completed!",
            });
        }

        // Check for duplicate feedback
        const existingFeedback = await RealityCheckFeedback.findOne({
            booking: bookingId,
        });

        if (existingFeedback) {
            return res.status(400).json({
                error: "You have already submitted feedback for this booking!",
            });
        }

        // Extract and validate ratings from req.body.ratings or form data
        let ratings = {};
        
        // Handle both nested object (ratings.cleanliness) and form notation (ratings[cleanliness])
        if (req.body.ratings) {
            ratings = req.body.ratings;
        } else {
            // If ratings came as form data, they should still be in req.body.ratings
            ratings = req.body.ratings || {};
        }

        console.log("Received ratings:", ratings);

        // Validate ratings exist
        if (!ratings || Object.keys(ratings).length < 7) {
            console.log("Missing ratings. Received:", Object.keys(ratings || {}));
            return res.status(400).json({
                error: "All rating fields are required!",
            });
        }

        // Validate each rating is between 1-5
        const validRatings = [
            "cleanliness",
            "wifiQuality",
            "parkingAvailability",
            "roadAccessibility",
            "locationAccuracy",
            "amenitiesAccuracy",
            "hostExperience",
        ];

        const convertedRatings = {};
        for (const ratingField of validRatings) {
            const rating = Number(ratings[ratingField]);
            console.log(`${ratingField}: ${ratings[ratingField]} => ${rating}`);
            
            if (isNaN(rating) || rating < 1 || rating > 5) {
                return res.status(400).json({
                    error: `Invalid rating for ${ratingField}! Received: ${ratings[ratingField]}`,
                });
            }
            convertedRatings[ratingField] = rating;
        }

        // Validate listingAccuracy
        const { listingAccuracy, comment } = req.body;
        const validAccuracyOptions = [
            "better_than_expected",
            "as_described",
            "partially_different",
            "significantly_different",
        ];

        if (!validAccuracyOptions.includes(listingAccuracy)) {
            return res.status(400).json({
                error: "Invalid listing accuracy selection!",
            });
        }

        // Create feedback
        const newFeedback = new RealityCheckFeedback({
            booking: bookingId,
            user: req.user._id,
            listing: booking.listing,
            ratings: convertedRatings,
            listingAccuracy,
            comment: comment ? comment.trim() : "",
        });

        await newFeedback.save();

        req.flash("success", "Your feedback has been submitted successfully!");
        res.redirect(`/listings/${booking.listing._id}`);
    } catch (error) {
        console.error("Feedback creation error:", error);
        req.flash("error", "An error occurred while submitting your feedback!");
        res.redirect("/listings");
    }
};

// Render the existing feedback for editing by its author only
module.exports.renderEditForm = async (req, res) => {
    try {
        const feedback = await RealityCheckFeedback.findById(req.params.feedbackId)
            .populate("booking")
            .populate("listing");

        if (!feedback) {
            req.flash("error", "Feedback not found!");
            return res.redirect("/listings");
        }

        if (!feedback.user.equals(req.user._id)) {
            req.flash("error", "You can only edit your own feedback!");
            return res.redirect(`/listings/${feedback.listing._id}`);
        }

        res.render("feedback/form.ejs", {
            booking: feedback.booking,
            listing: feedback.listing,
            editingFeedback: feedback,
        });
    } catch (error) {
        req.flash("error", "An error occurred while loading the feedback!");
        res.redirect("/listings");
    }
};

// Update feedback, restricted to the feedback author
module.exports.updateFeedback = async (req, res) => {
    try {
        const feedback = await RealityCheckFeedback.findById(req.params.feedbackId);

        if (!feedback) {
            req.flash("error", "Feedback not found!");
            return res.redirect("/listings");
        }

        if (!feedback.user.equals(req.user._id)) {
            req.flash("error", "You can only edit your own feedback!");
            return res.redirect(`/listings/${feedback.listing}`);
        }

        const ratings = req.body.ratings || {};
        const ratingFields = [
            "cleanliness",
            "wifiQuality",
            "parkingAvailability",
            "roadAccessibility",
            "locationAccuracy",
            "amenitiesAccuracy",
            "hostExperience",
        ];
        const convertedRatings = {};

        for (const field of ratingFields) {
            const rating = Number(ratings[field]);
            if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
                req.flash("error", "Please provide a rating from 1 to 5 for every category!");
                return res.redirect(`/reality-check-feedback/${feedback._id}/edit`);
            }
            convertedRatings[field] = rating;
        }

        const validAccuracyOptions = [
            "better_than_expected",
            "as_described",
            "partially_different",
            "significantly_different",
        ];
        if (!validAccuracyOptions.includes(req.body.listingAccuracy)) {
            req.flash("error", "Please select how accurately the listing matched your stay!");
            return res.redirect(`/reality-check-feedback/${feedback._id}/edit`);
        }

        feedback.ratings = convertedRatings;
        feedback.listingAccuracy = req.body.listingAccuracy;
        feedback.comment = req.body.comment ? req.body.comment.trim() : "";
        await feedback.save();

        req.flash("success", "Your feedback has been updated successfully!");
        res.redirect(`/listings/${feedback.listing}`);
    } catch (error) {
        console.error("Feedback update error:", error);
        req.flash("error", "An error occurred while updating your feedback!");
        res.redirect("/listings");
    }
};

// Get feedback for a listing (for future dashboard/analysis)
module.exports.getFeedbackForListing = async (req, res) => {
    try {
        const { listingId } = req.params;

        const listing = await Listing.findById(listingId);
        if (!listing) {
            return res.status(404).json({ error: "Listing not found!" });
        }

        const feedback = await RealityCheckFeedback.find({
            listing: listingId,
        })
            .populate("user", "username email")
            .populate("booking", "checkIn checkOut");

        res.json({
            listing: listing.title,
            feedbackCount: feedback.length,
            feedback,
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch feedback!" });
    }
};
