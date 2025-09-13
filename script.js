// More API functions here:
// https://github.com/googlecreativelab/teachablemachine-community/tree/master/libraries/image

// the link to your model provided by Teachable Machine export panel
const URL = "https://teachablemachine.withgoogle.com/models/m4ydUPqoE/";

let model, webcam, labelContainer, maxPredictions;
let isInitialized = false;
let modelLoaded = false;
let currentImage = null;
let finalResult = null;
let fileFinalResult = null;

// Load model automatically when page loads
window.addEventListener('load', async function() {
    await loadModel();
});

// Load the AI model
async function loadModel() {
    if (modelLoaded) return;
    
    const status = document.getElementById('status');
    
    try {
        status.className = 'status';
        status.textContent = '🔄 Loading AI model...';
        status.style.display = 'block';

        const modelURL = URL + "model.json";
        const metadataURL = URL + "metadata.json";

        // load the model and metadata
        model = await tmImage.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();

        // Setup prediction containers
        labelContainer = document.getElementById("label-container");
        labelContainer.innerHTML = ''; // Clear existing content
        for (let i = 0; i < maxPredictions; i++) {
            const predictionDiv = document.createElement("div");
            predictionDiv.className = "prediction-item";
            labelContainer.appendChild(predictionDiv);
        }

        status.className = 'status success';
        status.textContent = '✅ AI model loaded successfully! You can now use both Camera and File upload modes.';
        status.style.display = 'block';
        
        modelLoaded = true;

    } catch (error) {
        console.error('Error loading model:', error);
        status.className = 'status error';
        status.textContent = '❌ Error loading AI model. Please check your internet connection and refresh the page.';
        status.style.display = 'block';
    }
}

// Tab switching functionality
function switchTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Remove active class from all tab buttons
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    
    // Show selected tab content
    document.getElementById(tabName + 'Content').classList.add('active');
    document.getElementById(tabName + 'Tab').classList.add('active');
    
    // Hide all main content sections
    document.getElementById('cameraMainContent').style.display = 'none';
    document.getElementById('fileMainContent').style.display = 'none';
    document.getElementById('resultsSection').style.display = 'none';
    document.getElementById('fileFinalResultSection').style.display = 'none';
    document.getElementById('status').style.display = 'none';
    
    // Show appropriate main content
    if (tabName === 'camera') {
        document.getElementById('cameraMainContent').style.display = 'block';
        // Show placeholder if camera not active
        if (!isInitialized) {
            document.getElementById('cameraPlaceholder').style.display = 'flex';
            document.getElementById('activeCameraSection').style.display = 'none';
            document.getElementById('finalResultSection').style.display = 'none';
        } else {
            document.getElementById('cameraPlaceholder').style.display = 'none';
            document.getElementById('activeCameraSection').style.display = 'flex';
            document.getElementById('finalResultSection').style.display = 'none';
        }
    } else if (tabName === 'file') {
        document.getElementById('fileMainContent').style.display = 'block';
        // Show appropriate section based on state
        if (!currentImage) {
            document.getElementById('filePlaceholder').style.display = 'flex';
            document.getElementById('fileImageSection').style.display = 'none';
            document.getElementById('fileFinalResultSection').style.display = 'none';
        } else if (fileFinalResult) {
            document.getElementById('filePlaceholder').style.display = 'none';
            document.getElementById('fileImageSection').style.display = 'none';
            document.getElementById('fileFinalResultSection').style.display = 'flex';
        } else {
            document.getElementById('filePlaceholder').style.display = 'none';
            document.getElementById('fileImageSection').style.display = 'flex';
            document.getElementById('fileFinalResultSection').style.display = 'none';
        }
    }
}

// File upload handling
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            currentImage = e.target.result;
            fileFinalResult = null; // Reset final result when new image uploaded
            document.getElementById('previewImage').src = currentImage;
            
            // Hide placeholder and final result, show image section
            document.getElementById('filePlaceholder').style.display = 'none';
            document.getElementById('fileFinalResultSection').style.display = 'none';
            document.getElementById('fileImageSection').style.display = 'flex';
        };
        reader.readAsDataURL(file);
    }
}

// Analyze uploaded image
async function analyzeImage() {
    if (!currentImage) {
        showStatus('Please select an image file first.', 'error');
        return;
    }
    
    if (!modelLoaded) {
        showStatus('AI model is still loading. Please wait a moment and try again.', 'error');
        return;
    }

    const analyzeButton = document.querySelector('.analyze-button');
    const status = document.getElementById('status');
    const predictionsSection = document.getElementById('predictionsSection');
    
    try {
        analyzeButton.disabled = true;
        analyzeButton.textContent = 'Analyzing...';
        status.style.display = 'none';

        // Create image element for prediction
        const img = new Image();
        img.onload = async function() {
            try {
                // Create canvas to draw the image
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                
                // Get predictions
                const prediction = await model.predict(canvas);
                
                // Find the most recognizable result (highest probability)
                const mostRecognizable = prediction.reduce((max, current) => 
                    current.probability > max.probability ? current : max
                );
                
                // Save the file final result
                fileFinalResult = {
                    className: mostRecognizable.className,
                    probability: mostRecognizable.probability
                };
                
                // Show final result instead of results section
                showFileFinalResult(fileFinalResult);
                
                status.className = 'status success';
                status.textContent = '✅ Image analyzed successfully!';
                status.style.display = 'block';
                
            } catch (error) {
                console.error('Analysis error:', error);
                showStatus('Error analyzing image. Please try again.', 'error');
            } finally {
                analyzeButton.disabled = false;
                analyzeButton.textContent = 'Analyze Image';
            }
        };
        img.src = currentImage;
        
    } catch (error) {
        console.error('Error:', error);
        showStatus('Error analyzing image. Please try again.', 'error');
        analyzeButton.disabled = false;
        analyzeButton.textContent = 'Analyze Image';
    }
}

// Show status message
function showStatus(message, type) {
    const status = document.getElementById('status');
    status.className = `status ${type}`;
    status.textContent = message;
    status.style.display = 'block';
}

// Update predictions display
function updatePredictionsDisplay(predictions) {
    for (let i = 0; i < maxPredictions; i++) {
        const percentage = (predictions[i].probability * 100).toFixed(0);
        const classPrediction = predictions[i].className + ": " + percentage + "%";
        labelContainer.childNodes[i].innerHTML = classPrediction;
    }
}

// Setup the webcam for real-time recognition
async function initCamera() {
    if (isInitialized) return;
    
    if (!modelLoaded) {
        showStatus('AI model is still loading. Please wait a moment and try again.', 'error');
        return;
    }
    
    const startButton = document.getElementById('startButton');
    const loading = document.getElementById('loading');
    const status = document.getElementById('status');
    const predictionsSection = document.getElementById('predictionsSection');
    
    try {
        startButton.disabled = true;
        startButton.textContent = 'Starting Camera...';
        loading.classList.add('show');
        status.style.display = 'none';

        // Convenience function to setup a webcam
        const flip = true; // whether to flip the webcam
        webcam = new tmImage.Webcam(300, 300, flip); // width, height, flip
        await webcam.setup(); // request access to the webcam
        await webcam.play();
        window.requestAnimationFrame(loop);

        // append elements to the DOM
        document.getElementById("webcam-container").appendChild(webcam.canvas);

        loading.classList.remove('show');
        document.getElementById('resultsSection').style.display = 'block';
        
        // Hide start button and show stop button
        startButton.style.display = 'none';
        document.getElementById('stopButton').style.display = 'flex';
        
        // Hide placeholder and show active camera section
        document.getElementById('cameraPlaceholder').style.display = 'none';
        document.getElementById('activeCameraSection').style.display = 'flex';
        document.getElementById('finalResultSection').style.display = 'none';
        
        status.className = 'status success';
        status.textContent = '✅ Camera is active! Real-time recognition started.';
        status.style.display = 'block';
        
        isInitialized = true;

    } catch (error) {
        console.error('Error initializing camera:', error);
        loading.classList.remove('show');
        startButton.disabled = false;
        startButton.textContent = 'Try Again';
        
        status.className = 'status error';
        status.textContent = '❌ Error starting camera. Please check camera permissions and try again.';    
        status.style.display = 'block';
    }
}

// Stop camera recognition
function stopCamera() {
    if (!isInitialized) return;
    
    // Stop the webcam
    if (webcam) {
        webcam.stop();
    }
    
    // Reset state
    isInitialized = false;
    
    // Show final result if we have one
    if (finalResult) {
        showFinalResult(finalResult);
    }
    
    // Update UI
    document.getElementById('startButton').style.display = 'flex';
    document.getElementById('stopButton').style.display = 'none';
    document.getElementById('resultsSection').style.display = 'none';
    
    // Clear webcam container
    const webcamContainer = document.getElementById('webcam-container');
    webcamContainer.innerHTML = '';
    
    // Hide active camera and show final result
    document.getElementById('activeCameraSection').style.display = 'none';
    document.getElementById('cameraPlaceholder').style.display = 'none';
    
    // Show status
    const status = document.getElementById('status');
    status.className = 'status success';
    status.textContent = '✅ Recognition stopped. Final result displayed above.';
    status.style.display = 'block';
}

async function loop() {
    if (!isInitialized) return;
    webcam.update(); // update the webcam frame
    await predict();
    window.requestAnimationFrame(loop);
}

// run the webcam image through the image model
async function predict() {
    if (!isInitialized) return;
    
    try {
        // predict can take in an image, video or canvas html element
        const prediction = await model.predict(webcam.canvas);
        
        // Find the most recognizable result (highest probability)
        const mostRecognizable = prediction.reduce((max, current) => 
            current.probability > max.probability ? current : max
        );
        
        // Save the final result
        finalResult = {
            className: mostRecognizable.className,
            probability: mostRecognizable.probability
        };
        
        // Update the display with original order (like final.html)
        updatePredictionsDisplay(prediction);
    } catch (error) {
        console.error('Prediction error:', error);
    }
}

// Show final result
function showFinalResult(result) {
    const finalResultSection = document.getElementById('finalResultSection');
    const finalResultValue = document.getElementById('finalResultValue');
    const finalResultConfidence = document.getElementById('finalResultConfidence');
    
    // Update the result values
    finalResultValue.textContent = result.className;
    finalResultConfidence.textContent = (result.probability * 100).toFixed(0) + "%";
    
    // Show the final result section
    finalResultSection.style.display = 'flex';
}

// Show file final result
function showFileFinalResult(result) {
    const fileFinalResultSection = document.getElementById('fileFinalResultSection');
    const fileFinalResultValue = document.getElementById('fileFinalResultValue');
    const fileFinalResultConfidence = document.getElementById('fileFinalResultConfidence');
    
    // Update the result values
    fileFinalResultValue.textContent = result.className;
    fileFinalResultConfidence.textContent = (result.probability * 100).toFixed(0) + "%";
    
    // Show the file final result section
    fileFinalResultSection.style.display = 'flex';
}

// Restart file analysis
function restartFileAnalysis() {
    // Reset file final result
    fileFinalResult = null;
    
    // Hide final result and show image section
    document.getElementById('fileFinalResultSection').style.display = 'none';
    document.getElementById('fileImageSection').style.display = 'flex';
    
    // Clear status
    document.getElementById('status').style.display = 'none';
}

// Navigate to about page
function showAboutModal() {
    window.location.href = 'about.html';
}

// Restart recognition
function restartRecognition() {
    // Reset state
    isInitialized = false;
    finalResult = null;
    
    // Hide final result and show placeholder
    document.getElementById('finalResultSection').style.display = 'none';
    document.getElementById('cameraPlaceholder').style.display = 'flex';
    document.getElementById('activeCameraSection').style.display = 'none';
    document.getElementById('resultsSection').style.display = 'none';
    
    // Reset buttons
    document.getElementById('startButton').style.display = 'flex';
    document.getElementById('stopButton').style.display = 'none';
    
    // Clear status
    document.getElementById('status').style.display = 'none';
}
