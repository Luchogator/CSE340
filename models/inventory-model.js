const pool = require("../database/index.js")

/**
 * Get all classifications
 */
async function getClassifications() {
  return await pool.query(
    "SELECT classification_id, classification_name FROM public.classification ORDER BY classification_name"
  )
}

/**
 * Get inventory by classification_id
 */
async function getInventoryByClassificationId(classification_id) {
  return await pool.query(
    "SELECT * FROM public.inventory WHERE classification_id = $1",
    [classification_id]
  )
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
