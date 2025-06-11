const invModel = require("../models/inventory-model")

// Render inventory by classification id
async function buildByClassificationId(req, res, next) {
  const classification_id = parseInt(req.params.classificationId)
  try {
    const data = await invModel.getInventoryByClassificationId(classification_id)
    if (data.rows.length < 1) {
      return res.render("inventory/classification", {
        title: "No vehicles found",
        vehicles: [],
        currentYear: new Date().getFullYear()
      })
    }
    res.render("inventory/classification", {
      title: data.rows[0].classification_id + " Vehicles",
      vehicles: data.rows,
      currentYear: new Date().getFullYear()
    })
  } catch (error) {
    next(error)
  }
}

// Render vehicle detail by inv_id
async function buildByVehicleId(req, res, next) {
  const inv_id = parseInt(req.params.invId)
  try {
    const data = await invModel.getVehicleById(inv_id)
    if (data.rows.length < 1) {
      return res.render("inventory/detail", {
        title: "Vehicle not found",
        vehicle: null,
        currentYear: new Date().getFullYear()
      })
    }
    res.render("inventory/detail", {
      title: data.rows[0].inv_make + " " + data.rows[0].inv_model,
      vehicle: data.rows[0],
      currentYear: new Date().getFullYear()
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  buildByClassificationId,
  buildByVehicleId
}
