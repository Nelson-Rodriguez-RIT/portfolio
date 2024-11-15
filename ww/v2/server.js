const express = require('express');
const { Server } = require('socket.io');
const https = require('node:https');
const fs = require('fs');

const cls = require('./classes.js');

const options = {
    cert: fs.readFileSync("./ssl/ssl.crt"),
    ca: fs.readFileSync("./ssl/ssl.ca-bundle"),
    key: fs.readFileSync("./ssl/ssl.key")
}

const app = express();
const server_https = https.createServer(options, app);
const io = new Server(server_https);


const afkTurnLimit   = 10;
const aliveTurnLimit = 3;
const GlobalTurnTimerDefault = 10; // Seconds


let Lobbies = [];

let GlobalTurnTimer = 0;
let Deltatime    = 0;
let currentTime  = 0;
let previousTime = 0;


app.use(express.static("public"));


io.on('connection', (socket) => {

});


server_https.listen(3001, "91.208.92.78", () => {
    console.log('server running at https://app.nellyjelly.me:3001');
});


function sanatize(text) {
    return text.replace(/<(?:.|\n)*?>/gm, '');
}

function handleRequest(data, request) {

}


while (true) {
    // Update deltatime
    currentTime = window.performance.now();
    Deltatime = (currentTime - previousTime) / 1000; // These means that if deltatime was cumulative it would equal 1 after 1 second
    previousTime = currentTime;

    if ((GlobalTurnTimer -= Deltatime) < 0) {
        for (let lobby of Lobbies) {
            for (let request of lobby.requests)
                handleRequest(lobby.data, request);
    
            for (let user of lobby.users) {
                if (user.data.alive && user.data.turnsSinceLastRequest > afkTurnLimit) {
                    user.emit("disconnect", "AFK");
                    user.data.disconnected = true;
                }
                else if (user.data.turnsSinceLastRequest > aliveTurnLimit) {
                    user.emit("disconnect", "Timed Out");
                    user.data.disconnected = true;
                }
                else if (user.data.turnsSinceLastRequest == aliveTurnLimit)
                    user.emit("lifeline", null);
                
                user.emit('sync', lobby.data);
                user.data.turnsSinceLastRequest++;
            }

            lobby.users.filter((user) => !user.data.disconnected);
        }

        GlobalTurnTimer = GlobalTurnTimerDefault;
    }
        
}