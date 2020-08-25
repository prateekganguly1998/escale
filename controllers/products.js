const Product = require("../models/product");
const Business = require("../models/Business");
const ITEMS_PER_PAGE = 3;
var fs = require("fs");
const { validationResult } = require("express-validator/check");
var path = require("path");
const upload = require("../config/s3Service");
const singleUpload = upload.single("image");

exports.getProducts = (req, res, next) => {
    var page = +req.query.page || 1;
    var totalItems;
    Product.find()
        .count()
        .then((numProducts) => {
            totalItems = numProducts;
            return Product.find()
                .populate("userId")
                .skip((page - 1) * ITEMS_PER_PAGE)
                .limit(ITEMS_PER_PAGE);
        })
        .then((products) => {
            console.log(products);
            res.render("products", {
                prods: products,
                docTitle: "Products",
                path: "/",
                currentPage: page,
                hasNextPage: ITEMS_PER_PAGE * page < totalItems,
                hasPreviousPage: page > 1,
                nextPage: page + 1,
                previousPage: page - 1,
                lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
            });
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getAdminProducts = (req, res, next) => {
    Product.find({ userId: req.user._id })
        .populate("userId", "username")
        .then((products) => {
            console.log(products);
            res.render("admin-products", {
                prods: products,
                docTitle: "Admin Products",
                path: "/admin/products",
            });
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getEditProduct = (req, res, next) => {
    const editMode = req.query.edit;
    console.log(editMode);
    if (!editMode) {
        return res.redirect("/");
    }
    const prodId = req.params.productId;
    Business.find({ userId: req.session.user._id })
        .then((businesses) => {
            Product.findById(prodId)
                .then((product) => {
                    if (!product) {
                        return res.redirect("/");
                    }
                    res.render("edit-product", {
                        docTitle: "Edit Product",
                        path: "/edit-product",
                        editing: editMode,
                        product: product,
                        hasError: false,
                        businesses: businesses,
                        errorMessage: null,
                        validationErrors: [],
                    });
                })
                .catch((err) => {
                    const error = new Error(err);
                    error.httpStatusCode = 500;
                    return next(error);
                });
        })
        .catch((err) => {
            console.log(err);
        });
};

exports.postEditProduct = (req, res, next) => {
    const prodId = req.body.productId;
    const updatedTitle = req.body.title;
    const updatedPrice = req.body.price;
    const updatedDesc = req.body.description;
    const updatedBusiness = req.body.business;
    console.log(req.body);

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).render("admin/edit-product", {
            docTitle: "Edit Product",
            path: "/admin/edit-product",
            editing: true,
            hasError: true,
            product: {
                title: updatedTitle,
                businesssId: updatedBusiness,
                price: updatedPrice,
                description: updatedDesc,
                _id: prodId,
            },
            errorMessage: errors.array()[0].msg,
            validationErrors: errors.array(),
        });
    }

    Product.findById(prodId)
        .then(async (product) => {
            if (product.userId.toString() !== req.user._id.toString()) {
                return res.redirect("/");
            }
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
                imageUrl = product.imageUrl;
            }
            product.title = updatedTitle;
            product.price = updatedPrice;
            product.businessId = updatedBusiness;
            product.description = updatedDesc;
            product.imageUrl = imageUrl;
            console.log(product);

            return product.save().then((result) => {
                console.log("UPDATED PRODUCT!");
                res.redirect("/admin/products");
            });
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.deleteProduct = (req, res, next) => {
    const prodId = req.params.productId;
    Product.findById(prodId)
        .then((product) => {
            console.log(product);
            if (!product) {
                return next(new Error("Product Not Found"));
            }
            return Product.deleteOne({ _id: prodId, userId: req.user._id });
        })
        .then(() => {
            console.log("DESTROYED PRODUCT");
            res.status(200).json({ message: "Success!" });
        })
        .catch((err) => {
            res.status(500).json({ message: "Deleting Product Failed." });
        });
};

exports.getAddProduct = (req, res, next) => {
    const currentUser = req.session.user._id;
    Business.find({ userId: currentUser._id })
        .then((businesses) => {
            res.render("edit-product", {
                docTitle: "Add Product",
                path: "/add-product",
                editing: false,
                businesses: businesses,
                hasError: false,
                errorMessage: null,
                validationErrors: [],
            });
        })
        .catch((err) => {
            res.status(503).json({ message: "Could not fetch busineses" });
        });
};

exports.postAddProduct = async (req, res, next) => {
    const title = req.body.title;
    const price = req.body.price;
    const description = req.body.description;
    const businessDetails = req.body.business;
    console.log(req.body);
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        console.log(errors.array());
        return res.status(422).render("edit-product", {
            docTitle: "Add Product",
            path: "/add-product",
            editing: false,
            hasError: true,
            product: {
                title: title,
                price: price,
                description: description,
                businesses: businessDetails,
            },
            errorMessage: errors.array()[0].msg,
            validationErrors: errors.array(),
        });
    }
    //  var prefix=image.path.split('\\')[0];
    //  var suffix=image.path.split('\\')[1];

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

    const product = new Product({
        // _id: new mongoose.Types.ObjectId('5badf72403fd8b5be0366e81'),
        title: title,
        price: price,
        description: description,
        imageUrl: imageUrl,
        userId: req.user,
        businessId: businessDetails.split(":")[0],
    });
    console.log(product);
    product
        .save()
        .then((result) => {
            // console.log(result);
            console.log("Created Product");
            res.redirect("/admin/products");
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};
