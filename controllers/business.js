const { validationResult } = require("express-validator/check");
const Business = require("../models/Business");

exports.getAdminBusiness = (req, res, next) => {
    Business.find({ userId: req.user._id })
        .populate("userId", "username")
        .then((businesses) => {
            console.log(businesses);
            res.render("business", {
                businesses: businesses,
                docTitle: "Admin Businesses",
                path: "/business",
            });
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postAdminBusiness = (req, res, next) => {
    const currentUser = req.session.user;
    const name = req.body.name;
    const email = req.body.email;
    const registrationNo = req.body.registrationNo;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        console.log(errors.array());
        return res.status(422).render("edit-product", {
            docTitle: "Add Business",
            path: "/add-business",
            editing: false,
            hasError: true,
            businesses: {
                email: email,
                name: name,
                registrationNo: registrationNo,
            },
            errorMessage: errors.array()[0].msg,
            validationErrors: errors.array(),
        });
    }

    const business = new Business({
        // _id: new mongoose.Types.ObjectId('5badf72403fd8b5be0366e81'),
        email: email,
        name: name,
        registrationNo: registrationNo,
        userId: currentUser._id,
    });
    business
        .save()
        .then((result) => {
            // console.log(result);
            console.log("Created Business");
            res.redirect("/business");
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getAddBusiness = (req, res, next) => {
    res.render("add-business", {
        docTitle: "Add Business",
        path: "/add-business",
        editing: false,
        hasError: false,
        oldInput: "",
        errorMessage: null,
        validationErrors: [],
    });
};
