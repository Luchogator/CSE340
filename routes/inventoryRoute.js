const express = require("express");
const router = new express.Router();
const invController = require("../controllers/invController");

// Route to build inventory by classification view using slug
// This will match URLs like: /inv/classification/custom, /inv/classification/sedan, etc.
router.get("/classification/:classificationId", invController.buildClassificationView);

// Route to build inventory detail view
// This will match URLs like: /inv/detail/1, /inv/detail/2, etc.
router.get("/detail/:inv_id", invController.buildVehicleDetailPage);

module.exports = router;
