const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const wrapAsync = require("../utils/wrapAsync");
const passport = require("passport");
const { saveRedirectUrl } = require("../middleware.js");
const userController = require("../controllers/users.js");

router.route("/signup")
.get( userController.renderSignupForm)
.post( wrapAsync(userController.signup));

router.route("/login")
.get( saveRedirectUrl, userController.renderLoginForm)
.post(saveRedirectUrl, (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            req.flash("error", info?.message || "Invalid username or password");
            return res.redirect("/login");
        }

        req.session.regenerate((sessionErr) => {
            if (sessionErr) {
                return next(sessionErr);
            }

            req.logIn(user, (loginErr) => {
                if (loginErr) {
                    return next(loginErr);
                }

                req.flash("success", "Welcome back to WanderNest!");
                const redirectUrl = res.locals.redirectUrl || "/listings";
                req.session.save((saveErr) => {
                    if (saveErr) {
                        return next(saveErr);
                    }
                    return res.redirect(redirectUrl);
                });
            });
        });
    })(req, res, next);
});

// Forgot Password / Change Password

router.get(
    "/forgot-password",
    userController.renderForgotPasswordForm
);

router.post(
    "/forgot-password",
    userController.forgotPasswordWithOldPassword
);


// Reset Password - existing functionality
router.get(
    "/reset-password/:token",
    userController.renderResetPasswordForm
);

router.post(
    "/reset-password/:token",
    userController.resetPassword
);

router.post("/logout", userController.logout); 

module.exports = router;