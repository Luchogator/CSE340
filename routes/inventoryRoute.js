const express = require("express");
const router = new express.Router();
const invController = require("../controllers/invController");

// Route to build inventory detail view
// Example: /inv/detail/1
router.get("/detail/:inv_id", invController.buildVehicleDetailPage);

module.exports = router;
