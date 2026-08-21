const Listing = require("../models/listing.js");
const User = require("../models/user.js");
const Booking = require("../models/booking.js");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const getWishlistIdSet = async (userId) => {
    if (!userId) return new Set();
    const user = await User.findById(userId).select("wishlist");
    return new Set((user?.wishlist || []).map((id) => id.toString()));
};

module.exports.index = async (req, res) => {
    const { search = "", category = "" } = req.query;
    const trimmedSearch = search.trim();
    const trimmedCategory = category.trim();
    const query = {};

    if (trimmedCategory) {
        query.category = trimmedCategory;
    }

    if (trimmedSearch) {
        const safeSearch = escapeRegex(trimmedSearch);
        const regex = new RegExp(safeSearch, "i");
        query.$or = [
            { title: regex },
            { location: regex },
            { country: regex },
            { category: regex },
        ];
    }

    const allListings = await Listing.find(query);
    const wishlistIds = Array.from(await getWishlistIdSet(req.user?._id));
    res.set("Cache-Control", "no-store");
    res.render("listings/index.ejs", {
        allListings,
        searchQuery: trimmedSearch,
        activeCategory: trimmedCategory,
        wishlistIds,
        isWishlistPage: false,
    });
};

module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id)
        .populate({ "path": "reviews", populate: { path: "author" }, })
        .populate("owner");
    if (!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        return res.redirect("/listings");
    }
    const wishlistIds = await getWishlistIdSet(req.user?._id);
    console.log(listing);
    //    res.render("listings/show.ejs", { listing });
    res.render("listings/show.ejs", {
        listing,
        mapToken: process.env.MAP_TOKEN,
        isWishlisted: wishlistIds.has(listing._id.toString()),
    });
};

module.exports.createListing = async (req, res) => {
    let response = await geocodingClient.forwardGeocode({
        query: req.body.listing.location, // Replace with the desired location
        limit: 1,
    })
        .send();
    req.body.listing.geometry = response.body.features[0].geometry;


    let url = req.file.path;
    let filename = req.file.filename;

    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id; // Set the owner to the current user
    newListing.image = { url, filename }; // Set the image field with the uploaded file's URL and filename

    //newListing.geometry = response.body.features[0].geometry; // Set the geometry field with the geocoded coordinates

    let savedListing = await newListing.save();
    console.log(savedListing);

    req.flash("success", "New Listing Created!");
    res.redirect("/listings");

};

module.exports.renderEditForm = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        return res.redirect("/listings");
    }
    

    // let originalImageUrl = listing.image.url;
    let originalImageUrl = listing.image.url.replace("/upload/", "/upload/w_150"); // This is just an example, adjust the replacement as needed

    res.render("listings/edit.ejs", { listing, originalImageUrl });
};

module.exports.updateListing = async (req, res) => {
    let { id } = req.params;
    // let listing = await Listing.findById(id);
    // let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

    let response = await geocodingClient.forwardGeocode({
        query: req.body.listing.location,
        limit: 1,
    }).send();

    req.body.listing.geometry = response.body.features[0].geometry;

    let listing = await Listing.findByIdAndUpdate(
        id,
        { ...req.body.listing },
        { new: true }
    );

    const uploadedImage = req.files?.["listing[image][url]"]?.[0] || req.files?.["listing[img][url]"]?.[0];

    if (typeof uploadedImage !== "undefined") {
        let url = uploadedImage.path;
        let filename = uploadedImage.filename;
        listing.image = { url, filename }; // Update the image field with the new uploaded file's URL and filename
        await listing.save();
    }
    req.flash("success", "Listing Updated!");
    res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {      //we can write delete or destroy listing
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    req.flash("success", "Listing Deleted!");
    res.redirect("/listings");
};

module.exports.renderWishlist = async (req, res) => {
    const user = await User.findById(req.user._id).populate("wishlist");
    const allListings = (user?.wishlist || []).filter(Boolean);
    const wishlistIds = allListings.map((listing) => listing._id.toString());

    res.set("Cache-Control", "no-store");
    res.render("listings/index.ejs", {
        allListings,
        searchQuery: "",
        activeCategory: "",
        wishlistIds,
        isWishlistPage: true,
    });
};

module.exports.renderOrders = async (req, res) => {
    const bookings = await Booking.find({ user: req.user._id })
        .populate("listing")
        .sort({ createdAt: -1 });

    res.render("bookings/orders.ejs", { bookings });
};

module.exports.addToWishlist = async (req, res) => {
    const { id } = req.params;
    const listingExists = await Listing.exists({ _id: id });

    if (!listingExists) {
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
    }

    const user = await User.findById(req.user._id).select("wishlist");
    user.wishlist = user.wishlist || [];
    const alreadyAdded = user.wishlist.some((listingId) => listingId.equals(id));

    if (!alreadyAdded) {
        user.wishlist.push(id);
        await user.save();
        req.flash("success", "Added to wishlist!");
    }

    const redirectBack = req.get("referer") || "/listings";
    res.redirect(redirectBack);
};

module.exports.removeFromWishlist = async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(req.user._id).select("wishlist");
    user.wishlist = user.wishlist || [];

    user.wishlist = user.wishlist.filter((listingId) => !listingId.equals(id));
    await user.save();

    req.flash("success", "Removed from wishlist!");
    const redirectBack = req.get("referer") || "/listings/wishlist";
    res.redirect(redirectBack);
};
