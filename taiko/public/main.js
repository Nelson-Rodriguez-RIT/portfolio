const HTML   = {};
const USER   = {};

const GAME   = {
    score: 0,
    combo: 0,
    hitObjects: [],
    timer: 0,
    inputs: {rl: false, rr: false, cl: false, cr: false}
};
const CONFIG = {};

let Deltatime    = 0;
let currentTime  = 0;
let previousTime = 0;

function load() {
    loadHTML();
    setupMainMenu();

    update();
}

function update() {
    // Queue this function to be called again next frame
    window.requestAnimationFrame(update);

    // Update deltatime
    currentTime = window.performance.now();
    Deltatime = (currentTime - previousTime); // These means that if deltatime was cumulative it would equal 1 after 1 second
    previousTime = currentTime;

    if (HTML.game.self.className == "") {
        // Move, at most, 50 objects forward based on active game timer
        for (let o = 0; o < GAME.hitObjects.length || o < 50; o++) {
            if(!GAME.hitObjects[o]) continue;

            GAME.hitObjects[o].drawable.style.left = `calc(25vw + ${GAME.hitObjects[o].timing - GAME.timer}px)`

            if (GAME.hitObjects[o].timing < GAME.timer - 50) {
                // Change 100 based on hit window set from the osz difficulty
                GAME.hitObjects[o].enabled = false;
            }
        }

        

        // If hitobject is in target zone
        if (GAME.hitObjects[0].timing < GAME.timer + 50 && GAME.hitObjects[0].timing > GAME.timer - 50) {
            switch(GAME.hitObjects[0].type) {
                case 2: // big don (requires both to be pressed)
                case 0: // don
                    if (GAME.inputs.cl || GAME.inputs.cr) {
                        GAME.hitObjects[0].enabled = false;
                        GAME.score += 300;
                    }
                    break;

                case 3: // big katu
                case 1: // katu
                    if (GAME.inputs.rl || GAME.inputs.rr) {
                        GAME.hitObjects[0].enabled = false;
                        GAME.score += 300;
                    }
                    break;
            }
        }

        // Remove disabled hitObjects (either from  moving too far to left or by being hit)
        GAME.hitObjects = GAME.hitObjects.filter(o => {
            if (!o?.enabled) {
                o.drawable.remove();
                return false;
            }

            return true;
        })

        GAME.timer += Deltatime;
        // TODO: No more hitobjects? Show result screen

        // Functionally, this is how it should work; however, I want to relay key presses to user
        // so a seperate variable will be needed to track inputs for display purposes
        GAME.inputs = {rl: false, rr: false, cl: false, cr: false};
    }

    draw()
}

function draw() {
    HTML.game.score.value = GAME.score
}

window.addEventListener('keydown', e => {
    let key = e.key.toLowerCase();
    // TODO: set up keybinds
    switch(key) {
        case 'd':
            GAME.inputs.rl = true;
            break;
        case 'f':
            GAME.inputs.rr = true;
            break;

        case 'j':
            GAME.inputs.cl = true;
            break;
        case 'k':
            GAME.inputs.cr = true;
            break;
    }

})

load();

function loadHTML() {
    HTML.mainMenu = {
        self: document.querySelector("#main-menu"),

        songSelect:     document.querySelector("#mm-song-select"),
        songSelectDesc: document.querySelector("#mm-song-select-desc"),
        settings:     document.querySelector("#mm-settings"),
        settingsDesc: document.querySelector("#mm-settings-desc"),
    }
    HTML.settings = {
        self: document.querySelector("#settings"),

        exit: document.querySelector("#s-exit"),
    }
    HTML.songSelect = {
        self: document.querySelector("#song-select"),

        beatmaps: document.querySelector("#ss-beatmaps"),

        upload:          document.querySelector("#ss-upload"),
        uploadWindow:    document.querySelector("#ss-upload-window"),
        uploadFile:      document.querySelector("#ss-upload-file"),
        uploadExit:      document.querySelector("#ss-upload-exit"),
    }
    HTML.game = {
        self: document.querySelector("#game"),

        score: document.querySelector("#g-ui-score"),
    }


    HTML.mainMenu.songSelect.onclick     = e => {setupSongSelect();}
    HTML.mainMenu.songSelect.onmouseover = e => {HTML.mainMenu.songSelectDesc.className = "";};
    HTML.mainMenu.songSelect.onmouseout  = e => {HTML.mainMenu.songSelectDesc.className = "inactive";};
    HTML.mainMenu.settings.onclick     = e => {HTML.settings.self.className = ""};
    HTML.mainMenu.settings.onmouseover = e => {HTML.mainMenu.settingsDesc.className = "";};
    HTML.mainMenu.settings.onmouseout  = e => {HTML.mainMenu.settingsDesc.className = "inactive";};

    HTML.settings.exit.onclick = e => {HTML.settings.self.className = "inactive"};

    HTML.songSelect.upload.onclick     = e => {HTML.songSelect.uploadWindow.className = "";};
    HTML.songSelect.uploadExit.onclick = e => {HTML.songSelect.uploadWindow.className = "inactive";};
    HTML.songSelect.uploadFile.ondrop  = e => {loadOSZBeatmap(e.target.files[0])};
    HTML.songSelect.uploadFile.onload  = e => {loadOSZBeatmap(e.target.files[0])};
}

function setupMainMenu() {
    HTML.mainMenu.self.className = "";

    HTML.mainMenu.settings                 = "inactive";
    HTML.songSelect.self.className         = "inactive";
    HTML.songSelect.uploadWindow.className = "inactive";
    HTML.game.self.className               = "inactive";
}

function setupSongSelect() {
    HTML.songSelect.self.className = "";

    HTML.mainMenu.self.className           = "inactive";
    HTML.mainMenu.settings                 = "inactive";
    HTML.songSelect.uploadWindow.className = "inactive";
    HTML.game.self.className               = "inactive";
}

function setupGame(beatmap) {
    HTML.game.self.className = "";

    HTML.mainMenu.self.className           = "inactive";
    HTML.mainMenu.settings                 = "inactive";
    HTML.songSelect.self.className         = "inactive";
    HTML.songSelect.uploadWindow.className = "inactive";


    GAME.score = 0;
    GAME.combo = 0;
    GAME.hitObjects = [];
    GAME.timer = -3000;


    for (let o = 0; o < beatmap.hitObjectTypes.length; o++)
        GAME.hitObjects.push(new HitObject(beatmap.hitObjectTypes[o], beatmap.hitObjectTimings[o]))
}

function loadOSZBeatmap(file) {
    let reader = new FileReader();
    reader.onload = e => {
        let result = e.target.result;
        let beatmap = decodeOSZBeatmap(result);

        if (!beatmap) return;
        let beatmapHTML = document.createElement('li');
        beatmapHTML.dataset.beatmap = beatmap;
        beatmapHTML.innerHTML = `"${beatmap.title}" made by ${beatmap.artist} (Mapped by ${beatmap.mapper})`;
        beatmapHTML.onclick = e => {setupGame(beatmap);};

        HTML.songSelect.beatmaps.appendChild(beatmapHTML);
    }

    reader.readAsText(file, "UTF-8");
}

// Can go in utils
function decodeOSZBeatmap(text) {
    let title, artist, mapper;
    let types   = [];
    let timings = [];

    let data = text.split('\n');
    if (!data || data.length == 0 || !data[0].includes("osu file format v"))
        return null;

    for (let index = 0; index < data.length; index++) {
        let line = data[index];

        if (line.includes("TitleUnicode:"))
            title = line.slice(13, line.length - 1);

        if (line.includes("ArtistUnicode:"))
            artist = line.slice(14, line.length - 1);

        if (line.includes("Creator:"))
            mapper = line.slice(8, line.length - 1);

        if (line.includes("[HitObjects]")) {
            let hitObject;
            let hitObjectCount;

            for (let hitObjectIndex = index + 1; hitObjectIndex < data.length && data[hitObjectIndex] != ""; hitObjectIndex++) {
                hitObject      = data[hitObjectIndex].split(',');
                hitObjectCount = hitObjectIndex - index - 1;

                timings[hitObjectCount] = hitObject[2]; // ms

                switch (hitObject[4]) {
                    case '0':  // don
                        types[hitObjectCount] = 0;
                        break;
                    case '8':  // katu
                        types[hitObjectCount] = 1;
                        break;

                    case '4':  // big don
                        types[hitObjectCount] = 2;
                        break;
                    case '14': // big katu
                        types[hitObjectCount] = 3;
                        break;

                    default: // Type not implemented, currently: drumrolls and dandans
                        types[hitObjectCount] = -1;
                        break;
                }
            }

            break;
        }

    }


    return new Beatmap(title, artist, mapper, types, timings);
}