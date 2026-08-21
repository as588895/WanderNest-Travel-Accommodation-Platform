if (process.env.NODE_ENV != "production") {
    require("dotenv").config();
}


const express = require("express");
const app = express();
const mongoose = require ("mongoose");
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
const listingController = require("./controllers/listing.js");

// const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";
const dbUrl = process.env.ATLASDB_URL;

main()
.then ( async() => {
    console.log("connected to DB");
    await createDemoUser();
})
.catch ( (err) => {
    console.log(err);
});

async function main() {
    // await mongoose.connect(MONGO_URL);
    await mongoose.connect(dbUrl);
}

async function createDemoUser() {
    try {
        const existingUser = await User.findOne({ username: "delta-student" });
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
};

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.set("view cache", false);
app.set("trust proxy", 1);
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(methodOverride("_method"));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        secret: process.env.SECRET,
    },
    touchAfter: 24 * 3600,
});

store.on("error", (err) => {
    console.log("ERROR in MONGO SESSION STORE", err);
});

const sessionOptions = {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: "auto",
    },
};



app.use(session(sessionOptions));
app.use(flash());             //flash used before routes app.use("/listings", listings)
                            //  app.use("/listings/:id/reviews", reviews);;
app.use(passport.initialize());
app.use(passport.session());
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());  //user related session store called serialize
passport.deserializeUser(User.deserializeUser());  //user related session unstore called deserialize


app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    res.locals.currentUser = req.user;
    next();
});

app.get("/", listingController.index);

// app.get("/demouser", async(req, res) => {
//     try {
//         const existing = await User.findOne({ username: "delta-student" });
//         if (existing) {
//             return res.send(existing);
//         }
//         let fakeUser = new User({
//             email: "student@gmail.com",
//             username: "delta-student",
//         });
//         let registeredUser = await User.register(fakeUser, "helloworld");
//         res.send(registeredUser);
//     } catch(e) {
//         res.send(e.message);
//     }
// });

app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/listings", bookingRouter);
app.use("/ai", aiRouter);
app.use("/", userRouter);

app.use((req, res, next) => {
    next(new ExpressError(404, "Page Not Found!"));
});

app.use((err, req, res, next) => {
    let {statusCode=500, message="something went wrong!"} = err;
    res.status(statusCode).render("error.ejs", { message });
    // res.status(statusCode).send(message);
});

app.listen(8080, () => {
    console.log("server is listening to port 8080");
});