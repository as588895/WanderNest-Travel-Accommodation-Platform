if (process.env.NODE_ENV != "production") {
    require("dotenv").config();
}


const express = require("express");
const cors = require("cors");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");


const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const bookingRouter = require("./routes/booking.js");
const aiRouter = require("./routes/ai.js");
const realityCheckFeedbackRouter = require("./routes/realityCheckFeedback.js");
const listingController = require("./controllers/listing.js");


// const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";
const dbUrl = process.env.ATLASDB_URL;

const apiRouter = require("./api.js");


// =====================================================
// DATABASE CONNECTION
// =====================================================

main()
    .then(async () => {
        console.log("connected to DB");
        await createDemoUser();
    })
    .catch((err) => {
        console.log(err);
    });


async function main() {
    // await mongoose.connect(MONGO_URL);
    await mongoose.connect(dbUrl);
}


async function createDemoUser() {
    try {
        const existingUser = await User.findOne({
            username: "delta-student"
        });

        if (!existingUser) {
            const demoUser = new User({
                email: "student@gmail.com",
                username: "delta-student",
            });

            await User.register(demoUser, "helloworld");

            console.log("Demo user 'delta-student' created.");
        }
    } catch (e) {
        console.error("Failed to create demo user:", e);
    }
}


// =====================================================
// APP CONFIGURATION
// =====================================================

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.set("view cache", false);

// Important for Render / reverse proxy
app.set("trust proxy", 1);


// =====================================================
// CORS CONFIGURATION
// =====================================================

// Frontend URLs which are allowed to communicate
// with this backend.

const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",

    // Your deployed frontend
    "https://wandernest-7dn2.onrender.com",
];


app.use(
    cors({
        origin: function (origin, callback) {

            // Allow requests without an origin
            // (Postman, server-to-server, etc.)
            if (!origin) {
                return callback(null, true);
            }

            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            return callback(
                new Error(`CORS blocked for origin: ${origin}`)
            );
        },

        // Required because your frontend uses:
        // axios -> withCredentials: true
        credentials: true,

        methods: [
            "GET",
            "POST",
            "PUT",
            "PATCH",
            "DELETE",
            "OPTIONS"
        ],

        allowedHeaders: [
            "Content-Type",
            "Authorization"
        ]
    })
);


// =====================================================
// BODY PARSERS
// =====================================================

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(methodOverride("_method"));

app.engine("ejs", ejsMate);

app.use(
    express.static(
        path.join(__dirname, "/public")
    )
);


// =====================================================
// MONGO SESSION STORE
// =====================================================

const store = MongoStore.create({
    mongoUrl: dbUrl,

    crypto: {
        secret: process.env.SECRET,
    },

    touchAfter: 24 * 3600,
});


store.on("error", (err) => {
    console.log(
        "ERROR in MONGO SESSION STORE",
        err
    );
});


// =====================================================
// SESSION CONFIGURATION
// =====================================================

const sessionOptions = {
    store,

    secret: process.env.SECRET,

    resave: false,

    saveUninitialized: false,

    cookie: {
        expires:
            Date.now() +
            7 * 24 * 60 * 60 * 1000,

        maxAge:
            7 * 24 * 60 * 60 * 1000,

        httpOnly: true,

        // HTTPS on Render
        secure:
            process.env.NODE_ENV === "production",

        // Required when frontend/backend
        // are on different domains
        sameSite:
            process.env.NODE_ENV === "production"
                ? "none"
                : "lax",
    },
};


// =====================================================
// SESSION + PASSPORT
// =====================================================

app.use(session(sessionOptions));

app.use(flash());

app.use(passport.initialize());

app.use(passport.session());

passport.use(User.createStrategy());


passport.serializeUser(
    User.serializeUser()
);

passport.deserializeUser(
    User.deserializeUser()
);


// =====================================================
// GLOBAL VARIABLES
// =====================================================

app.use((req, res, next) => {

    res.locals.success =
        req.flash("success");

    res.locals.error =
        req.flash("error");

    res.locals.currUser =
        req.user;

    res.locals.currentUser =
        req.user;

    next();
});


// =====================================================
// REACT API
// =====================================================

app.use("/api", apiRouter);


// =====================================================
// EXISTING EJS ROUTES
// =====================================================

app.get(
    "/",
    listingController.index
);


// =====================================================
// LISTING / REVIEW / BOOKING ROUTES
// =====================================================

app.use(
    "/listings",
    listingRouter
);

app.use(
    "/listings/:id/reviews",
    reviewRouter
);

app.use(
    "/listings",
    bookingRouter
);

app.use(
    "/",
    realityCheckFeedbackRouter
);

app.use(
    "/ai",
    aiRouter
);

app.use(
    "/",
    userRouter
);


// =====================================================
// 404 ERROR
// =====================================================

app.use((req, res, next) => {
    next(
        new ExpressError(
            404,
            "Page Not Found!"
        )
    );
});


// =====================================================
// ERROR HANDLER
// =====================================================

app.use(
    (err, req, res, next) => {

        let {
            statusCode = 500,
            message = "something went wrong!"
        } = err;

        res
            .status(statusCode)
            .render(
                "error.ejs",
                { message }
            );
    }
);


// =====================================================
// SERVER
// =====================================================

// Render provides PORT through environment variable.
// Locally it will use 8080.

const PORT =
    process.env.PORT || 8080;


app.listen(PORT, () => {
    console.log(
        `server is listening to port ${PORT}`
    );
});