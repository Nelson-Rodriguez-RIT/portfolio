// Environment setup
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

canvas.width = 1024;
canvas.height = 576;
ctx.scale(2, 2);

// Maintains a pixalated look
ctx.imageSmoothingEnabled = false;
canvas.style.imageRendering = "pixelated";

var MouseX = 0;
var MouseY = 0;

var Deltatime    = 0;
let currentTime  = 0;
let previousTime = 0;


const CONFIG = {

};


function onload() {

    update();
}


function update() {
    // Queue this function to be called again next frame
    window.requestAnimationFrame(update);

    // Update deltatime
    currentTime = window.performance.now();
    Deltatime = (currentTime - previousTime) / 1000; // These means that if deltatime was cumulative it would equal 1 after 1 second
    previousTime = currentTime;

    // Set background
    ctx.fillStyle = 'rgb(36, 36, 36)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}






// We only care about positions within the canvas element
canvas.addEventListener('mousemove', (event) => {
    MouseX = event.layerX;
    MouseY = event.layerY;
})


onload();