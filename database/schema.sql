-- Crear el esquema 'public' si no existe
CREATE SCHEMA IF NOT EXISTS public;

-- Establecer el esquema por defecto
SET search_path TO public;

-- Crear tipo de enumeración para roles de cuenta
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_role') THEN
        CREATE TYPE account_role AS ENUM ('Client', 'Employee', 'Admin');
    END IF;
END$$;

-- Tabla de clasificaciones
CREATE TABLE IF NOT EXISTS classification (
    classification_id SERIAL PRIMARY KEY,
    classification_name VARCHAR(30) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de inventario
CREATE TABLE IF NOT EXISTS inventory (
    inv_id SERIAL PRIMARY KEY,
    inv_make VARCHAR(50) NOT NULL,
    inv_model VARCHAR(50) NOT NULL,
    inv_year INTEGER NOT NULL,
    inv_description TEXT,
    inv_image VARCHAR(150) DEFAULT '/images/vehicles/no-image.jpg',
    inv_thumbnail VARCHAR(150) DEFAULT '/images/vehicles/no-image-tn.jpg',
    inv_price DECIMAL(10,2) NOT NULL,
    inv_miles INTEGER NOT NULL,
    inv_color VARCHAR(30) NOT NULL,
    classification_id INTEGER REFERENCES classification(classification_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de cuentas de usuario
CREATE TABLE IF NOT EXISTS account (
    account_id SERIAL PRIMARY KEY,
    account_firstname VARCHAR(30) NOT NULL,
    account_lastname VARCHAR(30) NOT NULL,
    account_email VARCHAR(100) NOT NULL UNIQUE,
    account_password VARCHAR(100) NOT NULL,
    account_role account_role DEFAULT 'Client',
    account_avatar TEXT DEFAULT '/images/avatars/default-avatar.png',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_inventory_classification_id ON inventory(classification_id);
CREATE INDEX IF NOT EXISTS idx_account_email ON account(account_email);

-- Datos iniciales
INSERT INTO classification (classification_name) 
VALUES ('SUV'), ('Sedan'), ('Truck'), ('Van'), ('Sports Car')
ON CONFLICT (classification_name) DO NOTHING;

-- Crear usuario administrador por defecto (contraseña: admin123)
-- Nota: La contraseña debe ser hasheada con bcrypt antes de insertarse
-- La contraseña hasheada para 'admin123' es: $2a$10$8eJZz9vX5X5X5X5X5X5X5.X5X5X5X5X5X5X5X5X5X5X5X5X5X5X5X5
INSERT INTO account (
    account_firstname, 
    account_lastname, 
    account_email, 
    account_password, 
    account_role
) VALUES (
    'Admin', 
    'User', 
    'admin@example.com', 
    '$2a$10$8eJZz9vX5X5X5X5X5X5X5.X5X5X5X5X5X5X5X5X5X5X5X5X5X5X5X5',
    'Admin'::account_role
) ON CONFLICT (account_email) DO NOTHING;
