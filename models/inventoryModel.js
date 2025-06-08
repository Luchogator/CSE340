const pool = require('../database');

// ***************************
// Get all classifications, ordered by name
// ***************************
async function getClassifications() {
  try {
    const sql = 'SELECT * FROM classification ORDER BY classification_name';
    const result = await pool.query(sql);
    return result.rows;
  } catch (error) {
    console.error('getClassifications error:', error);
    throw error;
  }
}

async function getInventoryByClassificationId(classification_id) {
  try {
    console.log(`Fetching inventory for classification ID: ${classification_id}`);
    const query = {
      text: `
        SELECT 
          i.inv_id, 
          i.inv_make, 
          i.inv_model, 
          i.inv_year, 
          i.inv_price,
          i.inv_thumbnail, 
          c.classification_name
        FROM 
          public.inventory AS i
        JOIN 
          public.classification AS c ON i.classification_id = c.classification_id
        WHERE 
          i.classification_id = $1
        ORDER BY 
          i.inv_make, i.inv_model`,
      values: [classification_id]
    };
    
    console.log('Executing query:', query.text);
    const result = await pool.query(query);
    console.log(`Found ${result.rowCount} vehicles for classification ${classification_id}`);
    
    if (result.rowCount > 0) {
      console.log('Sample vehicle data:', JSON.stringify(result.rows[0], null, 2));
    } else {
      console.log('No vehicles found for this classification');
    }
    
    return result.rows;
  } catch (error) {
    console.error('Error in getInventoryByClassificationId:', error);
    throw error;
  }
}

async function getInventoryByInvId(inv_id) {
  try {
    const data = await pool.query(
      `SELECT * FROM public.inventory WHERE inv_id = $1`,
      [inv_id]
    );
    return data.rows[0];
  } catch (error) {
    console.error("getInventoryByInvId error " + error);
    throw error;
  }
}

async function getClassificationById(classification_id) {
  try {
    const query = {
      text: 'SELECT * FROM public.classification WHERE classification_id = $1',
      values: [classification_id]
    };
    const result = await pool.query(query);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error in getClassificationById:', error);
    throw error;
  }
}

async function getVehicleById(inv_id) {
  try {
    const data = await pool.query(
      `SELECT * FROM public.inventory WHERE inv_id = $1`,
      [inv_id]
    );
    return data.rows[0];
  } catch (error) {
    console.error("getVehicleById error " + error);
    throw error;
  }
}

module.exports = {
  getInventoryByInvId,
  getClassifications,
  getInventoryByClassificationId,
  getClassificationById,
  getVehicleById
};
