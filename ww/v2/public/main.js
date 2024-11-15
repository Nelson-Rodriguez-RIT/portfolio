"use scrict";

const canvas = document.getElementById("gameplay-canvas");
const ctx = canvas.getContext('2d');

let State = 'lobby';
const Cache = {}
const Network = {}

function load() {
    Cache.lobby = {
        chat: document.getElementById('chat-text'),
        input: document.getElementById('chat-input')
    }



    Network.chat = []; // {id: string, username: string, content: string}

    update();
}

function update() {
    // Queue this function to be called again next frame
    window.requestAnimationFrame(update);

    // Set background
    ctx.fillStyle = 'rgb(36, 36, 36)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);


    switch(State) {
        case 'lobby':
            // Update chat if new message has arrived in Network
            let messageChildCount;
            while ((messageChildCount = Cache.lobby.chat.childElementCount) < Network.chat.length) {
                let message = document.createElement('li');
                message.innerHTML =
                    `<b>${Network.chat[messageChildCount].username}:</b> ${Network.chat[messageChildCount].content}`;
                Cache.lobby.chat.appendChild(message);
                Cache.lobby.chat.scrollTop = Network.chat.scrollHeight;
            }

            break;
    }
}


window.addEventListener('beforeunload', e => {

})

window.addEventListener('keydown', e => {
    switch(e.key.toLowerCase()) {
        case 'enter':
            e.preventDefault();
            if (State == 'lobby' && Cache.lobby.input) {
                net_sendMessage();
                Cache.lobby.input.value = "";
            }
                

            break;
    }
})

function net_sendMessage() {
    // TODO: Replace with appropriate network code
    Network.chat.push({id: 'system', username: 'User', content: Cache.lobby.input.value});
}



load();