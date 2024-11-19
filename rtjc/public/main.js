const HTML    = {};
const Network = {in: null, out: null};
const User    = {id: null, username: null, profilePic: null}


function load() {
    loadHTML();
}

function update() {
    window.requestAnimationFrame(update);
}

load();

function loadHTML() {
    HTML.mainMenu = {
        self: document.querySelector("#main-menu"),

        lobbies:       document.querySelector("#mm-lobbies"),
        lobbiesStatus: document.querySelector("#mm-lobbies-status"),
        settings:      document.querySelector("#mm-settings"),
    }
    HTML.lobbies = {
        self: document.querySelector("#lobby-list"),

        exit:    document.querySelector("#ll-exit"),
        lobbies: document.querySelector("#ll-lobbies"),

        id:       document.querySelector("#ll-tools-id"),
        password: document.querySelector("#ll-tools-password"),
        create:   document.querySelector("#ll-tools-create"),
        join:     document.querySelector("#ll-tools-join"),
    }
    HTML.settings = {
        self: document.querySelector("#settings"),

        exit:     document.querySelector("#s-exit"),
        username: document.querySelector("#s-username-input"),
    }

    HTML.mainMenu.lobbies.onclick = e => {if (HTML.settings.username.value) {HTML.lobbies.self.className = ""; HTML.settings.self.className = "inactive";}}
    
    HTML.lobbies.exit.onclick = e => {HTML.lobbies.self.className = "inactive";};


    HTML.mainMenu.settings.onclick    = e => {HTML.settings.self.className = ""; HTML.lobbies.self.className = "inactive";}
    HTML.mainMenu.lobbies.onmouseover = e => {if (!HTML.settings.username.value) HTML.mainMenu.lobbiesStatus.className = "";};
    HTML.mainMenu.lobbies.onmouseout  = e => {HTML.mainMenu.lobbiesStatus.className = "inactive";};
    
    HTML.settings.exit.onclick = e => {HTML.settings.self.className = "inactive";};
    
}