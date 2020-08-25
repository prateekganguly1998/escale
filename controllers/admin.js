const crypto = require("crypto");
const nodemailer = require("nodemailer");
const sendgridTransport = require("nodemailer-sendgrid-transport");
const { validationResult } = require("express-validator/check");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const upload = require("../config/s3Service");
const singleUpload = upload.single("image");
const transporter = nodemailer.createTransport(
    sendgridTransport({
        auth: {
            api_key: process.env.NODEMAILER_SECRET,
        },
    })
);

exports.getSignup = (req, res, next) => {
    let message = req.flash("error");
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render("signup", {
        path: "/signup",
        docTitle: "Signup",
        errorMessage: message,
        oldInput: {
            email: "",
            password: "",
            confirmPassword: "",
        },
        validationErrors: [],
    });
};

exports.getLogin = (req, res, next) => {
    let message = req.flash("error");
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render("login", {
        path: "/login",
        docTitle: "Login",
        errorMessage: message,
        oldInput: {
            email: "",
            password: "",
        },
        validationErrors: [],
    });
};

exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).render("login", {
            path: "/login",
            docTitle: "Login",
            errorMessage: errors.array()[0].msg,
            oldInput: {
                email: email,
                password: password,
            },
            validationErrors: errors.array(),
        });
    }

    User.findOne({ email: email })
        .then((user) => {
            if (!user) {
                return res.status(422).render("login", {
                    path: "/login",
                    docTitle: "Login",
                    errorMessage: "Invalid email or password.",
                    oldInput: {
                        email: email,
                        password: password,
                    },
                    validationErrors: [],
                });
            }
            bcrypt
                .compare(password, user.password)
                .then((doMatch) => {
                    if (doMatch) {
                        req.session.isLoggedIn = true;
                        req.session.user = user;
                        return req.session.save((err) => {
                            res.redirect("/");
                        });
                    }
                    return res.status(422).render("login", {
                        path: "/login",
                        docTitle: "Login",
                        errorMessage: "Invalid email or password.",
                        oldInput: {
                            email: email,
                            password: password,
                        },
                        validationErrors: [],
                    });
                })
                .catch((err) => {
                    console.log(err);
                    res.redirect("/login");
                });
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postSignup = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const username = req.body.name;
    // console.log(req.file);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors.array());
        return res.status(422).render("signup", {
            path: "/signup",
            docTitle: "Signup",
            errorMessage: errors.array()[0].msg,
            oldInput: {
                email: email,
                username: username,
                password: password,
                confirmPassword: req.body.confirmPassword,
            },
            validationErrors: errors.array(),
        });
    }

    bcrypt
        .hash(password, 12)
        .then(async (hashedPassword) => {
            var imageUrl = {};
            await singleUpload(req, res, function (err) {
                if (err) {
                    return res.status(422).send({
                        errors: [
                            {
                                title: "Error in uploading image",
                                detail: err.message,
                            },
                        ],
                    });
                }
            });
            if (req.file !== undefined) {
                imageUrl = await req.file.location;
            } else {
                imageUrl = "";
            }
            const user = new User({
                email: email,
                password: hashedPassword,
                username: username,
                imageUrl: imageUrl,
            });
            return user.save();
        })
        .then((result) => {
            res.redirect("/login");
            return transporter.sendMail({
                to: email,
                from: "admin@escale.com",
                subject: "Signup succeeded!",
                html: "<h1>You successfully signed up!</h1>",
            });
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postLogout = (req, res, next) => {
    req.session.destroy((err) => {
        console.log(err);
        res.redirect("/");
    });
};
