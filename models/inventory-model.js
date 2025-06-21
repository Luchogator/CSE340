const pool = require("../database/index.js")

/**
 * Get all classifications
 */
async function getClassifications() {
  try {
    const query =
      "SELECT * FROM public.classification ORDER BY classification_name"
    const result = await pool.query(query)
    return result
  } catch (error) {
    console.error("Error in getClassifications:", error)
    throw error
  }
}

/**
 * Get inventory by classification_id
 */
async function getInventoryByClassificationId(classification_id) {
  try {
    const query = `
      SELECT i.*, c.classification_name 
      FROM public.inventory i 
      INNER JOIN public.classification c 
      ON i.classification_id = c.classification_id 
      WHERE i.classification_id = $1
    `
    console.log("Query:", query)
    console.log("Classification ID:", classification_id)
    const result = await pool.query(query, [classification_id])
    console.log("Query result:", result.rows)
    return result
  } catch (error) {
    console.error("Error in getInventoryByClassificationId:", error)
    throw error
  }
}

/**
 * Get vehicle by inv_id
 */
async function getVehicleById(inv_id) {
  return await pool.query(
    "SELECT * FROM public.inventory WHERE inv_id = $1",
    [inv_id]
  )
}

/**
 * Add a new classification
 */
async function addClassification(classification_name) {
  try {
    const sql = "INSERT INTO classification (classification_name) VALUES ($1) RETURNING *";
    return await pool.query(sql, [classification_name]);
  } catch (error) {
    console.error("Error in addClassification:", error);
    throw error;
  }
}

/**
 * Delete a classification by ID
 */
async function deleteClassification(classification_id) {
  try {
    // Primero verificar si hay vehículos usando esta clasificación
    const vehicles = await pool.query(
      "SELECT * FROM inventory WHERE classification_id = $1",
      [classification_id]
    );
    
    if (vehicles.rows.length > 0) {
      throw new Error('Cannot delete classification that is in use by vehicles');
    }
    
    // Si no hay vehículos, eliminar la clasificación
    const result = await pool.query(
      "DELETE FROM classification WHERE classification_id = $1 RETURNING *",
      [classification_id]
    );
    
    return result.rowCount > 0;
  } catch (error) {
    console.error("Error in deleteClassification:", error);
    throw error;
  }
}

/**
 * Add a new vehicle to inventory
 */
async function addInventory(vehicleData) {
  try {
    const sql = `
      INSERT INTO public.inventory (
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
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    
    const values = [
      vehicleData.classification_id,
      vehicleData.inv_make,
      vehicleData.inv_model,
      vehicleData.inv_year,
      vehicleData.inv_description,
      vehicleData.inv_image,
      vehicleData.inv_thumbnail,
      vehicleData.inv_price,
      vehicleData.inv_miles,
      vehicleData.inv_color
    ];
    
    const result = await pool.query(sql, values);
    return result.rows[0];
  } catch (error) {
    console.error("Error in addInventory:", error);
    throw error;
  }
}

/**
 * Delete a vehicle by ID
 */
async function deleteInventory(inv_id) {
  try {
    const result = await pool.query(
      "DELETE FROM public.inventory WHERE inv_id = $1 RETURNING *",
      [inv_id]
    );
    return result;
  } catch (error) {
    console.error("Error in deleteInventory:", error);
    throw error;
  }
}

/**
 * Update a vehicle by ID
 */
async function updateInventory(inv_id, vehicleData) {
  try {
    const sql = `
      UPDATE public.inventory 
      SET 
        classification_id = $1, 
        inv_make = $2, 
        inv_model = $3, 
        inv_year = $4, 
        inv_description = $5, 
        inv_image = $6, 
        inv_thumbnail = $7, 
        inv_price = $8, 
        inv_miles = $9, 
        inv_color = $10
      WHERE inv_id = $11
      RETURNING *
    `;
    
    const values = [
      vehicleData.classification_id,
      vehicleData.inv_make,
      vehicleData.inv_model,
      vehicleData.inv_year,
      vehicleData.inv_description,
      vehicleData.inv_image,
      vehicleData.inv_thumbnail,
      vehicleData.inv_price,
      vehicleData.inv_miles,
      vehicleData.inv_color,
      inv_id
    ];
    
    const result = await pool.query(sql, values);
    return result.rows[0];
  } catch (error) {
    console.error("Error in updateInventory:", error);
    throw error;
  }
}

/**
 * Update a classification by ID
 */
async function updateClassification(classification_id, classification_name) {
  try {
    const sql = "UPDATE classification SET classification_name = $1 WHERE classification_id = $2 RETURNING *";
    const result = await pool.query(sql, [classification_name, classification_id]);
    return result.rows[0];
  } catch (error) {
    console.error("Error in updateClassification:", error);
    throw error;
  }
}

module.exports = {
  getClassifications,
  getInventoryByClassificationId,
  getVehicleById,
  addClassification,
  deleteClassification,
  addInventory,
  deleteInventory,
  updateInventory,
  updateClassification
};
