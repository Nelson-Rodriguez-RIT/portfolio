const NET = {
    getLobbies: () => {
        // emit "get lobbies"
        // emit "get lobbies" should return an array filled with the follow data structure 
        // {id: string, passwordRequired: bool, host: string, usersConnected: number}

        // OFFLINE TESTING CODE
        Network.menu = [
            {id: "lobbyNoPass", passwordRequired: false, host: "system", usersConnected: 1},
            {id: "lobbyPass", passwordRequired: true, host: "system", usersConnected: 1},
            {id: "lobbyMultiUsers", passwordRequired: false, host: "system", usersConnected: 5},
        ]
    },

    joinLobby: (id, pass, username) => {
        // OFFLINE TESTING CODE
        Network.lobby = {
            users:  ["system", "user"], // string
            chat:   [ // {username: string, message: string, content: string}
                {profile: null, username: "System", message: "Lobby hosted by system", content: null}
            ], 
            emojis: [],
        }
    },

    sendMessage: (username = "", message = "", content = {tenor: null}) => {
        // OFFLINE TEST CODE
        Network.lobby.chat.push({profile: null, username: username, message: message, content: content});
    }
}

const API = {
    getTenorGIFs: (results, term) => {
        let searchURL = `https://tenor.googleapis.com/v2/search?q=${term}&key=${Config.tenorKey}&limit=${20}`
        
        let xmlHTTP = new XMLHttpRequest();
        xmlHTTP.onreadystatechange = () => {
            if (xmlHTTP.readyState == 4 && xmlHTTP.status == 200) {
                let response = JSON.parse(xmlHTTP.responseText);

                console.log(response);

                for (let gif of response.results) {
                    results.innerHTML += `
                    <li>
                        <img 
                            onClick="NET.sendMessage('User', HTML.lobby.input.value, {tenor: '${gif.media_formats.tinygif.url}'}); HTML.lobby.chat.value = ''; HTML.tenor.self.className = 'inactive';" 
                            src="${gif.media_formats.nanogif.url}">
                    </li>`
                }
            }
        }

        xmlHTTP.open("GET", searchURL, true);
        xmlHTTP.send(null);
    }
}