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
      // For now, let's just send the data. We will build the HTML view later.
      // const grid = await utilities.buildInventoryDetailGrid(data) // This utility will be created later
      // res.render("./inventory/detail", {
      //   title: data.inv_make + " " + data.inv_model,
      //   grid,
      // })
      const grid = await utilities.buildInventoryDetailGrid(data);
      const nav = await utilities.getNav(); // Assuming getNav might be added to utilities later for navigation
      res.render("./inventory/detail", {
        title: data.inv_year + " " + data.inv_make + " " + data.inv_model + " details",
        nav, // For navigation partial
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

module.exports = { buildVehicleDetailPage };
