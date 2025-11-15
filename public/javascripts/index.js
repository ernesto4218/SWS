let allowedClasses = [];
let denyClasses = [];

const settingsformparent = document.getElementById('settingsformparent');

async function startCamera() {
    const video = document.querySelector("video");

    try {
    // Request access to the user's camera
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    video.play();
    } catch (err) {
    console.error("Error accessing camera:", err);
    alert("Camera access denied or unavailable.");
    }
}

window.addEventListener("DOMContentLoaded", startCamera);
const TRASH_BINS = {
    "Biodegradable": {
        "classes": ["paper"],
        "servo_url": "http://10.0.0.1/S1/80",
        "sensor_url": "http://10.0.0.1/U1",
        "color": "#228B22"
    },
    "Non-Biodegradable": {
        "classes": ["ballpen", "color_pen", "pencil", "pentel_pen", "whiteboard_marker"],
        "servo_url": "http://10.0.0.1/S2/80",
        "sensor_url": "http://10.0.0.1/U2",
        "color": "#4682B4"
    },
    "Recyclable": {
        "classes": ["bottle", "highlighter"],
        "servo_url": "http://10.0.0.1/S3/70",
        "sensor_url": "http://10.0.0.1/U3",
        "color": "#FFD700"
    }
};

// console.log(TRASH_BINS['Biodegradable'].sensor_url);

// load model
const MODEL_URL = "/tm/" + settingsformparent.querySelector("#modelurl").value;
let predictionval = settingsformparent.querySelector("#prediction").value;
let fetchsensorrps = settingsformparent.querySelector("#fetchrps").value;

console.log(fetchsensorrps);
let model, webcam, labelContainer, maxPredictions;
let currentIndexCensor = 0;

async function sendServoRequest(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Request failed: ${response.status}`);

        const result = await response.text();
        console.log(`Success from ${url}:`, result);

        // alert(`Servo triggered successfully!\n${url}`);
    } catch (error) {
        console.error('Error:', error);
        // alert(`Failed to reach ${url}`);
    }
}


// buttons
const BioBTN = document.getElementById('BioBTN');
BioBTN.onclick = function() {
    sendServoRequest(TRASH_BINS["Biodegradable"].servo_url, "biodegradable");
};

const NonBioBTN = document.getElementById('NonBioBTN');
NonBioBTN.onclick = function() {
    sendServoRequest(TRASH_BINS["Non-Biodegradable"].servo_url, "nonbiodegradable");
};

const RecyBTN = document.getElementById('RecyBTN');
RecyBTN.onclick = function() {
    sendServoRequest(TRASH_BINS["Recyclable"].servo_url, "recyclable");
};


const BIN_NAMES = Object.keys(TRASH_BINS);
let currentBinIndex = 0;

async function fetchu1() {
  try {
    const response = await fetch(TRASH_BINS['Biodegradable'].sensor_url);
    const data = await response.json();

    document.querySelector('.binu1').style.height = data.U1 + "%";
    document.querySelector('.binu1text').textContent = data.U1 + "%";
    
    console.log(`✅ Updated bin:`, data);
    
    if (data.U1 && data.U1 > 0){
        const save_data = await (await fetch('/send-sensor-level', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sensor_id: 1, level: data.U1 })
        })).json();

        console.log(save_data);
    }
  } catch (error) {
    console.error(`❌ Error fetching data:`, error);
  }
}

async function fetchu2() {
  try {
    const response = await fetch(TRASH_BINS['Non-Biodegradable'].sensor_url);
    const data = await response.json();

    document.querySelector('.binu2').style.height = data.U2 + "%";
    document.querySelector('.binu2text').textContent = data.U2 + "%";
    
    console.log(`✅ Updated bin:`, data);
    if (data.U2 && data.U2 > 0){
        const save_data = await (await fetch('/send-sensor-level', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sensor_id: 2, level: data.U2 })
        })).json();

        console.log(save_data);
    }
  } catch (error) {
    console.error(`❌ Error fetching data:`, error);
  }

}

async function fetchu3() {
  try {
    const response = await fetch(TRASH_BINS['Recyclable'].sensor_url);
    const data = await response.json();

    document.querySelector('.binu3').style.height = data.U3 + "%";
    document.querySelector('.binu3text').textContent = data.U3 + "%";
    
    console.log(`✅ Updated bin:`, data);

    if (data.U3 && data.U3 > 0){
        const save_data = await (await fetch('/send-sensor-level', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sensor_id: 3, level: data.U3 })
        })).json();

        console.log(save_data);
    }
    
  } catch (error) {
    console.error(`❌ Error fetching data:`, error);
  }
}
// Utility to add a delay
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchAllBins() {
    try {
        try {
            await fetchu1();
        } catch (err) {
            console.error('❌ Error fetching Biodegradable:', err);
        }

        await delay(1000);
        try {
            await fetchu2();
        } catch (err) {
            console.error('❌ Error fetching Non-Biodegradable:', err);
        }

        await delay(1500);
        try {
            await fetchu3();
        } catch (err) {
            console.error('❌ Error fetching Recyclable:', err);
        }

    } catch (err) {
        console.error('❌ Unexpected error in fetchAllBins:', err);
    } finally {
        setTimeout(fetchAllBins, 10000);
    }
}

fetchAllBins();

// init all
function openall(){
    Object.keys(TRASH_BINS).forEach(key => {
        sendServoRequest(TRASH_BINS[key].servo_url);
    });
}

// openall();

async function init() {
    const modelURL = MODEL_URL + "model.json";
    const metadataURL = MODEL_URL + "metadata.json";

    model = await tmImage.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    // setup webcam
    const flip = true;
    webcam = new tmImage.Webcam(200, 200, flip);
    await webcam.setup();
    await webcam.play();
    window.requestAnimationFrame(loop);

    // append elements
    document.getElementById("webcam-container").appendChild(webcam.canvas);
    labelContainer = document.getElementById("label-container");
    for (let i = 0; i < maxPredictions; i++) {
        labelContainer.appendChild(document.createElement("div"));
    }
}

async function loop() {
    webcam.update();
    await predict();
    window.requestAnimationFrame(loop);
}

// let isPredicting = false; // prevent repeated triggers

// async function predict() {
//     if (isPredicting) return;

//     isPredicting = true; 

//     const prediction = await model.predict(webcam.canvas);

//     for (let i = 0; i < maxPredictions; i++) {
//         const className = prediction[i].className;
//         const probability = prediction[i].probability;
//         const classPrediction = `${className}: ${(probability * 100).toFixed(2)}%`;
//         labelContainer.childNodes[i].innerHTML = classPrediction;

//         console.log(`Class: ${className}, Confidence: ${(probability * 100).toFixed(2)}%`);
//     }

//     // 🔹 Get the most confident prediction
//     const bestPrediction = prediction.reduce((prev, current) =>
//         prev.probability > current.probability ? prev : current
//     );

//     const confidence = bestPrediction.probability * 100;
//     console.log(`✅ Best Prediction: ${bestPrediction.className} (${confidence.toFixed(2)}%)`);

//     // ✅ only trigger if confidence >= 90%
//     if (bestPrediction.probability >= 0.9) {
//         if (bestPrediction.className === "recyclable") {
//             RecyBTN.click();
//         } else if (bestPrediction.className === "biodegradable") {
//             BioBTN.click();
//         } else if (bestPrediction.className === "nonbiodegradable") {
//             NonBioBTN.click();
//         }
//     } else {
//         console.log("⚠️ Confidence too low — skipping action.");
//     }

//     // ⏳ Wait 5 seconds before allowing next prediction
//     setTimeout(() => {
//         isPredicting = false;
//         console.log("Ready for next prediction...");
//     }, 3000);
// }

let isPredicting = false; 
let highConfidenceStart = null; 
const alertcontainer = document.getElementById('alertcontainer');

async function predict() {
    if (isPredicting) return;
    isPredicting = true; 
    alertcontainer.classList.add("hidden");
    alertcontainer.classList.remove("flex");

    const prediction = await model.predict(webcam.canvas);

    const bestPrediction = prediction.reduce((prev, current) =>
        prev.probability > current.probability ? prev : current
    );

    const confidence = bestPrediction.probability * 100;

    // ✅ Maintain confidence >= 90% for 2 seconds before triggering
    if (bestPrediction.probability >= predictionval) {
        if (!highConfidenceStart) {
            highConfidenceStart = Date.now(); // mark the start
            console.log("⏱ High confidence started...");
        } else {
            const elapsed = Date.now() - highConfidenceStart;
            if (elapsed >= 1000) { // 2 seconds passed

                if (allowedClasses.includes(bestPrediction.className)){
                    console.log("🔥 Confidence stable for 2 seconds — triggering action!");
                    console.log(`✅ Best Prediction: ${bestPrediction.className} (${confidence.toFixed(2)}%)`);

                    if (bestPrediction.className === "recyclable") {
                        console.log("Recyclable");
                        RecyBTN.click();
                    } else if (bestPrediction.className === "biodegradable") {
                        console.log("Biodegradable");
                        BioBTN.click();
                    } else if (bestPrediction.className === "nonbiodegradable") {
                        console.log("Non-Biodegradable");
                        NonBioBTN.click();
                    }

                    const saveResponse = await fetch('/send-waste-detected', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: bestPrediction.className, confidence: predictionval })
                    });

                    const save_data = await saveResponse.json();
                    console.log(save_data);
                    
                    highConfidenceStart = null; 
                    // ⏳ Delay next prediction for 3 seconds
                    setTimeout(() => {
                        isPredicting = false;
                        console.log("Ready for next prediction...");
                    }, 3000);
                    return;
                } else if (denyClasses.includes(bestPrediction.className)){
                    alertcontainer.classList.add("flex");
                    alertcontainer.classList.remove("hidden");

                    const saveResponse = await fetch('/send-waste-detected', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: bestPrediction.className, confidence: predictionval })
                    });

                    const save_data = await saveResponse.json();
                    console.log(save_data);
                    
                    highConfidenceStart = null; 
                    // ⏳ Delay next prediction for 3 seconds
                    setTimeout(() => {
                        isPredicting = false;
                        console.log("Ready for next prediction...");
                    }, 3000);
                    return;
                } else {
                    console.log("Class is not allowed: ", bestPrediction.className);
                    setTimeout(() => {
                        isPredicting = false;
                        console.log("Ready for next prediction...");
                    }, 3000);
                    return;
                }
                
            }
        }
    } else {
        if (highConfidenceStart) {
            console.log("⚠️ Confidence dropped below 90%, resetting timer.");
            highConfidenceStart = null; // reset if it drops below 90%
        }
    }

    // continue predicting
    setTimeout(() => {
        isPredicting = false;
    }, 100);
}


init();

function updateAllowedClasses() {
  allowedClasses = Array.from(document.querySelectorAll('.allowclass input[type="checkbox"]:checked'))
    .map(checkbox => checkbox.value)
    .filter(v => v !== ""); // remove empty values
  console.log("✅ Allowed classes:", allowedClasses);
}
document.addEventListener('change', updateAllowedClasses);
updateAllowedClasses();


function updateDenyClasses() {
  denyClasses = Array.from(document.querySelectorAll('.denyclass input[type="checkbox"]:checked'))
    .map(checkbox => checkbox.value)
    .filter(v => v !== ""); // remove empty values
  console.log("Deny classes:", denyClasses);
}
document.addEventListener('change', updateDenyClasses);
updateDenyClasses();


// settings
const settingsbtn = document.getElementById('settingsbtn');
const closesettingsform = document.getElementById('closesettingsform');
const settingsform = document.getElementById('settingsform');

settingsbtn.onclick = function() {
    settingsformparent.classList.remove('hidden');
    settingsformparent.classList.add('flex');
};

closesettingsform.onclick = function() {
    settingsformparent.classList.remove('flex');
    settingsformparent.classList.add('hidden');
};

// analyics
let chartInstance; // keep reference to chart

function sensorchart(range = null) {
    const sensor_levels = JSON.parse(document.getElementById('sensorchart').getAttribute('data-sensor_levels'));

    // Filter by range if provided
    const now = new Date();
    let startDate;
    switch(range) {
        case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
        case 'yesterday':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
            break;
        case '7days':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
            break;
        case '30days':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
            break;
        case '90days':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 90);
            break;
        default:
            startDate = null; // no filtering
    }

    const filteredLevels = startDate ? sensor_levels.filter(item => new Date(item.date_added) >= startDate) : sensor_levels;

    // Group data by sensor_id
    const sensors = {
        "1": { name: "Biodegradable", color: "#22C55E", data: [] },
        "2": { name: "Non-Biodegradable", color: "#EF4444", data: [] },
        "3": { name: "Recyclable", color: "#CA8A04", data: [] },
    };

    const timestampsSet = new Set();

    filteredLevels.forEach(item => {
        const sensor = sensors[item.sensor_id];
        if (sensor) {
            const date = new Date(item.date_added);
            const formattedDate = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
            sensor.data.push({ x: formattedDate, y: parseFloat(item.level) });
            timestampsSet.add(formattedDate);
        }
    });

    const timestamps = Array.from(timestampsSet).sort();

    const series = Object.values(sensors).map(sensor => ({
        name: sensor.name,
        data: sensor.data.map(d => ({ x: d.x, y: d.y })),
        color: sensor.color
    }));

    const options = {
        chart: { type: 'area', height: 300, fontFamily: 'Inter, sans-serif', toolbar: { show: false } },
        title: { text: "Sensor Fill Levels", align: "left", style: { fontSize: '12px', fontWeight: 'bold', color: '#333' } },
        dataLabels: { enabled: false },
        stroke: { width: 3 },
        fill: { type: 'gradient', gradient: { opacityFrom: 0.55, opacityTo: 0, shadeIntensity: 1 } },
        series: series,
        xaxis: { type: 'category', categories: timestamps, labels: { rotate: -45, rotateAlways: true, trim: false, style: { fontSize: '10px', fontFamily: 'Inter, sans-serif' } } },
        yaxis: { title: { text: 'Level' } },
        tooltip: { x: { format: 'HH:mm:ss' } },
    };

    if (!chartInstance) {
        chartInstance = new ApexCharts(document.getElementById("sensorchart"), options);
        chartInstance.render();
    } else {
        chartInstance.updateOptions({ series: series, xaxis: { categories: timestamps } });
    }
}

sensorchart();

document.querySelectorAll('.dropdown-item').forEach(item => {
    item.addEventListener('click', e => {
        e.preventDefault();
        const range = item.dataset.range;
        sensorchart(range);
    });
});

const waste_detected = JSON.parse(document.getElementById('detectionchart').getAttribute('data-waste_detected'));
console.log(waste_detected);

let detectionChart = null;


function wasteChart(range = null) {
    const waste_detected = JSON.parse(document.getElementById('detectionchart').getAttribute('data-waste_detected'));

    // Filter by range if provided
    const now = new Date();
    let startDate;
    switch (range) {
        case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
        case 'yesterday':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
            break;
        case '7days':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
            break;
        case '30days':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
            break;
        case '90days':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 90);
            break;
        default:
            startDate = null;
    }

    const filteredData = startDate
        ? waste_detected.filter(item => new Date(item.date_added) >= startDate)
        : waste_detected;

    // Group data by waste type
    const wastes = {
        biodegradable: { name: "Biodegradable", color: "#22C55E", data: [] },
        nonbiodegradable: { name: "Non-Biodegradable", color: "#EF4444", data: [] },
        recyclable: { name: "Recyclable", color: "#CA8A04", data: [] },
    };

    filteredData.forEach(item => {
        const type = item.waste_type.toLowerCase();
        const waste = wastes[type];
        if (waste) {
            const date = new Date(item.date_added);
            const formattedDate = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes()
                .toString()
                .padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
            waste.data.push({ x: formattedDate, y: parseFloat(item.confidence) });
        }
    });

    const series = Object.values(wastes).map(waste => ({
        name: waste.name,
        data: waste.data,
        color: waste.color,
    }));

    const options = {
        chart: {
            type: 'area',
            height: 300,
            fontFamily: 'Inter, sans-serif',
            toolbar: { show: false },
        },
        title: {
            text: "Waste Detection Confidence Over Time",
            align: "left",
            style: { fontSize: '12px', fontWeight: 'bold', color: '#333' },
        },
        dataLabels: { enabled: false },
        stroke: { width: 3 },
        fill: {
            type: 'gradient',
            gradient: { opacityFrom: 0.55, opacityTo: 0, shadeIntensity: 1 },
        },
        series: series,
        xaxis: {
            type: 'category',
            labels: {
                rotate: -45,
                rotateAlways: true,
                trim: false,
                style: { fontSize: '10px', fontFamily: 'Inter, sans-serif' },
            },
        },
        yaxis: { title: { text: 'Confidence (%)' }, min: 0, max: 100 },
        tooltip: {
            shared: true,
            intersect: false,
            custom: function({ series, seriesIndex, dataPointIndex, w }) {
                const wasteType = w.config.series[seriesIndex].name;
                const label = w.globals.seriesX[seriesIndex][dataPointIndex];
                const value = w.globals.series[seriesIndex][dataPointIndex];
                return `
                    <div style="padding:5px;">
                        <strong>${wasteType}</strong><br>
                        Time: ${label}<br>
                        Confidence: ${value.toFixed(2)}%
                    </div>
                `;
            },
        },
    };

    // Render or update chart
    if (!window.wasteChartInstance) {
        window.wasteChartInstance = new ApexCharts(document.getElementById("detectionchart"), options);
        window.wasteChartInstance.render();
    } else {
        window.wasteChartInstance.updateOptions({
            series: series,
            xaxis: {
                ...options.xaxis,
                categories: series.flatMap(s => s.data.map(d => d.x)),
            },
        }, true, true); // 👈 forces full re-render with animation
    }
}



// ✅ Initial render
wasteChart('7days');

document.querySelectorAll('#lastDaysdropdownwaste .dropdown-item').forEach(btn => {
    btn.addEventListener('click', e => {
        e.preventDefault();
        const range = btn.getAttribute('data-range');
        wasteChart(range);

        document.getElementById('dropdownDefaultButtonwaste').textContent = btn.textContent;
    });
});