import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import {
    INSERT_SENSOR_READINGS,
    GET_ALL_SENSOR_LEVEL,
    GET_ALL_DETECTED_WASTE,
    INSERT_WASTE_DETECTED
 } from '../db/services.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


var router = express.Router();
let settings_data = {
  active_model: "Model3/",
  predict_percent: 0.85,
  fetch_sensor_rps: 1000,
  bin_reload: "checked",
  labels: [],
};

router.get('/', async function(req, res) {
    try {
        const metadataPath = path.join(__dirname, '..', 'public', 'tm', settings_data.active_model, 'metadata.json');
        const jsonData = await fs.readFile(metadataPath, 'utf8');
        settings_data.labels = JSON.parse(jsonData).labels || [];
    } catch (err) {
        console.error(err);
        settings_data.labels = [];
    }

    const waste_detected = await GET_ALL_DETECTED_WASTE();
    const today = new Date().toISOString().split('T')[0];
    let counts = {
        biodegradable: 0,
        nonbiodegradable: 0,
        recyclable: 0,
        total: 0
    };

    for (const item of waste_detected) {
        const date = new Date(item.date_added).toISOString().split('T')[0];
        
        if (date === today) {
            counts.total++;
            if (counts[item.waste_type] !== undefined) {
            counts[item.waste_type]++;
            }
        }
    }

    console.log(counts);
    res.render('index2', { 
        title: 'Trans Recognition', 
        data: settings_data,
        sensor_levels: await GET_ALL_SENSOR_LEVEL(),
        waste_detected: waste_detected,
        counts: counts
    });
});

router.post('/send-sensor-level', async function(req, res) {
    try {
        const { sensor_id, level } = req.body;

        console.log('Sensor ID:', sensor_id);
        console.log('Level:', level);

        // You can do something with these values here (e.g., save to DB)
        await INSERT_SENSOR_READINGS(sensor_id, level || 0);
        res.json({ status: 'success', sensor_id, level });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Something went wrong' });
    }
});

router.post('/send-waste-detected', async function(req, res) {
    try {
        const { name, confidence } = req.body;

        // You can do something with these values here (e.g., save to DB)
        await INSERT_WASTE_DETECTED(name, confidence || 0);
        res.json({ status: 'success', name });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Something went wrong' });
    }
});

export default router;
