const invModel = require("../models/inventoryModel");
const utilities = require("../utils/");

/* ***************************
 *  Build inventory detail view
 * ************************** */
async function buildVehicleDetailPage(req, res, next) {
  try {
    console.log('\n=== Starting buildVehicleDetailPage ===');
    
    // Get vehicle ID from URL parameters
    const inv_id = parseInt(req.params.inv_id, 10);
    console.log('Vehicle ID from URL:', inv_id);
    
    if (isNaN(inv_id)) {
      const errorMsg = `Invalid vehicle ID: ${req.params.inv_id}`;
      console.error(errorMsg);
      const err = new Error(errorMsg);
      err.status = 400;
      return next(err);
    }
    
    console.log('Fetching vehicle data for ID:', inv_id);
    const data = await invModel.getInventoryByInvId(inv_id);
    
    if (!data) {
      console.error(`No vehicle found with ID: ${inv_id}`);
      const err = new Error('Vehicle not found');
      err.status = 404;
      return next(err);
    }
    
    console.log('Vehicle data retrieved:', {
      id: data.inv_id,
      year: data.inv_year,
      make: data.inv_make,
      model: data.inv_model
    });
    
    const nav = await utilities.getNav();
    const grid = await utilities.buildInventoryDetailGrid(data);
    
    // Get the classification name for the breadcrumb
    let classificationName = 'All Vehicles';
    if (data.classification_name) {
      classificationName = data.classification_name;
    } else if (data.classification_id) {
      const classification = await invModel.getClassificationById(data.classification_id);
      if (classification) {
        classificationName = classification.classification_name;
      }
    }
    
    // Add classification name to the data object
    data.classification_name = classificationName;
    
    res.render("./inventory/detail", {
      title: `${data.inv_year} ${data.inv_make} ${data.inv_model} | Vehicle Details`,
      nav,
      grid,
      currentYear: new Date().getFullYear(),
      classificationName,
      // Pass the full data object to the view in case we need it
      vehicle: data
    });
    
  } catch (error) {
    console.error('Error in buildVehicleDetailPage:', error);
    next(error);
  }
}

/* ***************************
 *  Build inventory by classification view
 * ************************** */
async function buildClassificationView(req, res, next) {
  try {
    console.log('\n=== Starting buildClassificationView ===');
    
    // Get classification slug from URL parameters
    const classificationSlug = req.params.classificationId.toLowerCase();
    console.log('Classification slug from URL:', classificationSlug);
    
    let classification;
    let classificationName = 'Vehicles';
    let data = [];
    
    // Check if this is the special 'Custom' classification
    if (classificationSlug === 'custom') {
      console.log('Custom classification detected - showing all vehicles');
      classificationName = 'All Vehicles';
      data = await invModel.getAllVehicles();
    } else {
      // Look up the classification by slug
      console.log('Looking up classification by slug:', classificationSlug);
      classification = await invModel.getClassificationBySlug(classificationSlug);
      
      if (!classification) {
        console.error(`No classification found for slug: ${classificationSlug}`);
        const err = new Error('Classification not found');
        err.status = 404;
        return next(err);
      }
      
      console.log(`Found classification: ${classification.classification_name} (ID: ${classification.classification_id})`);
      classificationName = classification.classification_name;
      
      // Get vehicles for this classification
      data = await invModel.getInventoryByClassificationSlug(classificationSlug);
    }
    
    // Generate the vehicle grid HTML
    const grid = await utilities.buildClassificationGrid(data);
    
    // Build the navigation
    const nav = await utilities.getNav();
    
    // Set the current year for the footer
    const currentYear = new Date().getFullYear();
    
    // Render the view
    console.log(`Rendering classification view for: ${classificationName}`);
    res.render('inventory/classification', {
      title: `${classificationName} - Vehicles`,
      nav,
      grid,
      currentYear,
      classificationName,
      classificationSlug
    });
    
  } catch (error) {
    console.error('Error in buildClassificationView:', error);
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
