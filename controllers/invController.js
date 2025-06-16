const invModel = require("../models/inventory-model")

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
    // Obtener mensajes flash de la sesión
    const flash = req.session.flash || {};
    
    // Preparar el objeto de mensajes para la vista
    const messages = {
      success: flash.success || [],
      error: flash.error || []
    };
    
    // Limpiar los mensajes después de usarlos
    if (req.session.flash) {
      delete req.session.flash;
    }
    
    res.render('inventory/management', {
      title: 'Vehicle Management',
      flash: messages,
      message: messages.success[0] || messages.error[0] || null,
      currentYear: new Date().getFullYear()
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
    } else if (!/^[a-zA-Z\s]+$/.test(classification_name)) {
      errors.push('Classification name must contain only letters and spaces');
    }
    
    // Si hay errores, redirigir de vuelta al formulario
    if (errors.length > 0) {
      console.log('Errores de validación:', errors);
      
      // Guardar mensajes de error en la sesión
      req.session.flash = {
        error: errors
      };
      
      // Guardar datos del formulario en la sesión
      req.session.formData = { classification_name };
      
      console.log('Setting error flash:', req.session.flash);
      
      // Guardar la sesión antes de redirigir
      return req.session.save(() => {
        console.log('Session saved, redirecting to /inv/add-classification');
        res.redirect(303, '/inv/add-classification');
      });
    }
    
    // Aquí iría la lógica para guardar en la base de datos
    // await invModel.addClassification(classification_name);
    
    // Éxito: redirigir con mensaje de éxito
    console.log('Clasificación agregada exitosamente');
    
    // Guardar mensaje de éxito en la sesión
    req.session.flash = {
      success: ['Classification added successfully!']
    };
    
    console.log('Flash message set:', req.session.flash);
    
    // Guardar la sesión antes de redirigir
    return req.session.save(() => {
      console.log('Session saved, redirecting to /inv/');
      res.redirect(303, '/inv/');
    });
    
  } catch (error) {
    console.error('Error al agregar la clasificación:', error);
    
    // En caso de error, redirigir con mensaje de error
    req.session.flash = {
      error: ['An error occurred while adding the classification']
    };
    req.session.formData = { classification_name };
    
    console.log('Error occurred, setting error flash:', req.session.flash);
    
    // Guardar la sesión antes de redirigir
    return req.session.save(() => {
      console.log('Session saved after error, redirecting to /inv/add-classification');
      res.redirect(303, '/inv/add-classification');
    });
  }
}

module.exports = {
  buildByClassificationId,
  buildByVehicleId,
  buildManagementView,
  buildAddClassification,
  addClassification
}
