// Environment setup
const canvas = document.querySelector('canvas');
const main = document.querySelector('main');
const ctx = canvas.getContext('2d');

canvas.width = 1024;
canvas.height = 576;
ctx.scale(2, 2);

canvas.style.cursor = "initial";

// Maintains a pixalated look
ctx.imageSmoothingEnabled = false;
canvas.style.imageRendering = "pixelated";

var MouseX = 0;
var MouseY = 0;

var Deltatime    = 0;
let currentTime  = 0;
let previousTime = 0;

const CONFIG = {
    localStorageIdentifier: "njr5833-lawn",
};

// Variables that need to be identical for each player within a lobby
const Game = {
    state: "load",
    lobbyID: null,
    players: []
}

const Cache = {
    previousState: "load",
    menu: null,    
}

// User Setup
var userID = null;




function onload() {

    if (!(userID = localStorage.getItem(`${CONFIG.localStorageIdentifier}-id`))) {
        console.log(`No ID token found at "${CONFIG.localStorageIdentifier}-id"! Generating one...`);

        // Generate a random 128 byte token to be used to identify this user amongst other users
        // within their lobby and for statistics
        userID = Math.random().toString(32).substring(2) + Math.random().toString(32).substring(2);

        localStorage.setItem(`${CONFIG.localStorageIdentifier}-id`, userID);
    }
    console.log(`This session's token is ${userID}`);


    Game.state = "menu";
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

    // Used to deinitialize elements no longer in use at the moment
    if (Cache.previousState != Game.state && Game.state != "debug") {
        switch (Cache.previousState) {
            case "menu": {
                Cache.menu.title.style.position = "fixed";
                Cache.menu.title.style.left     = "-9999px";

                Cache.menu.createLobby.style.position = "fixed";
                Cache.menu.createLobby.style.left     = "-9999px";

                Cache.menu.joinLobby.style.position = "fixed";
                Cache.menu.joinLobby.style.left     = "-9999px";
            }
        }
    }

    // Updates based on current state (which is controlled by server once the player is in a lobby)
    switch (Game.state) {
        case "menu":
            // Create menu elements if they don't already exist
            if (Cache.menu == null) {
                Cache.menu = {};

                // Game title
                let menuTitle = document.createElement('h1');
                menuTitle.innerHTML = "Title";
                menuTitle.className = "js-menu";

                menuTitle.style.position    = "relative";
                menuTitle.style.textAlign   = "center";
                menuTitle.style.paddingTop  = "10%"; 
                menuTitle.style.color       = "rgb(204, 204, 204)";

                Cache.menu.title = menuTitle;
                main.appendChild(menuTitle);


                // TODO: Change state onClick()
                // Create lobby button
                let menuCreateLobby = document.createElement('button');
                menuCreateLobby.innerHTML = "Create Lobby";

                Cache.menu.createLobby = menuCreateLobby;
                main.appendChild(menuCreateLobby);


                // Join lobby button
                let menuJoinLobby = document.createElement('button');
                menuJoinLobby.innerHTML = "Join Lobby";

                Cache.menu.joinLobby = menuJoinLobby;
                main.appendChild(menuJoinLobby);
            }
            
            // Initialize menu options if they haven't been already
            if (Cache.previousState != "menu") {
                Cache.menu.title.style.position = "relative";
                Cache.menu.createLobby.style.position = "relative";
                Cache.menu.joinLobby.style.position = "relative";
            }




            Game.state = "debug";
            break;
    }

    Cache.previousState = Game.state;
}






// We only care about positions within the canvas element
canvas.addEventListener('mousemove', (event) => {
    MouseX = event.layerX;
    MouseY = event.layerY;
})


onload();