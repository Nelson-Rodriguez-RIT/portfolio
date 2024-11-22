const HTML    = {};
const NETWORK = {};
const USER    = {};
const CONFIG  = {
    noProfilePictureURL: "./assets/no_pfp.png",

    tenorKey:   null,
    tenorLimit: 20,

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
        while ((messageCount = HTML.lobby.chat.childElementCount) < NETWORK.in.length)
            HTML.lobby.chat.innerHTML += 
                `<li class="chat-message">
                    <img src="${NETWORK.in[messageCount].profile ? NETWORK.in[messageCount].profile : "./assets/no_pfp.png"}" class="pfp">
                    <b>${NETWORK.in[messageCount].username}: </b>
                    ${NETWORK.in[messageCount].message}
                    ${NETWORK.in[messageCount].content ? `<br><img src=${NETWORK.in[messageCount].content}` : ""}
                </li>`;
    }
}

load();