const express = require("express");
const path = require("path");
const User = require("./models/User");
const dotenv = require("dotenv");
dotenv.config();
const bodyParser = require("body-parser");
var mongoose = require("mongoose");
const session = require("express-session");
const MongoDbSession = require("connect-mongodb-session")(session);
var morgan = require("morgan");
var csrf = require("csurf");
var cors = require("cors");
var flash = require("connect-flash");
var multer = require("multer");
const app = express();
const upload = require("./config/s3Service");
const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0-dec2c.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}?retryWrites=true&w=majority`;
var cookieParser = require("cookie-parser");
const adminRoutes = require("./routes/admin");
const productRoutes = require("./routes/product");
const businessRoutes = require("./routes/business");
const store = new MongoDbSession({
    uri: MONGODB_URI,
    collection: "sessions",
});
app.use(morgan("dev"));
var csrfProtection = csrf();

app.set("view engine", "ejs");
app.set("views", "views");
app.use(cors());

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false, limit: "50mb" }));
app.use(bodyParser.json({ limit: "50mb" }));
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
        "Access-Control-Allow-Methods",
        "OPTIONS, GET, POST, PUT, PATCH, DELETE"
    );
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, Connection, Cookie"
    );
    next();
});
app.use(
    session({
        secret: "eScale",
        saveUninitialized: true,
        store: store,
        cookie: { maxAge: 365 * 24 * 60 * 60 * 1000 },
        resave: true,
    })
);
app.use(upload.single("image"));

app.use(express.static(path.join(__dirname, "public")));
app.use("/images", express.static(path.join(__dirname, "images")));

app.use(flash());
app.use((req, res, next) => {
    if (!req.session.user) {
        return next();
    }
    User.findById(req.session.user._id)
        .then((user) => {
            if (!user) {
                return next();
            }
            req.user = user;
            next();
        })
        .catch((err) => {
            throw new Error(err);
        });
});
app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn;

    next();
});

app.use(csrfProtection);
app.use((req, res, next) => {
    res.locals.csrfToken = req.csrfToken();
    next();
});

app.use(adminRoutes);
app.use(productRoutes);
app.use(businessRoutes);

mongoose
    .connect(MONGODB_URI)
    .then((result) => {
        app.listen(process.env.PORT || 3000);
    })
    .catch((err) => console.log(err));
