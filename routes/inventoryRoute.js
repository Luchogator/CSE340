const express = require("express")
const router = express.Router()
const invController = require("../controllers/invController")

// Route for inventory by classification id
router.get("/type/:classificationId", invController.buildByClassificationId)

// Route for vehicle detail by inv_id
router.get("/detail/:invId", invController.buildByVehicleId)

module.exports = router
