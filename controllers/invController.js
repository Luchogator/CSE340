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
    console.log('\n=== Starting buildClassificationView ===');
    
    // Get classification ID from URL parameters
    const classificationId = parseInt(req.params.classificationId, 10);
    console.log('Raw classificationId from URL:', req.params.classificationId);
    console.log('Parsed classificationId:', classificationId);
    
    if (isNaN(classificationId)) {
      const errorMsg = `Invalid classification ID: ${req.params.classificationId}`;
      console.error(errorMsg);
      const err = new Error(errorMsg);
      err.status = 400;
      return next(err);
    }
    
    // Get the navigation data
    console.log('Fetching navigation data...');
    const nav = await utilities.getNav();
    console.log('Navigation data retrieved');
    
    // Get the vehicle data for this classification
    console.log(`Fetching vehicles for classification ID: ${classificationId}`);
    let data = [];
    try {
      data = await invModel.getInventoryByClassificationId(classificationId);
      console.log(`Found ${data.length} vehicles for classification ${classificationId}`);
      if (data.length > 0) {
        console.log('First vehicle sample:', JSON.stringify({
          id: data[0].inv_id,
          make: data[0].inv_make,
          model: data[0].inv_model,
          year: data[0].inv_year,
          thumbnail: data[0].inv_thumbnail
        }, null, 2));
      }
    } catch (dbError) {
      console.error('Database error in getInventoryByClassificationId:', dbError);
      return next(dbError);
    }
    
    // Get the classification name for the title
    let className = 'Vehicles';
    try {
      if (data.length > 0 && data[0].classification_name) {
        className = data[0].classification_name + ' Vehicles';
      } else {
        console.log('No vehicles found, fetching classification name from database...');
        const classification = await invModel.getClassificationById(classificationId);
        if (classification) {
          className = classification.classification_name + ' Vehicles';
        }
      }
      console.log('Using classification name for title:', className);
    } catch (nameError) {
      console.error('Error getting classification name:', nameError);
      // Continue with default className if there's an error
    }
    
    // Build the grid HTML
    console.log('Building classification grid...');
    let grid = '<p>No vehicles found in this classification.</p>';
    try {
      grid = await utilities.buildClassificationGrid(data);
      console.log('Grid HTML generated successfully');
    } catch (gridError) {
      console.error('Error generating grid HTML:', gridError);
      // Continue with default grid HTML if there's an error
    }
    
    console.log('Rendering classification view...');
    res.render("./inventory/classification", {
      title: className,
      nav: nav,
      grid: grid,
      currentYear: new Date().getFullYear()
    });
    
    console.log('=== Completed buildClassificationView successfully ===\n');
  } catch (error) {
    console.error('=== ERROR in buildClassificationView ===');
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      status: error.status || 500
    });
    console.error('Request details:', {
      originalUrl: req.originalUrl,
      params: req.params,
      query: req.query
    });
    console.error('=== End of error details ===\n');
    next(error);
  }
}

module.exports = { buildVehicleDetailPage, buildClassificationView };
