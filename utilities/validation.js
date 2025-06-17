/**
 * Validation Middleware for Inventory Management
 * 
 * This module contains validation middleware functions for the inventory management routes.
 */

/**
 * Validates classification data from the request body
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const validateClassification = (req, res, next) => {
    try {
        const { classification_name } = req.body;
        const errors = [];
        
        // Validate classification name exists and matches pattern
        if (!classification_name || typeof classification_name !== 'string') {
            errors.push('Classification name is required');
        } else if (!/^[A-Za-z]+$/.test(classification_name.trim())) {
            errors.push('Classification name must contain only letters (no spaces, numbers, or special characters)');
        }
        
        // If there are validation errors, handle them
        if (errors.length > 0) {
            console.log('Validation errors:', errors);
            
            // Store the errors in the request object for the controller to handle
            req.validation = {
                hasErrors: true,
                errors,
                formData: { classification_name: classification_name || '' }
            };
        } else {
            // Trim the classification name and store it in the request object
            req.body.classification_name = classification_name.trim();
            req.validation = { hasErrors: false };
        }
        
        // Continue to the next middleware or controller
        next();
    } catch (error) {
        console.error('Error in validateClassification middleware:', error);
        next(error);
    }
};

/**
 * Handles validation errors by redirecting back to the form with error messages
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @param {string} redirectPath - Path to redirect to on validation error
 */
const handleValidationErrors = (req, res, next, redirectPath) => {
    if (req.validation && req.validation.hasErrors) {
        // Set flash messages for each error
        req.validation.errors.forEach(error => {
            req.flash('error', error);
        });
        
        // Save form data in session for sticky form
        if (req.validation.formData) {
            req.session.formData = req.validation.formData;
        }
        
        // Save the flash messages and redirect
        return req.session.save(() => {
            res.redirect(303, redirectPath);
        });
    }
    
    // If no validation errors, continue to the next middleware
    next();
};

/**
 * Middleware to handle validation errors for the classification form
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const handleClassificationErrors = (req, res, next) => {
    return handleValidationErrors(req, res, next, '/inv/add-classification');
};

module.exports = {
    validateClassification,
    handleClassificationErrors
};
