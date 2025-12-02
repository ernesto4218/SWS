import express from "express";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import {
  INSERT_SENSOR_READINGS,
  GET_ALL_SENSOR_LEVEL,
  GET_ALL_DETECTED_WASTE_BY_DAYS,
  GET_ALL_DETECTED_WASTE,
  INSERT_WASTE_DETECTED,
  GET_ALL_SETTINGS,
  UPDATE_ALL_SETTINGS,
  GET_ALL_SENSOR_LEVEL_BY_DAYS
} from "../db/services.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

var router = express.Router();

router.get("/", async function (req, res) {
  const settings_data = await GET_ALL_SETTINGS();
  const waste_detected = await GET_ALL_DETECTED_WASTE();

  const today = new Date().toISOString().split("T")[0];
  let counts = {
    biodegradable: 0,
    nonbiodegradable: 0,
    recyclable: 0,
    total: 0,
  };

  for (const item of waste_detected) {
    const date = new Date(item.date_added).toISOString().split("T")[0];

    if (date === today) {
      counts.total++;
      if (counts[item.waste_type] !== undefined) {
        counts[item.waste_type]++;
      }
    }
  }

  console.log(counts);
  res.render("index2", {
    title: "Trans Recognition",
    data: settings_data,
    sensor_levels: await GET_ALL_SENSOR_LEVEL(),
    waste_detected: waste_detected,
    counts: counts,
  });
});


router.get("/settings", async function (req, res) {
  const settings = await GET_ALL_SETTINGS();
  console.log(settings);

  res.render("settings", {
    title: "Settings",
    settings: settings
  });
});

router.get("/analytics", async function (req, res) {
  const day = req.query.day;
  let dropTitle = "";
  let interval = null;

  const dayMap = {
    Today: "0 DAY",
    Yesterday: "1 DAY",
    "7days": "7 DAY",
    "30Days": "30 DAY",
    "90Days": "90 DAY",
  };

  if (!day) {
    return res.redirect("/analytics?day=7days");
  }

  if (dayMap[day]) {
    interval = dayMap[day];
  }

  const analytics = await GET_ALL_DETECTED_WASTE_BY_DAYS(interval);
  const sensor_analytics = await GET_ALL_SENSOR_LEVEL_BY_DAYS(interval);

  switch (day) {
    case "Yesterday":
      dropTitle = "Yesterday";
      break;
    case "Today":
      dropTitle = "Today";
      break;
    case "7days":
      dropTitle = "Last 7 Days";
      break;
    case "30Days":
      dropTitle = "Last 30 Days";
      break;
    case "90Days":
      dropTitle = "Last 90 Days";
      break;
  }

  console.log(sensor_analytics);
  res.render("analytics", {
    title: "Analytics",
    day,
    dropTitle,
    analytics,
    sensor_analytics
  });
});


router.post("/send-sensor-level", async function (req, res) {
  try {
    const { sensor_id, level } = req.body;

    console.log("Sensor ID:", sensor_id);
    console.log("Level:", level);

    await INSERT_SENSOR_READINGS(sensor_id, level || 0);
    res.json({ status: "success", sensor_id, level });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "error", message: "Something went wrong" });
  }
});

router.post("/send-waste-detected", async function (req, res) {
  try {
    const { name, confidence } = req.body;

    await INSERT_WASTE_DETECTED(name, confidence || 0);
    console.log("recorded " , name);
    res.json({ status: "success", name });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "error", message: "Something went wrong" });
  }
});

router.post("/save-settings", async function (req, res) {
  try {
    const updatedSettings = { ...req.body };

    // If on_reload key is missing → set default
    if (!updatedSettings.hasOwnProperty("on_reload")) {
      updatedSettings.on_reload = "off";
    }

    const keys = Object.keys(updatedSettings);
    const values = Object.values(updatedSettings);

    const cases = keys.map(() => `WHEN name = ? THEN ?`).join(' ');

    const sql = `
      UPDATE system_settings
      SET value = CASE ${cases} END,
          date_updated = NOW()
      WHERE name IN (${keys.map(() => '?').join(', ')})
    `;

    const params = [];

    // CASE WHEN params
    keys.forEach((key, i) => {
      params.push(key, values[i]);
    });

    // WHERE IN params
    params.push(...keys);

    const result = await UPDATE_ALL_SETTINGS(sql, params);

    res.json({ status: "success", affectedRows: result.affectedRows });

  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "error", message: "Something went wrong" });
  }
});


export default router;
