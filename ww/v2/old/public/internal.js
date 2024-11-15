const LocalStorageIdentifier = "ww-njr5833"
const socket = io();

let ID       = "";
let Username = "";
let Host     = false;
let _Player  = null;

let Chat = [];

let State     = "main menu";
let PrevState = "";

let MenuState     = "start";
let PrevMenuState = "";


let lobbyTargetX = 0;
let lobbyTargetY = 0;

var Deltatime    = 0;
let currentTime  = 0;
let previousTime = 0;

let LobbyMap = null;

const DefaultCanvasWidth  = 1152;
const DefaultCanvasHeight = 477;

const DefaultLobbySize = 16;
const MapTileSize = 64;

const ASSETS = {
    ui: {
        image:  null,
        url:    "./assets/ui.png",

        spritesheet: { w: 128, h: 64 },
    },
    ice_mage: { 
        image:  null,
        url:    "assets/ice_mage.png",

        image_r: null,
        url_r:    "assets/ice_mage_r.png",

        spritesheet: { w: 576, h: 512 },
        sprite:      { w: 64, h: 64 }, 
        offset:      { x: 0, y: 0 },
    },
};


const KEYFRAMES = {
    mage: [
        [10, 20, 30, 40, 50],                   // Idle
        [10, 20, 30, 40, 50],                   // Idle Air
        [6, 12, 18, 24],                        // Walk
        [6, 12, 18, 24, 30, 36, 42, 48],        // Walk Air
        [1],                                    // Hitstun
        [3, 7, 11, 15, 42],                     // Death/Teleport
        [6, 12, 18, 24, 30, 36, 42, 48, 52],    // Attack
        [6, 12, 18, 24, 30, 36, 42, 48, 52],    // Attack Air
    ],
    fire: [
        [5, 10, 15, 20, 25], // Fire explosion
        [4, 8, 12],          // Fire ball

        [0, 5, 10, 10, 10], // Fire burning in place

    ]
}

class Sprite {
    /*
        USAGE
    
        Sprite's have 3 sets of functionality:
    
        "this.animate = false"      [Requires] An image, sprite dimensions, and an offset (can be 0, but has to be defined at least)
            Displays a static image sourced from the over spritesheet
    
        "this.animate = true"       [Requires] The above and sets of keyframes
            Goes through the image and changes the sourced sprite used based on keyframes.
            NOTE:   Assumes that frames for an animation are layed out horizontally,
                    with an entire animations be layed out vertically
    
        
        "this.script = function"    [Requires] One of the above to fufilled and must be manually set
            Does the above, but will also call this script function with respecitive Sprite object being passed as a param. Allows for more
            control over how the sprite is displayed by directly changing values such as this.timer, this.spriteSet, and/or this.spriteFrame.
            Additionally, animation data can be stored for further use via this.cache
        
    */
    
        constructor({asset, keyframes, animate = true, flipX = false}) {
            // Base data required to display anything
            this.image  = asset.image;
            this.image_r = asset.image_r;
    
            this.offset = asset.offset;
            this.sprite = asset.sprite;
    
            // Functionality control
            this.animate = animate;
            this.flipX = flipX;
    
            // Animation control
            this.keyframes = keyframes;
    
            this.spriteSet      = 0; // Determines index of the current animation i.e. walk, run, attack
            this.spriteFrame    = 0; // Determines the index of the sprite within the animation i.e. 1st sprite, 2nd sprite, etc
            this.timer          = 0; // Keeps track of when to update to the next sprite in the spriteSet (or to restart the animation if finished)
    
            // Used, mainly, to interact with keyframes in a specifc way. This should be set manually when needed
            // i.e. teleport uses the death animation twice, playing it backwards a second time while also skipping the first frame both times
            this.script = null;    // Scripts, when called, are passed this entire object as a parem
            this.cache  = {};      // For scripts to store data
            
        }
    
        draw(position_vector) {
            if (this.animate) {
                let keyframesCount = this.keyframes[this.spriteSet].length;
                let keyframeFinal = this.keyframes[this.spriteSet][keyframesCount- 1];
    
                // Update animation timer
                if ((this.timer += Deltatime * 60) >= keyframeFinal)
                    this.timer = 0;
    
                // Set spriteframe based on animation timer
                this.spriteFrame = (this.flipX ? (this.image_r.width / this.sprite.w - 1) : 0 );
                this.keyframes[this.spriteSet].forEach(
                    (keyframe) => { 
                        if (this.timer >= keyframe && !this.flipX) 
                            this.spriteFrame++; 
    
                        if (this.timer >= keyframe && this.flipX) 
                            this.spriteFrame--; 
                    });
            }
    
            if (this.script != null)
                this.script(this);
    
            ctx.drawImage(
                // Sprite sheet
                !this.flipX ? this.image : this.image_r,
    
                // Offset before extracting image
                this.offset.x + (this.spriteFrame * this.sprite.w),
                // Module by total animation count allows use to store more than one set of keyframes for the same animation
                this.offset.y + (this.spriteSet * this.sprite.h),
    
                // Extracted image size
                this.sprite.w, 
                this.sprite.h,
    
                // Final image position. We want the origin to the be the center of the sprite
                (position_vector.x - (0.5 * this.sprite.w)) * (HTML_Lobby.canvas.width / DefaultCanvasWidth),
                (position_vector.z - position_vector.y - (0.75 * this.sprite.h)) * (HTML_Lobby.canvas.height / DefaultCanvasHeight),
    
                // Final image size
                this.sprite.w * (HTML_Lobby.canvas.width / DefaultCanvasWidth) * 2, 
                this.sprite.h * (HTML_Lobby.canvas.height / DefaultCanvasHeight) * 2,
            );
        }
    
        
}

class Player {
    constructor(x, y, sprite) {
        this.x = x;
        this.y = y;

        this.sprite = sprite;
    }
}






const HTML_MainMenu = {
    self: document.getElementById('main-menu'),
    title:  document.getElementById('main-menu-title'),

    status: document.getElementById('main-menu-lobby-status'),
    create: document.getElementById("main-menu-lobby-create"),
    join:   document.getElementById("main-menu-lobby-join"),
    input:  document.getElementById('main-menu-lobby-id'),

    settings: {
        username: document.getElementById("main-menu-settings-username-input"),
    }
}

const HTML_Lobby = {
    self: document.getElementById('lobby'),
    chat:  document.getElementById('lobby-chat'),
    input: document.getElementById('lobby-input'),
    canvas: document.getElementById("lobby-canvas"),

    _map: document.getElementById('lobby-map'),
    map: {
        moveTo: document.getElementById('action-moveTo'),
    },

    _battle: document.getElementById('lobby-battle'),
    battle: {

    },
}
const ctx = HTML_Lobby.canvas.getContext('2d');
// Maintains a pixalated look
ctx.imageSmoothingEnabled = false;
HTML_Lobby.canvas.imageRendering = "pixelated";
ctx.scale(2, 2);


function load() {
    ASSETS.ice_mage.image   = new Image(ASSETS.ice_mage.spritesheet.w, ASSETS.ice_mage.spritesheet.h);
    ASSETS.ice_mage.image_r = new Image(ASSETS.ice_mage.spritesheet.w, ASSETS.ice_mage.spritesheet.h);
    ASSETS.ice_mage.image.src   = ASSETS.ice_mage.url;
    ASSETS.ice_mage.image_r.src = ASSETS.ice_mage.url_r;

    // Prepare elements needed for networking
    if (!(ID = localStorage.getItem(`${LocalStorageIdentifier}-id`))) {
        console.log(`No ID token found at "${LocalStorageIdentifier}-id"! Generating one...`);

        ID = Math.random().toString(32).substring(2) + Math.random().toString(32).substring(2);
        localStorage.setItem(`${LocalStorageIdentifier}-id`, ID);
    }
    console.log(`This session's token is ${ID}`);

    if (!(Username = localStorage.getItem(`${LocalStorageIdentifier}-username`)))
        Username = ID;

    socket.emit('profile load', {id: ID, username: Username});
    console.log(`Connected to main server as ${Username}`);


    // Load default elements
    HTML_MainMenu.settings.username.value = Username;



    HTML_MainMenu.create.onclick = (event) => {net_loadProfile(); net_createLobby(HTML_MainMenu.input.value)};
    HTML_MainMenu.join.onclick = (event) => {net_loadProfile(); net_joinLobby(HTML_MainMenu.input.value)};
    
    HTML_Lobby.map.moveTo.onclick = (event) => {net_moveTo();}

    HTML_Lobby.input.onkeydown = (event) => {
        if (event.key == "Enter") {
            event.preventDefault();

            if (State == 'lobby' && HTML_Lobby.input.value) {
                net_sendMessage(HTML_Lobby.input.value);
                HTML_Lobby.input.value = "";
            }
        }
    }

    _Player = new Player(0, 0, new Sprite({asset: ASSETS.ice_mage, keyframes: KEYFRAMES.mage}));

    update();
}

function update() {
    // Queue this function to be called again next frame
    window.requestAnimationFrame(update);

    // Update deltatime
    currentTime = window.performance.now();
    Deltatime = (currentTime - previousTime) / 1000; // These means that if deltatime was cumulative it would equal 1 after 1 second
    previousTime = currentTime;


    if (PrevState != State)
        switch (State) {
            case 'main menu':
                HTML_MainMenu.self.className   = "";
                HTML_MainMenu.status.innerHTML = "Enter a lobby ID to join or create a lobby";

                HTML_MainMenu.self.className = "";
                HTML_Lobby.self.className    = "disabled";
                break;

            case 'lobby':
                HTML_MainMenu.self.className = "disabled";
                HTML_Lobby.self.className    = "";
                HTML_Lobby._map.className    = "";
                HTML_Lobby._battle.className = "disabled";
                break;
        }

    if (PrevMenuState != MenuState)
        switch (MenuState) {
            case 'start':
                break;
        }

    switch (State) {
        case 'main menu':
            break;


        case 'lobby':
            if (Host)
                net_updateLobby();

            // Set background
            ctx.fillStyle = 'rgb(36, 36, 36)';
            ctx.fillRect(0, 0, HTML_Lobby.canvas.width, HTML_Lobby.canvas.height);



            for (let x = 0; x < DefaultLobbySize; x++) {
                for (let y = 0; y < DefaultLobbySize; y++) {
                    if (x == lobbyTargetX && y == lobbyTargetY)
                        ctx.fillStyle = 'rgb(234, 232, 180)';
                    else
                        ctx.fillStyle = ((x + y) % 2 == 0) ? 'rgb(72, 72, 72)' : 'rgb(92, 92, 92)';

                    ctx.fillRect(
                        ((x - _Player.x) * MapTileSize) * (HTML_Lobby.canvas.width / DefaultCanvasWidth) + HTML_Lobby.canvas.width / 4, 
                        ((y - _Player.y) * MapTileSize) * (HTML_Lobby.canvas.height / DefaultCanvasHeight) + HTML_Lobby.canvas.height/ 4,
                        MapTileSize * (HTML_Lobby.canvas.width / DefaultCanvasWidth), 
                        MapTileSize * (HTML_Lobby.canvas.height / DefaultCanvasHeight)
                    )

                    if (LobbyMap && LobbyMap[x][y]) {
                        _Player.sprite.draw({
                            x: (((x * MapTileSize / 4)) * (HTML_Lobby.canvas.width / DefaultCanvasWidth)) + HTML_Lobby.canvas.width * 0.75, 
                            y: 0, 
                            z: (((y * MapTileSize / 4)) * (HTML_Lobby.canvas.height / DefaultCanvasHeight)) + HTML_Lobby.canvas.height * 0.75})
                    }
                }
            }
                
            


            while (HTML_Lobby.chat.childElementCount < Chat.length) {
                let text = document.createElement('li');
                text.innerHTML = 
                    `<span class="chat-text"><b><u>${Chat[HTML_Lobby.chat.childElementCount].username}</u>: </b>${Chat[HTML_Lobby.chat.childElementCount].message}</span>`;

                HTML_Lobby.chat.appendChild(text);
                HTML_Lobby.chat.scrollTop = HTML_Lobby.chat.scrollHeight;
            }

            break;
    }

    PrevState = State;
}




socket.on('lobby create -> failed', (message) => {
    HTML_MainMenu.status.innerHTML = message;
    console.log(`Failed to create lobby: ${message}`);
});
socket.on('lobby create -> success', (empty) => {
    Host = true;
    State = "lobby";
    console.log(`Created a lobby successfully!`);
});

socket.on('lobby join -> failed', (message) => {
    HTML_MainMenu.status.innerHTML = message;
    console.log(`Failed to join lobby: ${message}`);
});
socket.on('lobby join -> success', (msg) => {
    Host = false;
    State = "lobby";
    console.log(`Joined a lobby successfully!`);
});


socket.on('lobby update: sync', (update) => {
    Chat = update.chat;
    LobbyMap = update.map;
});
socket.on('lobby update: host disconnected', (reason) => {
    Chat.push({id: 'server', username: "Server", message: `Lobby Closed: ${reason}`})
    Console.log(`Host disconnected: ${reason}`)
});



function net_loadProfile() {
    Username = HTML_MainMenu.settings.username.value;
    localStorage.setItem(`${LocalStorageIdentifier}-username`, Username);

    socket.emit('profile load', {id: ID, username: Username});
    console.log(`Sent profile ${Username}(${ID}) to server`);
}

function net_createLobby(lobbyID) {
    socket.emit('lobby create', lobbyID);
    console.log(`Attempting to create lobby with ID ${lobbyID}`);
}

function net_joinLobby(lobbyID) {
    socket.emit('lobby join', lobbyID);
    console.log(`Attempting to join ${lobbyID}`);
}

function net_updateLobby() {
    socket.emit('lobby update', null);
}

function net_sendMessage(message) {
    socket.emit('message sent', {id: ID, username: Username, message: message});
}

function net_moveTo() {
    socket.emit('user move', {past: {x: _Player.x, y: _Player.y}, new: {x: lobbyTargetX, y: lobbyTargetY}});

    _Player.x = lobbyTargetX;
    _Player.y = lobbyTargetY;
}




window.addEventListener('beforeunload', (event) => {
    if (State == 'lobby') {
        if (Host)
            socket.emit('lobby close', "Host has disconnected from the lobby...");
        else
            socket.emit('lobby leave', null);
    }
})

HTML_Lobby.canvas.onclick = (event) => {
    lobbyTargetX = Math.floor((event.layerX + HTML_Lobby.canvas.width / 2) / (MapTileSize * 2)) + _Player.x;
    lobbyTargetY = Math.floor((event.layerY + HTML_Lobby.canvas.height / 2) / (MapTileSize * 2)) + _Player.y;

    if (lobbyTargetX < 0) lobbyTargetX = 0;
    if (lobbyTargetY < 0) lobbyTargetY = 0;
}


load();