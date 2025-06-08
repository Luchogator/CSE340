const invModel = require('../models/inventoryModel');

// Helper function to create URL-friendly slugs
function slugify(name) {
  return name.trim().toLowerCase().replace(/\s+/g, '-');
}

async function getNav() {
  try {
    const classifications = await invModel.getClassifications();
    let html = '<ul role="menubar">';
    
    // Add Home link
    html += '<li role="none"><a href="/" role="menuitem">Home</a></li>';
    
    // Add Custom link right after Home
    html += `
      <li role="none">
        <a href="/inv/classification/custom" role="menuitem">
          Custom
        </a>
      </li>`;
    
    // Add all other classifications
    classifications.forEach(c => {
      const slug = slugify(c.classification_name);
      html += `
        <li role="none">
          <a href="/inv/classification/${slug}" role="menuitem">
            ${c.classification_name}
          </a>
        </li>`;
    });
    
    html += '</ul>';
    return html;
  } catch (error) {
    console.error('Error in getNav:', error);
    // Return a basic navigation with Custom link if there's an error
    return `
      <ul role="menubar">
        <li role="none"><a href="/" role="menuitem">Home</a></li>
        <li role="none"><a href="/inv/classification/custom" role="menuitem">Custom</a></li>
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
      if (!v.inv_id || !v.inv_make || !v.inv_model) {
        console.warn('Incomplete vehicle data:', v);
        return; // Skip this vehicle
      }
      
      // Use thumbnail if available, otherwise use main image with _tn suffix
      let imageName = v.inv_thumbnail || 
                   (v.inv_image ? v.inv_image.replace(/(\.[^\.]+)$/, '_tn$1') : 'no-image_tn.jpg');
      
      // Normalize image path
      if (imageName.startsWith('/images/')) {
        imageName = imageName.substring(1); // Remove leading slash if present
      } else if (!imageName.startsWith('images/')) {
        imageName = `images/vehicles/${imageName}`;
      }
      
      // Ensure we don't have double slashes
      const imagePath = `/${imageName}`.replace(/\/+/g, '/');
      
      validVehicles++;
      
      // Get the classification slug for the URL
      const classificationSlug = v.classification_name ? slugify(v.classification_name) : 'all';
      
      grid += `
        <li class="vehicle-card">
          <a href="/inv/vehicle/${v.inv_id}" class="vehicle-link">
            <div class="image-container">
              <img src="${imagePath}" 
                   alt="${v.inv_make} ${v.inv_model}" 
                   class="vehicle-image" 
                   onerror="this.onerror=null; this.src='/images/vehicles/no-image_tn.jpg'">
            </div>
            <div class="vehicle-info">
              <h3 class="vehicle-title">${v.inv_year} ${v.inv_make} ${v.inv_model}</h3>
              <p class="vehicle-price">$${new Intl.NumberFormat('en-US').format(v.inv_price)}</p>
            </div>
          </a>
        </li>`;
      
      // Ensure the thumbnail path is correct
      let thumbnailPath = v.inv_thumbnail || 'images/vehicles/no-image_tn.jpg';
      
      // Normalize thumbnail path
      if (thumbnailPath.startsWith('/images/')) {
        thumbnailPath = thumbnailPath.substring(1); // Remove leading slash if present
      } else if (!thumbnailPath.startsWith('images/')) {
        thumbnailPath = `images/vehicles/${thumbnailPath}`;
      }
      
      // Ensure we don't have double slashes
      thumbnailPath = `/${thumbnailPath}`.replace(/\/+/g, '/');
      
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
      return '<p class="notice">No valid vehicles found in this classification.</p>';
    }
    
    return grid;
  } catch (error) {
    console.error('Error in buildClassificationGrid:', error);
    return '<p class="notice">Error loading vehicle data. Please try again later.</p>';
  }
}

async function buildInventoryDetailGrid(item) {
  if (!item) return '<p class="notice">No vehicle data available.</p>';
  
  const { 
    inv_id, 
    inv_make, 
    inv_model, 
    inv_year, 
    inv_description, 
    inv_image, 
    inv_thumbnail, 
    inv_price, 
    inv_miles, 
    inv_color, 
    classification_name,
    classification_id
  } = item;
  
  // Get classification slug for back link
  const classificationSlug = classification_name ? slugify(classification_name) : 'all';
  
  // Format price and mileage
  const formattedPrice = new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(inv_price);
  
  const formattedMiles = new Intl.NumberFormat('en-US').format(inv_miles);
  
  // Build the main image path
  const mainImage = inv_image ? 
    `/images/vehicles/${inv_image}` : 
    '/images/vehicles/no-image.jpg';
  
  // Build the thumbnail path
  const thumbnail = inv_thumbnail ? 
    `/images/vehicles/${inv_thumbnail}` : 
    (inv_image ? 
      `/images/vehicles/${inv_image.replace(/(\.[^\.]+)$/, '_tn$1')}` : 
      '/images/vehicles/no-image_tn.jpg'
    );

  return `
    <div class="vehicle-detail-container">
      <div class="breadcrumb">
        <a href="/">Home</a> &gt; 
        <a href="/inv/classification/${classificationSlug}">${classification_name || 'All Vehicles'}</a> &gt; 
        <span>${inv_year} ${inv_make} ${inv_model}</span>
      </div>
      
      <div class="vehicle-detail-grid">
        <div class="vehicle-images">
          <div class="main-image">
            <img src="${mainImage}" 
                 alt="${inv_year} ${inv_make} ${inv_model}"
                 onerror="this.onerror=null; this.src='/images/vehicles/no-image.jpg'">
          </div>
          <div class="thumbnail-container">
            <img src="${thumbnail}" 
                 alt="${inv_year} ${inv_make} ${inv_model} Thumbnail"
                 class="thumbnail active"
                 onerror="this.onerror=null; this.src='/images/vehicles/no-image_tn.jpg'">
          </div>
        </div>
        
        <div class="vehicle-info">
          <h1 class="vehicle-title">${inv_year} ${inv_make} ${inv_model}</h1>
          
          <div class="price-section">
            <span class="price">${formattedPrice}</span>
            <span class="stock">In Stock</span>
          </div>
          
          <div class="specs">
            <div class="spec">
              <span class="spec-label">Mileage:</span>
              <span class="spec-value">${formattedMiles} miles</span>
            </div>
            <div class="spec">
              <span class="spec-label">Color:</span>
              <span class="spec-value">${inv_color || 'N/A'}</span>
            </div>
          </div>
          
          <div class="description">
            <h3>Description</h3>
            <p>${inv_description || 'No description available for this vehicle.'}</p>
          </div>
          
          <div class="actions">
            <button class="btn primary-btn">Contact Us About This Vehicle</button>
            <a href="/inv/classification/${classificationSlug}" class="btn secondary-btn">Back to ${classification_name || 'Inventory'}</a>
          </div>
        </div>
      </div>
    </div>`;
}

module.exports = { 
  getNav, 
  buildClassificationGrid,
  buildInventoryDetailGrid 
};
