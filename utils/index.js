/* **************************************
* Utilities for CSE 340
* ************************************ */

/* ********************************************************
 *  Function to build the inventory detail HTML
 *  This will be implemented more fully as per Assignment 3 requirements
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
async function getNav(){
  // For now, let's return a simple navigation structure or an empty string.
  // This will be built dynamically later in the course.
  let nav = "<ul>";
  nav += '<li><a href="/" title="Home page">Home</a></li>';
  // Placeholder for dynamic classification links
  // nav += '<li><a href="/inv/type/1" title="See our Classic cars">Classic</a></li>'; 
  nav += "</ul>";
  return nav;
}

module.exports = { buildInventoryDetailGrid, getNav };
