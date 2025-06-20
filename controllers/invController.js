const invModel = require("../models/inventory-model")
const utilities = require("../utilities/index")
const pool = require("../database/index")

// Render inventory by classification id
async function buildByClassificationId(req, res, next) {
  const classification_id = parseInt(req.params.classificationId)
  console.log("Classification ID recibido:", classification_id)
  
  try {
    const classificationsData = await invModel.getClassifications();
    console.log("Todas las clasificaciones:", classificationsData.rows);
    
    const classifications = classificationsData.rows;
    const data = await invModel.getInventoryByClassificationId(classification_id)
    console.log("Datos del inventario:", data.rows)
    
    if (data.rows.length < 1) {
      const classification = classifications.find(c => parseInt(c.classification_id) === classification_id);
      console.log("Clasificación encontrada para no vehicles:", classification)
      const classificationName = classification ? classification.classification_name : 'Unknown';
      return res.render("inventory/classification", {
        title: `${classificationName} Vehicles`,
        vehicles: [],
        classifications,
        currentYear: new Date().getFullYear()
      })
    }

    const classificationName = data.rows[0].classification_name;
    console.log("Nombre de clasificación a usar:", classificationName)
    
    res.render("inventory/classification", {
      title: `${classificationName} Vehicles`,
      vehicles: data.rows,
      classifications,
      currentYear: new Date().getFullYear()
    })
  } catch (error) {
    console.error("Error completo en buildByClassificationId:", error)
    next(error)
  }
}

// Render vehicle detail by inv_id
async function buildByVehicleId(req, res, next) {
  const inv_id = parseInt(req.params.invId)
  try {
    const classificationsData = await invModel.getClassifications();
    const classifications = classificationsData.rows;
    const data = await invModel.getVehicleById(inv_id)
    if (data.rows.length < 1) {
      return res.render("inventory/detail", {
        title: "Vehicle not found",
        vehicle: null,
        classifications,
        currentYear: new Date().getFullYear()
      })
    }
    res.render("inventory/detail", {
      title: data.rows[0].inv_make + " " + data.rows[0].inv_model,
      vehicle: data.rows[0],
      classifications,
      currentYear: new Date().getFullYear()
    })
  } catch (error) {
    next(error)
  }
}

// Render management view
async function buildManagementView(req, res, next) {
  try {
    // Obtener la lista de clasificaciones
    const classificationsResult = await invModel.getClassifications();
    const classifications = classificationsResult.rows;
    
    // Obtener la lista de vehículos con información de clasificación
    const vehiclesResult = await pool.query(`
      SELECT i.*, c.classification_name 
      FROM public.inventory i
      LEFT JOIN public.classification c ON i.classification_id = c.classification_id
      ORDER BY i.inv_make, i.inv_model
    `);
    const vehicles = vehiclesResult.rows;
    
    // Pasar los mensajes, clasificaciones y vehículos a la vista
    res.render('inventory/management', {
      title: 'Vehicle Management',
      currentYear: new Date().getFullYear(),
      messages: res.locals.messages || { success: [], error: [] },
      classifications: classifications,
      vehicles: vehicles
    });
  } catch (error) {
    console.error('Error en buildManagementView:', error);
    next(error);
  }
}

// Render add classification form
async function buildAddClassification(req, res, next) {
  try {
    // Obtener datos del formulario de la sesión
    const formData = (req.session.formData || {});
    
    // Limpiar datos del formulario después de usarlos
    if (req.session.formData) {
      delete req.session.formData;
    }
    
    // Debug logs
    console.log('=== buildAddClassification ===');
    console.log('Messages from session:', res.locals.messages);
    console.log('Form data from session:', formData);
    
    // Renderizar la vista con los datos
    res.render('inventory/add-classification', {
      title: 'Add New Classification',
      currentYear: new Date().getFullYear(),
      formData: formData,
      messages: res.locals.messages || { error: [], success: [] },
      csrfToken: req.csrfToken ? req.csrfToken() : ''
    });
    
  } catch (error) {
    console.error('Error in buildAddClassification:', error);
    next(error);
  }
}

// Process add classification form
async function addClassification(req, res, next) {
  try {
    console.log('=== addClassification ===');
    console.log('Datos recibidos:', req.body);
    
    const { classification_name } = req.body;
    
    // Guardar en la base de datos
    await invModel.addClassification(classification_name);
    
    console.log('Clasificación agregada exitosamente');
    
    // Redirect with success message in URL
    return res.redirect(303, `/inv/?status=success&message=${encodeURIComponent(`Classification "${classification_name}" added successfully`)}`);
    
  } catch (error) {
    console.error('Error adding classification:', error);
    
    // Redirect with error message in URL
    return res.redirect(303, `/inv/add-classification?status=error&message=${encodeURIComponent('Error adding classification')}`);
  }
}

/* **************************
 * Delete a classification
 * ************************** */
async function deleteClassification(req, res, next) {
  const classification_id = parseInt(req.params.id);
  
  try {
    console.log('Attempting to delete classification ID:', classification_id);
    
    if (!classification_id || isNaN(classification_id)) {
      return res.redirect(303, '/inv/?status=error&message=Invalid classification ID');
    }
    
    const deleted = await invModel.deleteClassification(classification_id);
    
    if (deleted) {
      return res.redirect(303, '/inv/?status=success&message=Classification deleted successfully');
    } else {
      return res.redirect(303, '/inv/?status=error&message=Could not delete classification');
    }
    
  } catch (error) {
    console.error('Error deleting classification:', error);
    return res.redirect(303, '/inv/?status=error&message=Error deleting classification');
  }
}

/* **************************
 * Render add inventory form
 * ************************** */
async function buildAddInventory(req, res, next) {
  try {
    const nav = await utilities.getNav()
    const classifications = await invModel.getClassifications()
    
    res.render("inventory/add-inventory", {
      title: "Add New Vehicle",
      nav,
      classifications: classifications.rows,
      formData: req.session.formData || {},
      errors: null,
    })
  } catch (error) {
    console.error('Error in buildAddInventory:', error)
    next(error)
  }
}

// **************************
// Process add inventory form
// ************************** */
async function addInventory(req, res, next) {
  try {
    // Obtener datos del formulario
    const { 
      inv_make, 
      inv_model, 
      inv_year, 
      inv_description, 
      inv_image, 
      inv_thumbnail, 
      inv_price, 
      inv_miles, 
      inv_color, 
      classification_id 
    } = req.body;

    // Validate required fields
    if (!inv_make || !inv_model || !inv_year || !inv_description || !inv_image || 
        !inv_thumbnail || !inv_price || !inv_miles || !inv_color || !classification_id) {
      return res.redirect(`/inv/add-inventory?status=error&message=${encodeURIComponent('All fields are required')}`);
    }

    // Crear objeto con los datos del vehículo
    const invData = {
      inv_make: inv_make.trim(),
      inv_model: inv_model.trim(),
      inv_year: parseInt(inv_year),
      inv_description: inv_description.trim(),
      inv_image: inv_image.trim(),
      inv_thumbnail: inv_thumbnail.trim(),
      inv_price: parseFloat(inv_price),
      inv_miles: parseInt(inv_miles),
      inv_color: inv_color.trim(),
      classification_id: parseInt(classification_id)
    };

    // Insertar en la base de datos
    const result = await invModel.addInventory(invData);

    if (result && result.rowCount > 0) {
      return res.redirect(`/inv/?status=success&message=${encodeURIComponent('Vehicle added successfully')}`);
    } else {
      return res.redirect(`/inv/add-inventory?status=error&message=${encodeURIComponent('Failed to add vehicle')}`);
    }
  } catch (error) {
    console.error('Error adding vehicle:', error);
    return res.redirect(`/inv/add-inventory?status=error&message=${encodeURIComponent('Error processing request')}`);
  }
}

// **************************
// Process delete inventory
// ************************** */
async function deleteInventory(req, res, next) {
  const inv_id = parseInt(req.params.id);
  
  try {
    console.log('Attempting to delete inventory ID:', inv_id);
    
    if (!inv_id || isNaN(inv_id)) {
      return res.redirect(303, '/inv/?status=error&message=Invalid vehicle ID');
    }
    
    // Try to delete the vehicle
    const deleted = await invModel.deleteInventory(inv_id);
    
    if (deleted) {
      return res.redirect(303, '/inv/?status=success&message=Vehicle deleted successfully');
    } else {
      return res.redirect(303, '/inv/?status=error&message=Could not delete vehicle');
    }
    
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    return res.redirect(303, '/inv/?status=error&message=Error deleting vehicle');
  }
}

/* **************************
 * Delete a vehicle
 * ************************** */
async function deleteVehicle(req, res, next) {
  const inv_id = parseInt(req.params.invId);
  
  try {
    console.log('Attempting to delete vehicle ID:', inv_id);
    
    // Check if vehicle exists
    const vehicleResult = await pool.query(
      'SELECT * FROM public.inventory WHERE inv_id = $1', 
      [inv_id]
    );
    
    if (vehicleResult.rows.length === 0) {
      console.log('Vehicle not found with ID:', inv_id);
      req.flash('error', 'Vehicle not found');
      return res.redirect('/inv');
    }
    
    // Delete the vehicle
    await pool.query('DELETE FROM public.inventory WHERE inv_id = $1', [inv_id]);
    
    console.log('Successfully deleted vehicle ID:', inv_id);
    req.flash('success', 'Vehicle was successfully deleted');
    res.redirect('/inv');
    
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    req.flash('error', 'There was an error deleting the vehicle');
    res.redirect('/inv');
  }
}

/* Delete vehicle by ID */
async function deleteVehicle(req, res, next) {
  try {
    const invId = parseInt(req.params.invId);
    
    // Verify vehicle exists
    const vehicle = await pool.query(
      'SELECT * FROM public.inventory WHERE inv_id = $1',
      [invId]
    );
    
    if (vehicle.rows.length === 0) {
      req.flash('error', 'Vehicle not found');
      return res.redirect('/inv');
    }
    
    // Delete the vehicle
    await pool.query(
      'DELETE FROM public.inventory WHERE inv_id = $1',
      [invId]
    );
    
    req.flash('success', 'Vehicle deleted successfully');
    res.redirect('/inv');
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    req.flash('error', 'Error deleting vehicle');
    res.redirect('/inv');
  }
}

module.exports = {
  buildByClassificationId,
  buildByVehicleId,
  deleteVehicle,
  buildManagementView,
  buildAddClassification,
  addClassification,
  deleteClassification,
  buildAddInventory,
  addInventory
}
