const Util = require('../utilities/index');
const invModel = require('../models/inventory-model');

async function buildHome(req, res, next) {
  try {
    const classificationsData = await invModel.getClassifications();
    const classifications = classificationsData.rows;
    res.render('index', {
      title: 'CSE Motors',
      classifications,
      currentYear: new Date().getFullYear()
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { buildHome };
