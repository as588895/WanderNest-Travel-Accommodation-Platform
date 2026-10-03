const Listing = require("./models/listing");
const Review = require("./models/review");
const ExpressError = require("./utils/ExpressError");
const { listingSchema, reviewSchema} = require("./schema");


module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.redirectUrl = req.originalUrl;
        const wantsJson = req.xhr || req.get("accept")?.includes("application/json");
        if (wantsJson) {
            return res.status(401).json({ error: "Authentication required. Please log in again." });
        }
        req.flash("error", "You must be signed in first!");
        return res.redirect("/login");
    }
    next();
};

module.exports.saveRedirectUrl = (req, res, next) => {
    if (req.session.redirectUrl) {
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
};

module.exports.isOwner = async (req, res, next) => {
    let { id } = req.params;
    let listing = await Listing.findById(id);
    if (!listing.owner.equals(req.user._id)) {
        req.flash("error", "You are not the owner of this listing!");
        return res.redirect(`/listings/${id}`);
    } else {
        next();
    }
};

module.exports.validateListing = (req, res, next) => {
    const { error } = listingSchema.validate(req.body);
    if (error) {
        const errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }
};

module.exports.validateReview = (req, res, next) => {
     console.log("BODY =>", req.body);
    const { error } = reviewSchema.validate(req.body);
    if (error) {
        console.log(error.details);
        const errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    }
    next();
};

module.exports.isReviewAuthor = async (req, res, next) => {
    let { id, reviewId } = req.params;
    let review = await Review.findById(reviewId);
    if (!review || !review.author.equals(req.user._id)) {
        req.flash("error", "You are not the author of this review!");
        return res.redirect(`/listings/${id}`);
    }
    next();
};