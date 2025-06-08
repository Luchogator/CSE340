const pool = require('./database');

async function testData() {
  try {
    // Test classifications
    console.log('Testing classifications...');
    const classResult = await pool.query('SELECT * FROM classification ORDER BY classification_name');
    console.log('Classifications:', classResult.rows);

    // Test inventory for first classification
    if (classResult.rows.length > 0) {
      const firstClassId = classResult.rows[0].classification_id;
      console.log(`\nTesting inventory for classification ID: ${firstClassId}`);
      
      const invResult = await pool.query(
        `SELECT i.inv_id, i.inv_make, i.inv_model, i.inv_year, i.inv_thumbnail
         FROM inventory i 
         WHERE i.classification_id = $1 
         LIMIT 5`,
        [firstClassId]
      );
      
      console.log('Sample vehicles:', invResult.rows);
      
      if (invResult.rows.length > 0) {
        console.log('\nSample vehicle details:', JSON.stringify(invResult.rows[0], null, 2));
      } else {
        console.log('No vehicles found for this classification');
      }
    } else {
      console.log('No classifications found in the database');
    }
  } catch (error) {
    console.error('Error testing data:', error);
  } finally {
    await pool.end();
    process.exit();
  }
}

testData();
