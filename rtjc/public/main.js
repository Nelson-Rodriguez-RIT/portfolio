const HTML    = {};
const NETWORK = {};
const USER    = {};
const CONFIG  = {
    noProfilePictureURL: "./assets/no_pfp.png",

    tenorKey:   null,
    tenorLimit: 30,

    localStorageTag:     "njr-",
    localID:             "id",
    localUsername:       "username",
    localProfilePicture: "profile-picture",
};

function load() {
    SETUP.getHTML();
    SETUP.setupHTML();

    SETUP.getDefaultUserInfo();
    SETUP.setupNetworkSocket();

    NET.requestTenorKey();

    update();
}

function update() {
    window.requestAnimationFrame(update);

    if (NETWORK.in && !HTML.lobby.self.className) {
        // Update messages as new ones appear from Network
        let messageCount;
        while ((messageCount = HTML.lobby.chat.childElementCount) < NETWORK.in.length) {
            HTML.lobby.chat.innerHTML += 
                `<li class="chat-message" onClick="HTML.tenor.self.className = 'inactive';">
                    <img src="${NETWORK.in[messageCount].profile && NETWORK.in[messageCount].profile != 'null' ? NETWORK.in[messageCount].profile : "./assets/no_pfp.png"}" class="pfp">
                    <b>${NETWORK.in[messageCount].username}: </b>
                    ${NETWORK.in[messageCount].message}
                    ${NETWORK.in[messageCount].content ? `<br><img src=${NETWORK.in[messageCount].content}` : ""}
                </li>`;

            HTML.lobby.chat.scrollTop =  HTML.lobby.chat.scrollHeight;
        }
        
        if (HTML.tenor.results.innerHTML == "")
            HTML.tenor.status.className = ""
        else
            HTML.tenor.status.className = "inactive";
    }
}

window.addEventListener('beforeunload', () => {NET.disconnect();});

load();