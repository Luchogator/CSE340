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
    
    // Get classification identifier from URL parameters (could be ID or slug)
    const classificationParam = req.params.classificationId;
    console.log('Classification parameter from URL:', classificationParam);
    
    let classificationId;
    let classificationSlug = classificationParam;
    let classification;
    
    // Check if this is the special 'Custom' classification
    if (classificationParam.toLowerCase() === 'custom') {
      console.log('Custom classification detected - showing all vehicles');
      // Set a special flag to indicate we want all vehicles
      classificationId = 'custom';
      classificationName = 'Custom';
      classificationSlug = 'custom';
    } 
    // Check if the parameter is a number (ID) or a string (slug)
    else if (/^\d+$/.test(classificationParam)) {
      // It's a numeric ID
      classificationId = parseInt(classificationParam, 10);
      console.log('Numeric classification ID detected:', classificationId);
      
      // Get classification by ID to get the slug
      classification = await invModel.getClassificationById(classificationId);
      if (classification) {
        classificationSlug = utilities.slugify(classification.classification_name);
      }
    } else {
      // It's a slug, find the classification by name
      console.log('Slug detected, looking up classification by name...');
      const allClassifications = await invModel.getClassifications();
      classification = allClassifications.find(
        c => utilities.slugify(c.classification_name) === classificationParam
      );
      
      if (classification) {
        classificationId = classification.classification_id;
        console.log(`Found classification: ${classification.classification_name} (ID: ${classificationId})`);
      } else {
        console.error(`No classification found for slug: ${classificationParam}`);
        const err = new Error('Classification not found');
        err.status = 404;
        return next(err);
      }
    }
    
    if (!classificationId || isNaN(classificationId)) {
      const errorMsg = `Invalid classification: ${classificationParam}`;
      console.error(errorMsg);
      const err = new Error(errorMsg);
      err.status = 400;
      return next(err);
    }
    
    // Get the navigation data
    console.log('Fetching navigation data...');
    const nav = await utilities.getNav();
    
    // Get the vehicles for this classification
    let data;
    if (classificationId === 'custom') {
      console.log('Fetching all vehicles for Custom classification...');
      data = await invModel.getAllVehicles();
    } else {
      console.log(`Fetching vehicles for classification ID: ${classificationId}...`);
      data = await invModel.getInventoryByClassificationId(classificationId);
    }
    
    // Set the classification name for the title and breadcrumb if not already set
    if (!classificationName) {
      classificationName = classification ? 
        classification.classification_name : 
        (data[0]?.classification_name || 'Vehicles');
    }
    
    if (!data || data.length === 0) {
      console.log(`No vehicles found for classification ID: ${classificationId}`);
      // Still render the page but with a message
      return res.render("./inventory/classification", {
        title: `${classificationName} Vehicles`,
        nav,
        grid: '<p class="notice">No vehicles found in this classification.</p>',
        currentYear: new Date().getFullYear(),
        classificationName,
        classificationSlug
      });
    }
    
    console.log(`Found ${data.length} vehicles for classification ID: ${classificationId}`);
    
    // Build the grid of vehicles
    const grid = await utilities.buildClassificationGrid(data);
    
    // Render the view with the vehicle grid
    res.render("./inventory/classification", {
      title: `${classificationName} Vehicles`,
      nav,
      grid,
      currentYear: new Date().getFullYear(),
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
