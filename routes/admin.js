const express = require("express");
const adminController = require("../controllers/admin");
const { check, body } = require("express-validator/check");
const User = require("../models/User");
const serv=require('../services/testUpload');
const router = express.Router();
router.get("/login", adminController.getLogin);
router.post(
    "/login",
    [
        body("email")
            .isEmail()
            .withMessage("Please enter a valid email address.")
            .normalizeEmail(),
        body("password", "Password has to be valid.")
            .isLength({ min: 5 })
            .trim(),
    ],
    adminController.postLogin
);

router.post("/logout", adminController.postLogout);
router.get("/signup", adminController.getSignup);

router.post(
    "/signup",
    [
        check("email")
            .isEmail()
            .withMessage("Please Enter a valid Email")
            .custom((value, { req }) => {
                return User.findOne({ email: value }).then((userDoc) => {
                    if (userDoc) {
                        return Promise.reject(
                            "E-mail already exists, try something else."
                        );
                    }
                });

                /*if(value==='test2@test.com')
    {
        throw new Error('This Email is forbidden.');
    }
    return true;*/
            })
            .normalizeEmail(),
        body("password", "Please Enter a valid password that meets criteria")
            .isLength({ min: 5 })
            .isAlphanumeric()
            .trim(),
        body("confirmPassword")
            .custom((value, { req }) => {
                if (value !== req.body.password) {
                    throw new Error("Passwords do not match");
                }
                return true;
            })
            .isLength({ min: 5 })
            .isAlphanumeric()
            .trim(),
    ],
    adminController.postSignup
);

module.exports = router;
