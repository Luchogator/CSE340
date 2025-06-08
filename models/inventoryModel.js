const pool = require("../database"); // Database connection pool

/* ***************************
 *  Get inventory item by inv_id
 * ************************** */
async function getInventoryByInvId(inv_id) {
  try {
    const data = await pool.query(
      `SELECT * FROM public.inventory WHERE inv_id = $1`,
      [inv_id]
    );
    return data.rows[0]; // Should be a single item or undefined
  } catch (error) {
    console.error("getInventoryByInvId error " + error);
    // It's often better to throw the error or handle it in a way that the calling function knows something went wrong.
    // For now, returning null or an empty object might be an option, depending on how you want to handle errors.
    // Throwing the error is generally preferred for the controller to handle.
    throw error;
  }
}

/* ***************************
 *  Get all classifications
 * ************************** */
async function getClassifications() {
  const data = await pool.query(
    "SELECT * FROM public.classification ORDER BY classification_name"
  );
  return data.rows;
}

/* ***************************
 *  Get inventory by classification_id
 * ************************** */
async function getInventoryByClassificationId(classification_id) {
  const data = await pool.query(
    `SELECT i.inv_id, i.inv_make, i.inv_model, i.inv_year, i.inv_price,
            i.inv_thumbnail, c.classification_name
       FROM public.inventory AS i
       JOIN public.classification AS c
         ON i.classification_id = c.classification_id
      WHERE i.classification_id = $1`,
    [classification_id]
  );
  return data.rows;
}

module.exports = {
  getInventoryByInvId,
  getClassifications,
  getInventoryByClassificationId,
};
