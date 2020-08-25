const express = require("express");
var isAuth = require("../middleware/isAuth");
const { body } = require("express-validator/check");
const router = express.Router();
const productController = require("../controllers/products");
router.get("/", isAuth, productController.getProducts);
router.get("/admin/products", isAuth, productController.getAdminProducts);
router.get(
    "/edit-product/:productId",
    isAuth,
    productController.getEditProduct
);

router.post(
    "/edit-product",
    isAuth,
    [
        body("title").isLength({ min: 3 }).trim(),
        body("price").isFloat(),
        body("description").isLength({ min: 3, max: 400 }).trim(),
    ],
    productController.postEditProduct
);

router.delete("/product/:productId", isAuth, productController.deleteProduct);
router.get("/add-product", isAuth, productController.getAddProduct);

// /admin/add-product => POST
router.post(
    "/add-product",
    isAuth,
    [
        body("title").isLength({ min: 3 }).trim(),
        body("price").isFloat(),
        body("description").isLength({ min: 3, max: 400 }).trim(),
    ],
    productController.postAddProduct
);
module.exports = router;
