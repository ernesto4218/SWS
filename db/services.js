import { start } from "repl";
import db from "./db.js";
import * as queries from "./queries.js";

// Insert new row
export async function insertItem(...values) {
  const [result] = await db.execute(INSERT, values);
  return result.insertId;
}

// Get single row by ID
export async function getItemById(id) {
  const [rows] = await db.execute(GET_BY_ID, [id]);
  return rows[0];
}

// Update row by ID (last value should be the ID)
export async function updateItemById(...values) {
  const [result] = await db.execute(UPDATE_BY_ID, values);
  return result.affectedRows > 0;
}

// Delete row by ID
export async function deleteItemById(id) {
  const [result] = await db.execute(DELETE_BY_ID, [id]);
  return result.affectedRows > 0;
}

// Get all rows
export async function getAllItems() {
  const [rows] = await db.execute(GET_ALL);
  return rows;
}

// Upsert (insert or update if exists)
export async function upsertItem(...values) {
  const [result] = await db.execute(UPSERT, values);
  return result.insertId || result.affectedRows > 0;
}

// get
export async function GET_ALL_SETTINGS() {
  const [result] = await db.execute(queries.GET_ALL_SETTINGS);
  return result;
}

export async function GET_ALL_DETECTED_WASTE_BY_DAYS(dayFilter) {
  const query = queries.GET_ALL_DETECTED_WASTE_BY_DAYS(dayFilter);
  const [result] = await db.execute(query);
  return result;
}

export async function GET_ALL_SENSOR_LEVEL_BY_DAYS(dayFilter) {
  const query = queries.GET_ALL_SENSOR_LEVEL_BY_DAYS(dayFilter);
  const [result] = await db.execute(query);
  return result;
}

export async function GET_ALL_DETECTED_WASTE() {
  const [result] = await db.execute(queries.GET_ALL_DETECTED_WASTE);
  return result;
}


export async function GET_ALL_SENSOR_LEVEL() {
  const [result] = await db.execute(queries.GET_ALL_SENSOR_LEVEL);
  return result;
}

// post
export async function INSERT_SENSOR_READINGS(sensor_id, level) {
  const [result] = await db.execute(queries.INSERT_SENSOR_READINGS, [
    sensor_id,
    level,
  ]);
  return result.insertId;
}

export async function INSERT_WASTE_DETECTED(name, confidence) {
  const [result] = await db.execute(queries.INSERT_WASTE_DETECTED, [
    name,
    confidence,
  ]);
  return result.insertId;
}

export async function UPDATE_ALL_SETTINGS(sql, params) {
  const [result] = await db.execute(sql, params);
  return result;
}


