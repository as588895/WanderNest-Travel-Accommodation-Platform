const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const realityCheckFeedbackSchema = new Schema(
    {
        booking: {
            type: Schema.Types.ObjectId,
            ref: "Booking",
            required: true,
            unique: true, // Prevent multiple feedback for same booking
        },
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        listing: {
            type: Schema.Types.ObjectId,
            ref: "Listing",
            required: true,
        },
        // Structured Ratings (1-5 scale)
        ratings: {
            cleanliness: {
                type: Number,
                min: 1,
                max: 5,
                required: true,
            },
            wifiQuality: {
                type: Number,
                min: 1,
                max: 5,
                required: true,
            },
            parkingAvailability: {
                type: Number,
                min: 1,
                max: 5,
                required: true,
            },
            roadAccessibility: {
                type: Number,
                min: 1,
                max: 5,
                required: true,
            },
            locationAccuracy: {
                type: Number,
                min: 1,
                max: 5,
                required: true,
            },
            amenitiesAccuracy: {
                type: Number,
                min: 1,
                max: 5,
                required: true,
            },
            hostExperience: {
                type: Number,
                min: 1,
                max: 5,
                required: true,
            },
        },
        // Listing Accuracy Question
        listingAccuracy: {
            type: String,
            enum: [
                "better_than_expected",
                "as_described",
                "partially_different",
                "significantly_different",
            ],
            required: true,
        },
        // Optional feedback comment
        comment: {
            type: String,
            maxlength: 1000,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

// Index for quick lookup of feedback by booking
realityCheckFeedbackSchema.index({ booking: 1 });
realityCheckFeedbackSchema.index({ listing: 1 });
realityCheckFeedbackSchema.index({ user: 1 });

module.exports = mongoose.model("RealityCheckFeedback", realityCheckFeedbackSchema);
