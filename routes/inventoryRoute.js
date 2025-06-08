const express = require("express");
const router = new express.Router();
const invController = require("../controllers/invController");

// Route to build inventory by classification view
router.get("/type/:classificationId", invController.buildClassificationView);

// Route to build inventory detail view
router.get("/detail/:inv_id", invController.buildVehicleDetailPage);

module.exports = router;
