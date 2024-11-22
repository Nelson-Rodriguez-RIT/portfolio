const express = require('express');
const { Server } = require('socket.io');
const https = require('node:https');
const fs = require('fs');

const TENOR_KEY = "AIzaSyCWNxcPHOdThgsaqHalQeDa3JEX10WPWRA";

const options = {
    cert: fs.readFileSync("./ssl/ssl.crt"),
    ca: fs.readFileSync("./ssl/ssl.ca-bundle"),
    key: fs.readFileSync("./ssl/ssl.key")
}

const app = express();
const server_https = https.createServer(options, app);
const io = new Server(server_https);



app.use(express.static("public"));


let Lobbies = [];

io.on('connection', (socket) => {
    socket.on('load_profile', (user) => {
        socket.data       = user;
        socket.data.lobby = null;
    });

    socket.on('request_tenor_key', () => {socket.emit('get_tenor_key', TENOR_KEY);});

    socket.on('request_lobbies', () => {
        let lobbiesInfo = [];

        for (let lobby of Lobbies)
            lobbiesInfo.push({
                id: lobby.id, 
                host: lobby.host.data.username, 
                usersConnected: lobby.users.length, 
                passwordRequired: lobby.password
            });

        socket.emit('get_lobbies', lobbiesInfo);
    });

    socket.on('join_lobby', (info) => {
        console.log(info.id, info.password);

        for (let lobby of Lobbies) {
            console.log(lobby.id, lobby.password);

            if (lobby.id == info.id) {
                if (lobby.password == null) {
                    socket.data.lobby = lobby;

                    lobby.users.push(socket);
                    lobby.chat.push({profile: null, username: 'Server', message: `User ${socket.data.username} has connected`, content: null});

                    socket.emit('get_lobby', lobby.chat);

                    for (let user of socket.data.lobby.users)
                        user.emit('lobby_sync', socket.data.lobby.chat);
                }
                

                /*if (lobby.password && lobby.password != null)
                    if (lobby.password == info.password) {
                        socket.data.lobby = lobby;

                        lobby.users.push(socket);
                        lobby.chat.push({profile: null, username: 'Server', message: `User ${socket.data.username} has connected`, content: null});

                        socket.emit('get_lobby', lobby.chat);
                    }
                else {
                    socket.data.lobby = lobby;

                    lobby.users.push(socket);
                    lobby.chat.push({profile: null, username: 'Server', message: `User ${socket.data.username} has connected`, content: null});

                    socket.emit('get_lobby', lobby.chat);
                }*/
            }
        }
            
    });

    socket.on('create_lobby', (info) => {
        for (let lobby of Lobbies)
            if (lobby.id == info.id) return;

        socket.data.lobby = {
            id: info.id,
            password: (info.password == "") ? null : info.password,
            host: socket,
            users: [socket],
            chat: [{profile: null, username: 'Server', message: `Lobby created by ${socket.data.username}`, content: null}]
        }

        Lobbies.push(socket.data.lobby);
        socket.emit('get_lobby', socket.data.lobby.chat);
    });

    socket.on('send_message', (rawMessage) => {
        // Prevent users from sending HTML elements (a vulnerability that even I can't overlook)
        let message = Object.assign(rawMessage);
        message.message = sanatize(rawMessage.message);

        socket.data.lobby.chat.push({profile: socket.data.image, username: socket.data.username, message: message.message, content: message.content});

        for (let user of socket.data.lobby.users)
            user.emit('lobby_sync', socket.data.lobby.chat);
    });
});


server_https.listen(3001, "91.208.92.78", () => {
    console.log('server running at https://app.nellyjelly.me:3001');
});



function sanatize(text) {
    return text.replace(/<(?:.|\n)*?>/, '');
}