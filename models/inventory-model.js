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

module.exports = {
  getClassifications,
  getInventoryByClassificationId,
  getVehicleById
}
