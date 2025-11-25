let allowedClasses = [];
let denyClasses = [];

// const settingsformparent = document.getElementById('settingsformparent');

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
        "servo_url": "http://127.0.0.1/open-basket-one",
        "sensor_url": "http://127.0.0.1/get-basket-one",
    },
    "Non-Biodegradable": {
        "servo_url": "http://127.0.0.1/open-basket-two",
        "sensor_url": "http://127.0.0.1/get-basket-two",
    },
    "Recyclable": {
        "servo_url": "http://127.0.0.1/open-basket-three",
        "sensor_url": "http://127.0.0.1/get-basket-three",
    },
    "Unknown": {
        "servo_url": "http://127.0.0.1/unknown",
    }
};

const dataEl = document.querySelector('.datael');
const serverData = dataEl ? JSON.parse(dataEl.getAttribute('data-settings')) : {};
console.log(serverData);

// console.log(TRASH_BINS['Biodegradable'].sensor_url);

// load model
// const MODEL_URL = "/tm/" + settingsformparent.querySelector("#modelurl").value;
const MODEL_URL = "/tm/" + getSetting("model") + "/";
let predictionval = Number(getSetting("prediction"));
let fetchsensorrps = Number(getSetting("sensor_readings"));

// console.log(fetchsensorrps);
let model, webcam, labelContainer, maxPredictions;
let currentIndexCensor = 0;

function getSetting(name) {
  const item = serverData.find(x => x.name === name);
  return item ? item.value : null;
}

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

const UnknownBTN = document.getElementById('UnknownBTN');
UnknownBTN.onclick = function() {
    sendServoRequest(TRASH_BINS["Unknown"].servo_url, "unknown");
};


const BIN_NAMES = Object.keys(TRASH_BINS);
let currentBinIndex = 0;

async function fetchu1() {
  try {
    const response = await fetch(TRASH_BINS['Biodegradable'].sensor_url);
    const data = await response.json();
    const distance = data.distance;

    document.querySelector('.binu1').style.height = distance + "%";
    document.querySelector('.binu1text').textContent = distance + "%";
    
    console.log(`✅ Updated bin:`, data);
    
    if (data && distance > 0){
        const save_data = await (await fetch('/send-sensor-level', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sensor_id: 1, level: distance })
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
    const distance = data.distance;

    document.querySelector('.binu2').style.height = distance + "%";
    document.querySelector('.binu2text').textContent = distance + "%";
    
    console.log(`✅ Updated bin:`, data);
    if (data && distance > 0){
        const save_data = await (await fetch('/send-sensor-level', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sensor_id: 2, level: distance })
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
    const distance = data.distance;

    document.querySelector('.binu3').style.height = data.U3 + "%";
    document.querySelector('.binu3text').textContent = data.U3 + "%";
    
    console.log(`✅ Updated bin:`, data);

    if (data && distance > 0){
        const save_data = await (await fetch('/send-sensor-level', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sensor_id: 3, level: distance })
        })).json();

        console.log(save_data);
    }
    
  } catch (error) {
    console.error(`❌ Error fetching data:`, error);
  }
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchAllBins() {
    try {
        await fetchu1().catch(() => {});
        await delay(500);

        await fetchu2().catch(() => {});
        await delay(500);

        await fetchu3().catch(() => {});
    } catch (err) {
        // Unexpected error in sequence
        // console.error('Unexpected error in fetchAllBins:', err);
    } finally {
        setTimeout(fetchAllBins, fetchsensorrps); 
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

    if (bestPrediction.probability >= predictionval) {
        if (!highConfidenceStart) {
            highConfidenceStart = Date.now(); // mark the start
            console.log("⏱ High confidence started...");
        } else {
            const elapsed = Date.now() - highConfidenceStart;
            if (elapsed >= 1000) { // 2 seconds passed
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
                } else {
                    alertcontainer.classList.add("flex");
                    alertcontainer.classList.remove("hidden");

                    highConfidenceStart = null; 
                    setTimeout(() => {
                        isPredicting = false;
                        console.log("Ready for next prediction...");
                    }, 3000);
                    
                    return;
                }

                const saveResponse = await fetch('/send-waste-detected', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: bestPrediction.className, confidence: predictionval })
                });

                const save_data = await saveResponse.json();
                console.log(save_data);
                
                highConfidenceStart = null; 

                setTimeout(() => {
                    isPredicting = false;
                    console.log("Ready for next prediction...");
                }, 3000);
                return;
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

