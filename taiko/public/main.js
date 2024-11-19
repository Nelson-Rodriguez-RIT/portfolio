const HTML   = {};
const CONFIG = {};
const USER   = {};

function load() {
    loadHTML();
    setupMainMenu();
}

function update() {
    window.requestAnimationFrame(update);



    draw();
}

function draw() {

}

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

        upload:       document.querySelector("#ss-upload"),
        uploadWindow: document.querySelector("#ss-upload-window"),
        uploadFile:   document.querySelector("#ss-upload-file"),
        uploadExit:   document.querySelector("#ss-upload-exit"),
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
    HTML.songSelect.uploadFile.ondrop  = e => {console.log(e);};
}

function setupMainMenu() {
    HTML.mainMenu.self.className = "";

    HTML.songSelect.self.className = "inactive";
}

function setupSongSelect() {
    HTML.songSelect.self.className = "";

    HTML.mainMenu.self.className = "inactive";
}