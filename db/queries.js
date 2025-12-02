// Get a single row by ID
export const GET_BY_ID = 'SELECT * FROM table_name WHERE id = ?';

// Insert a new row
export const INSERT = 'INSERT INTO table_name (column1, column2) VALUES (?, ?)';

// Update a row by ID
export const UPDATE_BY_ID = 'UPDATE table_name SET column1 = ?, column2 = ?, date_updated = NOW() WHERE id = ?';

// Delete a row by ID
export const DELETE_BY_ID = 'DELETE FROM table_name WHERE id = ?';

// Get all rows
export const GET_ALL = 'SELECT * FROM table_name';


// get
export const GET_ALL_SENSOR_LEVEL = 'SELECT * FROM sensor_fill_levels';
export const GET_ALL_DETECTED_WASTE = 'SELECT * FROM detected_waste';
export const GET_ALL_SETTINGS = 'SELECT * FROM system_settings';
export function GET_ALL_DETECTED_WASTE_BY_DAYS(dayFilter) {
  return `
    SELECT *
    FROM detected_waste
    WHERE date_added >= DATE_SUB(CURDATE(), INTERVAL ${dayFilter})
    ORDER BY date_added DESC
  `;
}

export function GET_ALL_SENSOR_LEVEL_BY_DAYS(dayFilter) {
  return `
    SELECT *
    FROM sensor_fill_levels
    WHERE date_added >= DATE_SUB(CURDATE(), INTERVAL ${dayFilter})
      AND sensor_id NOT IN ('notallowed', 'background')
    ORDER BY date_added DESC
  `;
}

// post
export const INSERT_SENSOR_READINGS = 'INSERT INTO sensor_fill_levels (sensor_id, level) VALUES (?, ?)';
export const INSERT_WASTE_DETECTED = 'INSERT INTO detected_waste (waste_type, confidence) VALUES (?, ?)';
export const UPDATE_SETTING_BY_ID = 'UPDATE system_settings SET value = ? WHERE id = ?';