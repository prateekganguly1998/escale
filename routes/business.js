const express = require("express");
var isAuth = require("../middleware/isAuth");
const { body } = require("express-validator/check");
const businessController=require('../controllers/business');
const router = express.Router();

router.get('/business',isAuth,businessController.getAdminBusiness);
router.post('/business',isAuth,businessController.postAdminBusiness);
router.get('/add-business',isAuth,businessController.getAddBusiness);

module.exports = router;