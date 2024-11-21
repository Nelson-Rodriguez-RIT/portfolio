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
                {username: "System", message: "Lobby hosted by system", content: null}
            ], 
            emojis: [],
        }
    }
}

const API = {
    getTenorGIFs: (results, term) => {
        let searchURL = `https://tenor.googleapis.com/v2/search?q=${term}&key=${Config.tenorKey}&limit=${20}`
        
        let xmlHTTP = new XMLHttpRequest();
        xmlHTTP.onreadystatechange = () => {
            if (xmlHTTP.readyState == 4 && xmlHTTP.status == 200) {
                console.log(xmlHTTP.responseText);
            }
        }

        xmlHTTP.open("GET", searchURL, true);
        xmlHTTP.send(null);
    }
}