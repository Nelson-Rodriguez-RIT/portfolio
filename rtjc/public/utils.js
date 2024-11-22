const NET = {
    loadProfile: () => {
        NETWORK.socket.emit("load_profile", USER);
        UTIL.saveUserInfo();
    },

    requestTenorKey: () => {
        NETWORK.socket.emit("request_tenor_key");
    },

    requestLobbies: () => {
        NETWORK.socket.emit("request_lobbies", null);
    },

    joinLobby: (id, password) => {
        NET.loadProfile();
        NETWORK.socket.emit('join_lobby', {id: id, password: password});
    },

    createLobby: (id, password) => {
        NET.loadProfile();
        NETWORK.socket.emit('create_lobby', {id: id, password: password});
    },

    sendMessage: (message = "", content = null) => {
        NETWORK.socket.emit("send_message", {message: message, content: content});
    },

    disconnect: () => {
        NETWORK.socket.emit('_disconnect');
        UTIL.saveUserInfo();
    }
}

const API = {
    getTenorGIFs: (resultsHTML, term) => {
        if (!CONFIG.tenorKey) return

        let searchURL = `https://tenor.googleapis.com/v2/search?q=${term}&key=${CONFIG.tenorKey}&limit=${CONFIG.tenorLimit}`
        let xmlHTTP = new XMLHttpRequest();

        xmlHTTP.onreadystatechange = () => {
            if (xmlHTTP.readyState == 4 && xmlHTTP.status == 200) {
                let response = JSON.parse(xmlHTTP.responseText);

                resultsHTML.innerHTML = "";
                for (let gif of response.results) {
                    resultsHTML.innerHTML += `
                    <li>
                        <img 
                            onClick="NET.sendMessage(HTML.lobby.input.value, '${gif.media_formats.tinygif.url}'); HTML.lobby.chat.value = ''; HTML.tenor.self.className = 'inactive';" 
                            src="${gif.media_formats.tinygif.url}">
                    </li>`
                }
            }
        }

        xmlHTTP.open("GET", searchURL, true);
        xmlHTTP.send(null);
    }
}

const UTIL = {
    // Converts loaded image files into base64 for transfering across the network
    // (Also avoids Cross-Origins erros in the processs)
    convertToBase64: (ref, fileToConvert) => {
        let fileReader = new FileReader();
        fileReader.onload = (file) => {
            ref.image = file.target.result;
            if (ref.image) 
                HTML.settings.profileDisplay.src = (ref.image != 'null' ? ref.image : './assets/no_pfp.png');
        }
        fileReader.readAsDataURL(fileToConvert);
    },

    saveUserInfo: () => {
        if (!USER.id) // Generates a random 64 length string if an ID isn't present
            USER.id = Math.random().toString(32).substring(2) + Math.random().toString(32).substring(2)

        if (!USER.username)
            USER.username = HTML.settings.username.value;

        if (!USER.image && HTML.settings.profile.value) {
            UTIL.convertToBase64(USER, HTML.settings.profile.files[0]);
            HTML.settings.profileDisplay.src = USER.image && USER.image != 'null' ? USER.image : './assets/no_pfp.png';
        }
            

        localStorage.setItem(CONFIG.localStorageTag + CONFIG.localID,             USER.id);
        localStorage.setItem(CONFIG.localStorageTag + CONFIG.localUsername,       USER.username);
        localStorage.setItem(CONFIG.localStorageTag + CONFIG.localProfilePicture, USER.image);
    }
}

const SETUP = {
    // Gets desired HTML elements from the DOM
    getHTML: () => {
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

            status:   document.querySelector("#ll-status"),
        }
        HTML.settings = {
            self: document.querySelector("#settings"),
            exit:     document.querySelector("#s-exit"),

            username:        document.querySelector("#s-username-input"),
            profile:         document.querySelector("#s-profile-input"),
            profileDisplay:  document.querySelector("#s-profilePic"),
        }
    
    
        // For when the user is connected to a lobby
        HTML.lobby = {
            self: document.querySelector("#lobby"),
    
            chat:  document.querySelector("#l-chat"),
            input: document.querySelector("#l-input-text"),
            tenor: document.querySelector("#l-input-tenor"),

            disconnect: document.querySelector("#l-disconnect"),
        }
        HTML.tenor = {
            self: document.querySelector("#tenor"),
    
            input:   document.querySelector("#t-input"),
            results: document.querySelector("#t-results"),
            status:  document.querySelector("#t-status"),
        }
    },

    // Sets up grabbed HTML elements with onclicks, onloads, etc
    setupHTML: () => {
        HTML.mainMenu.lobbies.onclick = () => {
            if (HTML.settings.username.value) {
                // Close settings window and open lobbies window
                HTML.lobbies.self.className = ""; 
                HTML.settings.self.className = "inactive";
    
                // Get lobbies from server
                NET.requestLobbies();
        }}
        HTML.mainMenu.settings.onclick    = () => {HTML.settings.self.className = ""; HTML.lobbies.self.className = "inactive";};
        HTML.mainMenu.lobbies.onmouseover = () => {if (!HTML.settings.username.value) HTML.mainMenu.lobbiesStatus.className = "";};
        HTML.mainMenu.lobbies.onmouseout  = () => {HTML.mainMenu.lobbiesStatus.className = "inactive";};
        
        HTML.lobbies.exit.onclick     = () => {HTML.lobbies.self.className = "inactive";};
        HTML.lobbies.join.onclick     = () => {if (HTML.lobbies.id.value) NET.joinLobby(HTML.lobbies.id.value, HTML.lobbies.password.value);};
        HTML.lobbies.create.onclick   = () => {if (HTML.lobbies.id.value) NET.createLobby(HTML.lobbies.id.value, HTML.lobbies.password.value);};
        HTML.lobbies.refresh.onclick  = () => {NET.requestLobbies();};
        
        HTML.lobbies.join.onmouseover = () => {if (!HTML.lobbies.id.value) HTML.lobbies.status.className = "";}
        HTML.lobbies.join.onmouseout  = () => {HTML.lobbies.status.className = "inactive";}
        HTML.lobbies.create.onmouseover = () => {if (!HTML.lobbies.id.value) HTML.lobbies.status.className = "";}
        HTML.lobbies.create.onmouseout  = () => {HTML.lobbies.status.className = "inactive";}
    
        HTML.settings.exit.onclick       = () => {HTML.settings.self.className = "inactive";};
        HTML.settings.username.onkeyup   = () => {USER.username = HTML.settings.username.value;};
        HTML.settings.profile.onchange   = () => {if (HTML.settings.profile.files[0]) UTIL.convertToBase64(USER, HTML.settings.profile.files[0]);};
        HTML.settings.profile.ondrop     = () => {if (HTML.settings.profile.files[0]) UTIL.convertToBase64(USER, HTML.settings.profile.files[0]);};
        
    
        HTML.lobby.chat.onclick    = () => {HTML.tenor.self.className = "inactive";}
        HTML.lobby.input.onkeydown = e => {
            let key = e.key.toLowerCase();
    
            if (key == "enter" && HTML.lobby.input.value) {
                NET.sendMessage(HTML.lobby.input.value);
                HTML.lobby.input.value = "";
            }
        }
        HTML.lobby.tenor.onclick      = () => {HTML.tenor.self.className = (HTML.tenor.self.className) ? "" : "inactive";}
        HTML.lobby.disconnect.onclick = () => {NET.disconnect(); }

        HTML.tenor.input.onkeydown = e => {
            let key = e.key.toLowerCase();

            if (key == "enter" && HTML.tenor.input.value) {
                API.getTenorGIFs(HTML.tenor.results, HTML.tenor.input.value);
                HTML.tenor.input.value = "";
            }
        }
    },

    // Gets needed networking elements while also loading information in the server for later
    setupNetworkSocket: () => {
        NETWORK.socket = io();

        NETWORK.socket.on('get_lobbies',   (lobbies) => {
            NETWORK.in = lobbies;
            
            HTML.lobbies.lobbies.innerHTML = "";
            for (let lobby of NETWORK.in)
                HTML.lobbies.lobbies.innerHTML += 
                `<li class="lobby-info">"${lobby.id}" hosted by <img src="${lobby.hostProfile && lobby.hostProfile != 'null' ? lobby.hostProfile : "./assets/no_pfp.png"}" class="pfp"> ${lobby.host}.
                <br><br> ${lobby.usersConnected} users connected ${lobby.passwordRequired ? "(Password Required)" : ""}</li>`
        });

        NETWORK.socket.on('get_lobby', (lobby) => {
            NETWORK.in = lobby;

            // Prepare lobby elements
            HTML.lobby.self.className = "";
            HTML.lobby.chat.innerHTML = "";

            // Deactivate menu objects
            HTML.mainMenu.self.className = "inactive";
            HTML.lobbies.self.className  = "inactive";
            HTML.settings.self.className = "inactive";
        })

        NETWORK.socket.on('lobby_sync',    (lobby)   => {NETWORK.in = lobby;});
        NETWORK.socket.on('get_tenor_key', (key)     => {CONFIG.tenorKey = key;});

        NETWORK.socket.on('_disconnected', () => {
            HTML.mainMenu.self.className = "";

            HTML.lobby.self.className = "inactive";
            HTML.tenor.self.className = "inactive";
        });

        NET.loadProfile();
    },

    // Gets default information stored in the browser
    getDefaultUserInfo: () => {
        USER.id       = localStorage.getItem(CONFIG.localStorageTag + CONFIG.localID);
        USER.username = localStorage.getItem(CONFIG.localStorageTag + CONFIG.localUsername);
        USER.image    = localStorage.getItem(CONFIG.localStorageTag + CONFIG.localProfilePicture);

        HTML.settings.username.value = USER.username;
        if (USER.image) HTML.settings.profileDisplay.src = USER.image != 'null' ? USER.image : './assets/no_pfp.png';

        UTIL.saveUserInfo();
    }
}