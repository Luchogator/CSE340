/* **************************************
* Utilities for CSE 340
* ************************************ */

const invModel = require("../models/inventoryModel");

/* ********************************************************
 *  Function to build the inventory detail HTML
 * **************************************************** */
const buildInventoryDetailGrid = async function(itemData){
  let grid = ''; // Initialize grid as an empty string
  if(itemData){
    grid = '<div id="vehicle-detail-grid">'; // Main container for the vehicle details
    grid += '<h2>' + itemData.inv_year + ' ' + itemData.inv_make + ' ' + itemData.inv_model + '</h2>';
    grid += '<div class="detail-main-section">'; // Section for image and core info
    grid +=   '<img src="' + itemData.inv_image +'" alt="Image of '+ itemData.inv_make + ' ' + itemData.inv_model +'">';
    grid +=   '<div class="vehicle-info">';
    grid +=     '<p><strong>Price:</strong> $' + new Intl.NumberFormat('en-US').format(itemData.inv_price) + '</p>';
    grid +=     '<p><strong>Mileage:</strong> ' + new Intl.NumberFormat('en-US').format(itemData.inv_miles) + ' miles</p>';
    grid +=   '</div>'; // close vehicle-info
    grid += '</div>'; // close detail-main-section
    grid += '<div class="vehicle-description">'; // Section for color and description
    grid +=   '<p><strong>Color:</strong> ' + itemData.inv_color + '</p>';
    grid +=   '<p><strong>Description:</strong> ' + itemData.inv_description + '</p>';
    grid += '</div>'; // close vehicle-description
    grid += '</div>'; // Close vehicle-detail-grid
  } else {
    grid = '<p class="notice">Sorry, no vehicle information could be found.</p>';
  }
  return grid;
}

/* **************************************
 * Build the classification view HTML
 * ************************************ */
async function buildClassificationGrid(data){
  let grid;
  if(data && data.length){
    grid = '<ul id="inv-display">';
    data.forEach(vehicle => {
      grid += `<li>`;
      grid += `<a href="/inv/detail/${vehicle.inv_id}" title="View ${vehicle.inv_make} ${vehicle.inv_model} details">`;
      grid += `<img src="${vehicle.inv_thumbnail}" alt="Image of ${vehicle.inv_make} ${vehicle.inv_model}"></a>`;
      grid += '<div class="namePrice">';
      grid += `<h2><a href="/inv/detail/${vehicle.inv_id}" title="View ${vehicle.inv_make} ${vehicle.inv_model} details">${vehicle.inv_make} ${vehicle.inv_model}</a></h2>`;
      grid += `<span>$${new Intl.NumberFormat('en-US').format(vehicle.inv_price)}</span>`;
      grid += '</div>';
      grid += `</li>`;
    });
    grid += '</ul>';
  }else{
    grid = '<p class="notice">Sorry, no matching vehicles could be found.</p>';
  }
  return grid;
}

async function getNav(){
  const classifications = await invModel.getClassifications();
  const order = ["Custom", "Sedan", "Sport", "SUV", "Truck"];
  classifications.sort((a, b) => order.indexOf(a.classification_name) - order.indexOf(b.classification_name));
  let nav = '';
  nav += '<li role="none">';
  nav += '<a href="/" role="menuitem" tabindex="0">Home</a>';
  nav += '</li>';
  classifications.forEach((row) => {
    nav += '<li role="none">';
    nav += `<a href="/inv/type/${row.classification_id}" role="menuitem" tabindex="0">${row.classification_name}</a>`;
    nav += '</li>';
  });
  return nav;
}

module.exports = { buildInventoryDetailGrid, buildClassificationGrid, getNav };
