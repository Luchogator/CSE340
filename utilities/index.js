const invModel = require("../models/inventory-model")
const path = require('path')

const Util = {}

// Build navigation using IDs with horizontal layout and classes
Util.getNav = async function () {
  let data = await invModel.getClassifications()
  let list = '<ul class="main-nav" role="menubar">'
  list += '<li role="none"><a href="/" class="nav-link" role="menuitem" tabindex="0">HOME</a></li>'
  data.rows.forEach((row) => {
    list += '<li role="none">'
    list +=
      '<a href="/inv/type/' +
      row.classification_id +
      '" class="nav-link" role="menuitem" tabindex="0">' +
      row.classification_name.toUpperCase() +
      '</a>'
    list += '</li>'
  })
  list += '</ul>'
  return list
}

// Build the classification view HTML
Util.buildClassificationGrid = async function(data){
    let grid
    if(data.length > 0){
      grid = '<ul id="inv-display">'
      data.forEach(vehicle => { 
        grid += '<li>'
        grid +=  '<a href="../../inv/detail/'+ vehicle.inv_id 
        + '" title="View ' + vehicle.inv_make + ' '+ vehicle.inv_model 
        + 'details"><img src="' + vehicle.inv_thumbnail 
        +'" alt="Image of '+ vehicle.inv_make + ' ' + vehicle.inv_model 
        +' on CSE Motors" /></a>'
        grid += '<div class="namePrice">'
        grid += '<hr />'
        grid += '<h2>'
        grid += '<a href="../../inv/detail/' + vehicle.inv_id +'" title="View ' 
        + vehicle.inv_make + ' ' + vehicle.inv_model + ' details">' 
        + vehicle.inv_make + ' ' + vehicle.inv_model + '</a>'
        grid += '</h2>'
        grid += '<span>$' 
        + new Intl.NumberFormat('en-US').format(vehicle.inv_price) + '</span>'
        grid += '</div>'
        grid += '</li>'
      })
      grid += '</ul>'
    } else { 
      grid += '<p class="notice">Sorry, no matching vehicles could be found.</p>'
    }
    return grid
}

// Build the vehicle detail HTML
Util.buildSingleVehicleDisplay = async (vehicle) => {
  let svd = '<section id="vehicle-display">'
  svd += "<div>"
  svd += '<section class="imagePrice">'
  svd +=
    "<img src='" +
    vehicle.inv_image +
    "' alt='Image of " +
    vehicle.inv_make +
    " " +
    vehicle.inv_model +
    " on cse motors' id='mainImage'>"
  svd += "</section>"
  svd += '<section class="vehicleDetail">'
  svd += "<h3> " + vehicle.inv_make + " " + vehicle.inv_model + " Details</h3>"
  svd += '<ul id="vehicle-details">'
  svd +=
    "<li><h4>Price: $" +
    new Intl.NumberFormat("en-US").format(vehicle.inv_price) +
    "</h4></li>"
  svd += "<li><h4>Description:</h4> " + vehicle.inv_description + "</li>"
  svd += "<li><h4>Color:</h4> " + vehicle.inv_color + "</li>"
  svd +=
    "<li><h4>Miles:</h4> " +
    new Intl.NumberFormat("en-US").format(vehicle.inv_miles) +
    "</li>"
  svd += "</ul>"
  svd += "</section>"
  svd += "</div>"
  svd += "</section>"
  return svd
}

// Build error page HTML
Util.buildErrorPage = async function(status, message) {
  try {
    const view = path.join(__dirname, '../views/errors/error.ejs');
    const nav = await this.getNav();
    
    const data = {
      status: status,
      message: message,
      title: status === 404 ? '404 - Page Not Found' : '500 - Server Error',
      nav: nav,
      currentYear: new Date().getFullYear()
    };
    
    // Renderizar la plantilla de error
    return await this.render(view, data);
  } catch (error) {
    console.error("Error building error page:", error);
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Error</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          h1 { color: #dc3545; }
          .error-container { max-width: 600px; margin: 0 auto; }
          .btn { 
            display: inline-block; 
            padding: 10px 20px; 
            margin: 10px; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px;
          }
          .btn-home { background-color: #28a745; }
          .btn-back { background-color: #007bff; }
        </style>
      </head>
      <body>
        <div class="error-container">
          <h1>${status || 500} - ${status === 404 ? 'Page Not Found' : 'Server Error'}</h1>
          <p>${message || 'An error occurred while processing your request.'}</p>
          <div>
            <a href="/" class="btn btn-home">Go to Homepage</a>
            <button onclick="window.history.back()" class="btn btn-back">Go Back</button>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

// Helper function to render EJS templates
Util.render = async function(template, data) {
  return new Promise((resolve, reject) => {
    require('ejs').renderFile(template, data, {}, function(err, str) {
      if (err) reject(err);
      else resolve(str);
    });
  });
}

// Middleware For Handling Errors
Util.handleErrors = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

module.exports = Util
