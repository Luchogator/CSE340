-- CSE 340: Web Backend Development
-- Database Design and Initialization Script
-- This script creates the necessary tables and populates them with initial data.

-- Create the account type
CREATE TYPE public.account_type AS ENUM ('Client', 'Employee', 'Admin');

-- Create the account table
CREATE TABLE public.account (
    account_id SERIAL PRIMARY KEY,
    account_firstname VARCHAR(50) NOT NULL,
    account_lastname VARCHAR(50) NOT NULL,
    account_email VARCHAR(100) NOT NULL UNIQUE,
    account_password VARCHAR(100) NOT NULL,
    account_type public.account_type NOT NULL DEFAULT 'Client'
);

-- Create the classification table
CREATE TABLE public.classification (
    classification_id SERIAL PRIMARY KEY,
    classification_name VARCHAR(50) NOT NULL UNIQUE
);

-- Create the inventory table
CREATE TABLE public.inventory (
    inv_id SERIAL PRIMARY KEY,
    inv_make VARCHAR(50) NOT NULL,
    inv_model VARCHAR(50) NOT NULL,
    inv_year INTEGER NOT NULL,
    inv_description TEXT NOT NULL,
    inv_image VARCHAR(255) NOT NULL,
    inv_thumbnail VARCHAR(255) NOT NULL,
    inv_price DECIMAL(10,2) NOT NULL,
    inv_miles INTEGER NOT NULL,
    inv_color VARCHAR(50) NOT NULL,
    classification_id INTEGER NOT NULL,
    FOREIGN KEY (classification_id) REFERENCES public.classification(classification_id)
);

-- Insert initial classification data
INSERT INTO public.classification (classification_name) VALUES
('Sport'),
('SUV'),
('Sedan'),
('Truck'),
('Van');

-- Insert initial inventory data
INSERT INTO public.inventory (inv_make, inv_model, inv_year, inv_description, inv_image, inv_thumbnail, inv_price, inv_miles, inv_color, classification_id) VALUES
('Jeep', 'Wrangler', 2018, 'The Jeep Wrangler is a compact and mid-size four-wheel drive off-road SUV.', '/images/jeep-wrangler.jpg', '/images/jeep-wrangler-tn.jpg', 28475.00, 41236, 'Orange', 1),
('Ford', 'Explorer', 2020, 'The Ford Explorer is a range of SUVs manufactured by Ford.', '/images/ford-explorer.jpg', '/images/ford-explorer-tn.jpg', 32995.00, 12458, 'Black', 2),
('Chevrolet', 'Malibu', 2019, 'The Chevrolet Malibu is a mid-size car manufactured by Chevrolet.', '/images/chevrolet-malibu.jpg', '/images/chevrolet-malibu-tn.jpg', 22495.00, 32541, 'White', 3),
('Dodge', 'Ram', 2021, 'The Dodge Ram is a full-size pickup truck.', '/images/dodge-ram.jpg', '/images/dodge-ram-tn.jpg', 35995.00, 15896, 'Silver', 4),
('Honda', 'Odyssey', 2020, 'The Honda Odyssey is a minivan manufactured by Honda.', '/images/honda-odyssey.jpg', '/images/honda-odyssey-tn.jpg', 30995.00, 21548, 'Blue', 5),
('GM', 'Hummer', 2022, 'The GM Hummer is a full-size SUV with small interiors.', '/images/gm-hummer.jpg', '/images/gm-hummer-tn.jpg', 58995.00, 1258, 'Black', 2);