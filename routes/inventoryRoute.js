const express = require("express")
const router = express.Router()
const invController = require("../controllers/invController")
const validation = require("../utilities/validation")

// Route for management view
router.get("/", invController.buildManagementView)

// Route to display add classification form and handle form submission
router.route("/add-classification")
  .get(invController.buildAddClassification)  // Display form
  .post(
    // Validar los datos del formulario
    validation.validateClassification,
    // Manejar errores de validación
    validation.handleClassificationErrors,
    // Si no hay errores, procesar el formulario
    invController.addClassification
  )

// Route for inventory by classification id
router.get("/type/:classificationId", invController.buildByClassificationId)

// Route for vehicle detail by inv_id
router.get("/detail/:invId", invController.buildByVehicleId)

// Routes for editing inventory
router.get("/edit/:invId", invController.buildEditInventory)
router.post("/update/:invId", invController.updateInventory)

// Routes for editing classification
router.get("/edit-classification/:id", invController.buildEditClassification)
router.post("/update-classification/:id",
  validation.validateClassification,
  invController.updateClassification
)

// Route to delete a classification
router.post("/delete-classification/:id", invController.deleteClassification)

// Route to display add inventory form and handle form submission
router.route("/add-inventory")
  .get(invController.buildAddInventory)  // Display form
  .post(invController.addInventory);    // Handle form submission

// Route to delete a vehicle
router.post("/delete/:invId", invController.deleteVehicle)

module.exports = router
