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
  const classification_name = (req.body.classification_name || '').trim();
  
  try {
    console.log('=== addClassification ===');
    console.log('Datos recibidos:', { classification_name });
    
    // Validación del lado del servidor
    const errors = [];
    
    if (!classification_name) {
      errors.push('Classification name is required');
    } else if (!/^[A-Za-z]+$/.test(classification_name)) {
      errors.push('Classification name must contain only letters (no spaces, numbers, or special characters)');
    }
    
    // Si hay errores, redirigir de vuelta al formulario
    if (errors.length > 0) {
      console.log('Errores de validación:', errors);
      
      // Usar req.flash para establecer los mensajes de error
      errors.forEach(error => req.flash('error', error));
      
      // Guardar datos del formulario en la sesión
      req.session.formData = { classification_name };
      
      console.log('Error flash set, redirecting to /inv/add-classification');
      
      // Redirigir directamente
      return res.redirect(303, '/inv/add-classification');
    }
    
    // Guardar en la base de datos
    await invModel.addClassification(classification_name);
    
    // Éxito: redirigir con mensaje de éxito
    console.log('Clasificación agregada exitosamente');
    
    // Usar req.flash para establecer el mensaje de éxito
    req.flash('success', `Classification "${classification_name}" added successfully!`);
    
    console.log('Flash message set, redirecting to /inv/');
    
    // Redirigir directamente - connect-flash manejará la sesión
    return res.redirect(303, '/inv/');
    
  } catch (error) {
    console.error('Error al agregar la clasificación:', error);
    
    // Usar req.flash para establecer el mensaje de error
    req.flash('error', 'An error occurred while adding the classification');
    req.session.formData = { classification_name };
    
    console.log('Error occurred, redirecting to /inv/add-classification');
    
    // Redirigir directamente
    return res.redirect(303, '/inv/add-classification');
  }
}

/* **************************
 * Delete a classification
 * ************************** */
async function deleteClassification(req, res, next) {
  const classification_id = parseInt(req.params.id);
  
  try {
    console.log('Attempting to delete classification ID:', classification_id);
    
    // Verificar si el ID es válido
    if (!classification_id || isNaN(classification_id)) {
      req.flash('error', 'Invalid classification ID');
      return res.redirect(303, '/inv/');
    }
    
    // Intentar eliminar la clasificación
    const deleted = await invModel.deleteClassification(classification_id);
    
    if (deleted) {
      req.flash('success', 'Classification deleted successfully!');
    } else {
      req.flash('error', 'Classification not found or could not be deleted');
    }
    
    res.redirect(303, '/inv/');
    
  } catch (error) {
    console.error('Error deleting classification:', error);
    
    // Manejar el error específico de clasificación en uso
    if (error.message.includes('in use by vehicles')) {
      req.flash('error', 'Cannot delete a classification that is being used by vehicles');
    } else {
      req.flash('error', 'An error occurred while deleting the classification');
    }
    
    res.redirect(303, '/inv/');
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

/* **************************
 * Process add inventory form
 * ************************** */
async function addInventory(req, res, next) {
  const {
    classification_id,
    inv_make,
    inv_model,
    inv_year,
    inv_description,
    inv_image,
    inv_thumbnail,
    inv_price,
    inv_miles,
    inv_color
  } = req.body

  // Server-side validation
  const errors = []
  
  if (!classification_id) errors.push('Classification is required')
  if (!inv_make || inv_make.trim() === '') errors.push('Make is required')
  if (!inv_model || inv_model.trim() === '') errors.push('Model is required')
  if (!inv_year || !/^\d{4}$/.test(inv_year)) errors.push('Valid 4-digit year is required')
  if (!inv_description || inv_description.trim() === '') errors.push('Description is required')
  if (!inv_image || inv_image.trim() === '') errors.push('Image path is required')
  if (!inv_thumbnail || inv_thumbnail.trim() === '') errors.push('Thumbnail path is required')
  if (!inv_price || isNaN(inv_price) || parseFloat(inv_price) <= 0) errors.push('Valid price is required')
  if (!inv_miles || isNaN(inv_miles) || parseInt(inv_miles) < 0) errors.push('Valid mileage is required')
  if (!inv_color || inv_color.trim() === '') errors.push('Color is required')

  if (errors.length > 0) {
    // Store form data in session to repopulate form
    req.session.formData = req.body
    req.flash('error', errors.join(', '))
    return res.redirect('/inv/add-inventory')
  }

  try {
    // Add the vehicle to the database
    await invModel.addInventory({
      classification_id: parseInt(classification_id),
      inv_make: inv_make.trim(),
      inv_model: inv_model.trim(),
      inv_year: parseInt(inv_year),
      inv_description: inv_description.trim(),
      inv_image: inv_image.trim(),
      inv_thumbnail: inv_thumbnail.trim(),
      inv_price: parseFloat(inv_price),
      inv_miles: parseInt(inv_miles),
      inv_color: inv_color.trim()
    })

    // Clear form data from session
    if (req.session.formData) {
      delete req.session.formData
    }

    // Set success message and redirect
    req.flash('success', 'Vehicle added successfully!')
    res.redirect('/inv/')
  } catch (error) {
    console.error('Error adding inventory:', error)
    req.session.formData = req.body
    req.flash('error', 'Failed to add vehicle. Please try again.')
    res.redirect('/inv/add-inventory')
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
