const invModel = require('../models/inventoryModel');

async function getNav() {
  try {
    const classifications = await invModel.getClassifications();
    let html = `
      <ul role="menubar">
        <li role="none"><a href="/" role="menuitem">Home</a></li>
        <li role="none"><a href="/inv/classification/0" role="menuitem">Custom</a></li>
    `;
    classifications.forEach(c => {
      html += `
        <li role="none">
          <a href="/inv/classification/${c.classification_id}" role="menuitem">
            ${c.classification_name}
          </a>
        </li>`;
    });
    html += '</ul>';
    return html;
  } catch (error) {
    console.error('Error in getNav:', error);
    // Return a basic navigation if there's an error
    return `
      <ul role="menubar">
        <li role="none"><a href="/" role="menuitem">Home</a></li>
        <li role="none"><a href="/inv/classification/0" role="menuitem">Custom</a></li>
      </ul>`;
  }
}

async function buildClassificationGrid(data) {
  console.log('Building classification grid with data:', data);
  
  if (!data || data.length === 0) {
    console.log('No vehicle data provided to buildClassificationGrid');
    return '<p class="notice">No vehicles found in this classification.</p>';
  }

  try {
    let grid = '<ul id="inv-display">';
    let validVehicles = 0;
    
    data.forEach((v, index) => {
      console.log(`Processing vehicle ${index + 1}:`, v.inv_make, v.inv_model);
      
      // Check if required fields exist
      if (!v.inv_id || !v.inv_make || !v.inv_model || !v.inv_thumbnail) {
        console.warn('Incomplete vehicle data:', v);
        return; // Skip this vehicle
      }
      
      validVehicles++;
      // Ensure the image path is correct
      let thumbnailPath = v.inv_thumbnail;
      
      // If the path doesn't start with /images/, prepend it
      if (!thumbnailPath.startsWith('/images/')) {
        // Remove any leading slashes to avoid double slashes
        thumbnailPath = thumbnailPath.replace(/^\/+/, '');
        // Add the correct path
        thumbnailPath = `/images/vehicles/${thumbnailPath}`;
      }
      
      console.log('Thumbnail path:', thumbnailPath); // Debug log
      
      grid += `
        <li class="vehicle-card">
          <a href="/inv/detail/${v.inv_id}" class="vehicle-link">
            <div class="vehicle-image-container">
              <img src="${thumbnailPath}" 
                   alt="${v.inv_year} ${v.inv_make} ${v.inv_model}"
                   class="vehicle-thumbnail">
            </div>
            <div class="vehicle-info">
              <h2 class="vehicle-title">
                ${v.inv_year} ${v.inv_make} ${v.inv_model}
              </h2>
              <div class="vehicle-price">
                $${new Intl.NumberFormat('en-US').format(v.inv_price || 0)}
              </div>
            </div>
          </a>
        </li>`;
    });
    
    grid += '</ul>';
    
    if (validVehicles === 0) {
      return '<p class="notice">No valid vehicle data available.</p>';
    }
    
    console.log(`Successfully built grid with ${validVehicles} vehicles`);
    return grid;
  } catch (error) {
    console.error('Error in buildClassificationGrid:', error);
    return '<p class="error">Error loading vehicle data. Please try again later.</p>';
  }
}

async function buildInventoryDetailGrid(itemData) {
  if (!itemData) {
    return '<p class="notice">Sorry, no vehicle information could be found.</p>';
  }
  
  return `
    <div id="vehicle-detail-grid">
      <h2>${itemData.inv_year} ${itemData.inv_make} ${itemData.inv_model}</h2>
      <div class="detail-main-section">
        <img src="${itemData.inv_image}" 
             alt="Image of ${itemData.inv_make} ${itemData.inv_model}">
        <div class="vehicle-info">
          <p><strong>Price:</strong> $${new Intl.NumberFormat('en-US').format(itemData.inv_price)}</p>
          <p><strong>Mileage:</strong> ${new Intl.NumberFormat('en-US').format(itemData.inv_miles)} miles</p>
        </div>
      </div>
      <div class="vehicle-description">
        <p><strong>Color:</strong> ${itemData.inv_color}</p>
        <p><strong>Description:</strong> ${itemData.inv_description}</p>
      </div>
    </div>
  `;
}

module.exports = { 
  getNav, 
  buildClassificationGrid,
  buildInventoryDetailGrid 
};
