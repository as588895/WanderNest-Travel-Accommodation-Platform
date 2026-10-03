const Listing = require("../models/listing");
const Review = require("../models/review");

module.exports.createReview = async(req, res) => {
    console.log(req.params.id);
    let listing = await Listing.findById(req.params.id);
    // let newReview = new Review(req.body.review);
    let newReview = new Review({
        ...req.body.review,
        rating: Number(req.body.review.rating)   // 🔥 IMPORTANT FIX
    });
    newReview.author = req.user._id;
    await newReview.save();

    listing.reviews.push(newReview._id);
    await listing.save();
    req.flash("success", "New Review Created!");
    res.redirect("/listings/" + listing._id);
};

module.exports.destroyReview = async(req, res) => {
        let { id, reviewId} = req.params;

        await Listing.findByIdAndUpdate(id, {$pull: {reviews: reviewId}});
        await Review.findByIdAndDelete(reviewId);
        req.flash("success", "Review Deleted!");
        res.redirect(`/listings/${id}`);
    };