const invModel = require("../models/inventoryModel");
const utilities = require("../utils/");

/* ***************************
 *  Build inventory detail view
 * ************************** */
async function buildVehicleDetailPage(req, res, next) {
  try {
    const inv_id = req.params.inv_id;
    const data = await invModel.getInventoryByInvId(inv_id);
    if (data) {
      const grid = await utilities.buildInventoryDetailGrid(data);
      res.render("./inventory/detail", {
        title: data.inv_year + " " + data.inv_make + " " + data.inv_model + " details",
        grid, // The HTML grid for the vehicle details
      });
    } else {
      // Handle case where no data is found for the inv_id
      // This will eventually be a proper 404 error page
      const err = new Error("Vehicle not found");
      err.status = 404;
      next(err);
    }
  } catch (error) {
    console.error("buildVehicleDetailPage error " + error);
    next(error); // Pass to the main error handler
  }
}

/* ***************************
 *  Build inventory by classification view
 * ************************** */
async function buildClassificationView(req, res, next) {
  try {
    const classificationId = req.params.classificationId;
    const data = await invModel.getInventoryByClassificationId(classificationId);
    const grid = await utilities.buildClassificationGrid(data);
    const className = data.length ? data[0].classification_name : '';
    res.render("./inventory/classification", {
      title: `${className} Vehicles`,
      grid,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { buildVehicleDetailPage, buildClassificationView };
