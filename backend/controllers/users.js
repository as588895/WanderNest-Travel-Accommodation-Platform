const User = require("../models/user");
const crypto = require("crypto");
const PasswordResetToken = require("../models/passwordResetToken");

module.exports.renderSignupForm = (req, res) => {
    res.render("users/signup.ejs");
};

module.exports.renderLoginForm = (req, res) => {
    res.render("users/login.ejs");
};

module.exports.signup = async(req, res, next) => {
    try {
        let {username, email, password} = req.body;
        const newUser = new User({email, username});
        const registeredUser = await User.register(newUser, password);
        console.log(registeredUser);
        req.login(registeredUser, (err) => {
            if (err) {
                return next(err);
            }
            req.flash("success", "Welcome to WanderNest!");
            res.redirect("/listings");
        });
        
    } catch(e){
      req.flash("error", e.message);
      res.redirect("/signup");
    }
};

module.exports.login = async (req, res) => {
    req.flash("success", "Welcome back to WanderNest!");
    res.redirect(res.locals.redirectUrl || "/listings");

};

module.exports.logout = (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        req.session.destroy((sessionErr) => {
            if (sessionErr) {
                return next(sessionErr);
            }
            res.clearCookie("connect.sid");
            res.redirect("/listings");
        });
    });
};

module.exports.renderForgotPasswordForm = (req, res) => {
    res.render("users/forgot-password.ejs");
};


module.exports.forgotPassword = async (req, res) => {

    try {

        const { email } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            req.flash(
                "error",
                "No account found with this email address."
            );

            return res.redirect("/forgot-password");
        }


        // Delete old reset tokens
        await PasswordResetToken.deleteMany({
            userId: user._id
        });


        // Generate secure token
        const rawToken = crypto.randomBytes(32).toString("hex");


        // Save hashed token
        const hashedToken = crypto
            .createHash("sha256")
            .update(rawToken)
            .digest("hex");


        await PasswordResetToken.create({

            userId: user._id,

            token: hashedToken,

            expiresAt: new Date(
                Date.now() + 15 * 60 * 1000
            )

        });


        const resetURL =
            `${process.env.APP_URL || "http://localhost:8080"}/reset-password/${rawToken}`;


        console.log("====================================");
        console.log("PASSWORD RESET LINK:");
        console.log(resetURL);
        console.log("====================================");


        req.flash(
            "success",
            "If your email is registered, a password reset link has been generated."
        );

        res.redirect("/login");

    } catch (error) {

        console.error(error);

        req.flash(
            "error",
            "Something went wrong. Please try again."
        );

        res.redirect("/forgot-password");
    }
};


module.exports.renderResetPasswordForm = async (req, res) => {

    try {

        const hashedToken = crypto
            .createHash("sha256")
            .update(req.params.token)
            .digest("hex");


        const resetToken = await PasswordResetToken.findOne({
            token: hashedToken,
            expiresAt: { $gt: new Date() }
        });


        if (!resetToken) {

            req.flash(
                "error",
                "This password reset link is invalid or expired."
            );

            return res.redirect("/forgot-password");
        }


        res.render("users/reset-password.ejs", {
            token: req.params.token
        });

    } catch (error) {

        console.error(error);

        req.flash(
            "error",
            "Something went wrong."
        );

        res.redirect("/forgot-password");
    }
};


module.exports.resetPassword = async (req, res) => {

    try {

        const { password, confirmPassword } = req.body;


        if (password !== confirmPassword) {

            req.flash(
                "error",
                "Passwords do not match."
            );

            return res.redirect(
                `/reset-password/${req.params.token}`
            );
        }


        if (password.length < 6) {

            req.flash(
                "error",
                "Password must be at least 6 characters."
            );

            return res.redirect(
                `/reset-password/${req.params.token}`
            );
        }


        const hashedToken = crypto
            .createHash("sha256")
            .update(req.params.token)
            .digest("hex");


        const resetToken = await PasswordResetToken.findOne({
            token: hashedToken,
            expiresAt: { $gt: new Date() }
        });


        if (!resetToken) {

            req.flash(
                "error",
                "This password reset link is invalid or expired."
            );

            return res.redirect("/forgot-password");
        }


        const user = await User.findById(resetToken.userId);


        if (!user) {

            req.flash(
                "error",
                "User account not found."
            );

            return res.redirect("/forgot-password");
        }


        await user.setPassword(password);

        await user.save();


        await PasswordResetToken.deleteOne({
            _id: resetToken._id
        });


        req.flash(
            "success",
            "Password reset successfully. Please login."
        );

        res.redirect("/login");

    } catch (error) {

        console.error(error);

        req.flash(
            "error",
            "Unable to reset password. Please try again."
        );

        res.redirect("/forgot-password");
    }
};

// =========================================================
// CHANGE PASSWORD USING OLD PASSWORD
// =========================================================

module.exports.forgotPasswordWithOldPassword = async (req, res) => {

    try {

        const {
            identifier,
            oldPassword,
            newPassword,
            confirmPassword
        } = req.body;


        // ================================================
        // BASIC VALIDATION
        // ================================================

        if (!identifier || !oldPassword || !newPassword || !confirmPassword) {

            req.flash(
                "error",
                "Please fill all the fields."
            );

            return res.redirect("/forgot-password");
        }


        // ================================================
        // NEW PASSWORD LENGTH
        // ================================================

        if (newPassword.length < 6) {

            req.flash(
                "error",
                "Weak Password. Password must be at least 6 characters."
            );

            return res.redirect("/forgot-password");
        }


        // ================================================
        // PASSWORD MATCH
        // ================================================

        if (newPassword !== confirmPassword) {

            req.flash(
                "error",
                "New passwords do not match."
            );

            return res.redirect("/forgot-password");
        }


        // ================================================
        // FIND USER
        // Username OR Email
        // ================================================

        const user = await User.findOne({
            $or: [
                {
                    username: identifier
                },
                {
                    email: identifier
                }
            ]
        });


        if (!user) {

            req.flash(
                "error",
                "No account found with this username or email."
            );

            return res.redirect("/forgot-password");
        }


        // ================================================
        // CHANGE PASSWORD
        // ================================================

        try {

            await user.changePassword(
                oldPassword,
                newPassword
            );

        } catch (passwordError) {

            console.error(
                "Password verification error:",
                passwordError
            );

            req.flash(
                "error",
                "Old password is incorrect."
            );

            return res.redirect("/forgot-password");
        }


        // ================================================
        // SUCCESS
        // ================================================

        req.flash(
            "success",
            "Password updated successfully. Please login with your new password."
        );


        return res.redirect("/login");


    } catch (error) {

        console.error(
            "CHANGE PASSWORD ERROR:",
            error
        );


        req.flash(
            "error",
            "Unable to update password. Please try again."
        );


        return res.redirect("/forgot-password");
    }

};