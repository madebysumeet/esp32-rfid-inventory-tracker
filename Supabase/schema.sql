-- Create the users table
CREATE TABLE users (
    user_id VARCHAR(50) PRIMARY KEY, -- RFID UID for the user
    name VARCHAR(100) NOT NULL,
    employee_id VARCHAR(50) UNIQUE,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    role VARCHAR(50) DEFAULT 'Employee',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create the items table
CREATE TABLE items (
    item_id VARCHAR(50) PRIMARY KEY, -- RFID UID for the item
    name VARCHAR(255) NOT NULL,
    serial_number VARCHAR(100) UNIQUE,
    description TEXT,
    current_status VARCHAR(50) DEFAULT 'Available', -- 'Available', 'Checked Out', 'In Repair', 'Missing'
    current_user_id VARCHAR(50) REFERENCES users(user_id) ON DELETE SET NULL, -- NULL if Available
    last_checked_out_at TIMESTAMPTZ,
    expected_return_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create the transactions table
CREATE TABLE transactions (
    transaction_id BIGSERIAL PRIMARY KEY,
    item_id VARCHAR(50) NOT NULL REFERENCES items(item_id) ON DELETE CASCADE,
    user_id VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL, -- 'checkout', 'checkin', 'repair_out', 'repair_in'
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT
);