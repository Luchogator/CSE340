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
    // Obtener mensaje flash si existe
    const message = req.flash('success') || req.flash('error') || '';
    
    res.render('inventory/management', {
      title: 'Vehicle Management',
      message: message[0] || null, // Tomar el primer mensaje si existe
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
    // For GET requests, req.body will be undefined, so we provide a default empty value
    const classificationName = (req.body && req.body.classification_name) ? req.body.classification_name : '';
    
    res.render('inventory/add-classification', {
      title: 'Add New Classification',
      currentYear: new Date().getFullYear(),
      classification_name: classificationName,
      message: req.flash('error') || req.flash('success') || ''
    });
  } catch (error) {
    console.error('Error in buildAddClassification:', error);
    next(error);
  }
}

// Process add classification form
async function addClassification(req, res, next) {
  try {
    const { classification_name } = req.body;
    
    // Basic validation
    if (!classification_name) {
      req.flash('error', 'Classification name is required');
      return res.redirect('/inv/add-classification');
    }
    
    // For now, just redirect back with success message
    // In a real application, you would save this to the database here
    req.flash('success', 'Classification added successfully!');
    res.redirect('/inv/');
    
  } catch (error) {
    console.error('Error in addClassification:', error);
    req.flash('error', 'An error occurred while adding the classification');
    res.redirect('/inv/add-classification');
  }
}

module.exports = {
  buildByClassificationId,
  buildByVehicleId,
  buildManagementView,
  buildAddClassification,
  addClassification
}
