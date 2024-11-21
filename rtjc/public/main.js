const HTML    = {};
const Network = {};
const User    = {id: null, username: null, profilePic: null}
const Config = {
    tenorKey: "AIzaSyCWNxcPHOdThgsaqHalQeDa3JEX10WPWRA",
}

function load() {
    loadHTML();

    update();
}

function update() {
    window.requestAnimationFrame(update);

    // While in lobby...
    if (Network.lobby) {
        // Update messages if a new ones appear from Network
        let messageCount;
        while ((messageCount = HTML.lobby.chat.childElementCount) < Network.lobby.chat.length)
            HTML.lobby.chat.innerHTML += 
                `<li>
                    <img src="${Network.lobby.chat[messageCount].profile ? "" : "./assets/no_pfp.png"}">
                    <b>${Network.lobby.chat[messageCount].username}: </b>
                    ${Network.lobby.chat[messageCount].message}
                    ${Network.lobby.chat[messageCount].content?.tenor ? `<br><img src=${Network.lobby.chat[messageCount].content.tenor}` : ""}
                </li>`
            
    }
}

load();

function loadHTML() {
    // Used for the main menu, loading user settings, and creating/joining a lobby
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
        refresh:  document.querySelector("#ll-tools-refresh"),
    }
    HTML.settings = {
        self: document.querySelector("#settings"),

        exit:     document.querySelector("#s-exit"),
        username: document.querySelector("#s-username-input"),
    }


    // For when the user is connected to a lobby
    HTML.lobby = {
        self: document.querySelector("#lobby"),

        chat:  document.querySelector("#l-chat"),
        input: document.querySelector("#l-input-text"),
        tenor: document.querySelector("#l-input-tenor"),
    }
    HTML.tenor = {
        self: document.querySelector("#tenor"),

        input:   document.querySelector("#t-input"),
        results: document.querySelector("#t-results"),
    }

    

    HTML.mainMenu.lobbies.onclick = e => {
        if (HTML.settings.username.value) {
            HTML.lobbies.self.className = ""; 
            HTML.settings.self.className = "inactive";

            // Get lobbies (wait until server responds)
            NET.getLobbies();
            while(!Network.menu) setTimeout(500);
            
            // Load lobby info
            HTML.lobbies.lobbies.innerHTML = "";
            for (let lobby of Network.menu)
                HTML.lobbies.lobbies.innerHTML += `<li>"${lobby.id}" hosted by ${lobby.host}.<br> ${lobby.usersConnected} users connected ${lobby.passwordRequired ? "(Password Required)" : ""}</li>`

    }}
    
    HTML.lobbies.exit.onclick = e => {HTML.lobbies.self.className = "inactive";};


    HTML.mainMenu.settings.onclick    = e => {HTML.settings.self.className = ""; HTML.lobbies.self.className = "inactive";}
    HTML.mainMenu.lobbies.onmouseover = e => {if (!HTML.settings.username.value) HTML.mainMenu.lobbiesStatus.className = "";};
    HTML.mainMenu.lobbies.onmouseout  = e => {HTML.mainMenu.lobbiesStatus.className = "inactive";};
    

    HTML.lobbies.join.onclick = e => {
        HTML.lobby.chat.innerHTML = "";
        if (HTML.lobbies.id.value)
            NET.joinLobby(HTML.lobbies.id, HTML.lobbies.password, HTML.settings.username);
        
        // Have server emit back data if its available
        // OFFLINE TEST CODE
        HTML.lobby.self.className = "";

        HTML.mainMenu.self.className = "inactive";
        HTML.lobbies.self.className  = "inactive";
        HTML.settings.self.className = "inactive";
    }
    HTML.lobbies.refresh.onclick = e => {
        // Get lobbies (wait until server responds)
        NET.getLobbies();
        while(!Network.menu) setTimeout(500);
        
        // Load lobby info
        HTML.lobbies.lobbies.innerHTML = "";
        for (let lobby of Network.in)
            HTML.lobbies.lobbies.innerHTML += `<li>"${lobby.id}" hosted by ${lobby.host}.<br> ${lobby.usersConnected} users connected ${lobby.passwordRequired ? "(Password Required)" : ""}</li>`
    }

    HTML.settings.exit.onclick = e => {HTML.settings.self.className = "inactive";};
    

    HTML.lobby.input.onkeydown = e => {
        let key = e.key.toLowerCase();

        // OFFLINE TESTING CODE
        if (key == "enter" && HTML.lobby.input.value) {
            Network.lobby.chat.push({username: "User", message: HTML.lobby.input.value, content: null});
            HTML.lobby.input.value = "";
        }
    }
    HTML.lobby.tenor.onclick = e => {
        HTML.tenor.self.className = (HTML.tenor.self.className) ? "" : "inactive";
    }

    HTML.tenor.input.onkeydown = e => {
        let key = e.key.toLowerCase();

        // OFFLINE TESTING CODE
        if (key == "enter" && HTML.tenor.input.value) {
            API.getTenorGIFs(HTML.tenor.results, HTML.tenor.input.value);
            HTML.tenor.input.value = "";
        }
    }
    
}