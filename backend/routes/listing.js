const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const {listingSchema, reviewSchema} = require("../schema.js");
const Listing = require("../models/listing.js");
const {isLoggedIn, isOwner} = require("../middleware.js");
const listingController = require("../controllers/listing.js");
const multer = require('multer');
const { storage } = require("../cloudConfig.js"); 
const upload = multer({ storage }); 
const editImageUploadFields = upload.fields([
    { name: "listing[image][url]", maxCount: 1 },
    { name: "listing[img][url]", maxCount: 1 },
]);

const defaultImageUrl = "https://static.vecteezy.com/system/resources/thumbnails/054/880/166/small/thriving-tree-in-lush-green-environment-nature-conservation-and-protection-concept-free-photo.jpeg";

const validateListing = (req, res, next) => {
    let {error} = listingSchema.validate(req.body);
        
        if(error){
            let errMsg = error.details.map((el) => el.message).join(",");
            throw new ExpressError(400, errMsg);
        }else {
            next();
        }
   };

router.route("/")
.get( wrapAsync(listingController.index))
.post(isLoggedIn, upload.single("listing[image][url]"), wrapAsync(listingController.createListing));


//New Route
 router.get("/new",isLoggedIn, listingController.renderNewForm);
router.get("/wishlist", isLoggedIn, wrapAsync(listingController.renderWishlist));
router.get("/orders", isLoggedIn, wrapAsync(listingController.renderOrders));
router.post("/:id/wishlist", isLoggedIn, wrapAsync(listingController.addToWishlist));
router.delete("/:id/wishlist", isLoggedIn, wrapAsync(listingController.removeFromWishlist));

router.route("/:id")
.get( wrapAsync(listingController.showListing))
.put( isLoggedIn, isOwner, editImageUploadFields, validateListing, wrapAsync(listingController.updateListing))
.delete(isLoggedIn, isOwner, wrapAsync (listingController.destroyListing)
);
   
//Edit Route
   router.get("/:id/edit",isLoggedIn, isOwner, wrapAsync(listingController.renderEditForm));

module.exports = router;