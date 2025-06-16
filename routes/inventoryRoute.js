const express = require("express")
const router = express.Router()
const invController = require("../controllers/invController")

// Route for management view
router.get("/", invController.buildManagementView)

// Route to display add classification form and handle form submission
router.route("/add-classification")
  .get(invController.buildAddClassification)  // Display form
  .post(invController.addClassification);    // Handle form submission

// Route for inventory by classification id
router.get("/type/:classificationId", invController.buildByClassificationId)

// Route for vehicle detail by inv_id
router.get("/detail/:invId", invController.buildByVehicleId)

module.exports = router
