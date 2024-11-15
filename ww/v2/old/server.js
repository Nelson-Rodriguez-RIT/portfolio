const express = require('express');
const { join } = require('node:path');
const { Server } = require('socket.io');
const https = require('node:https');
const http = require('http');
const fs = require('fs');
const { create } = require('node:domain');

const options = {
    cert: fs.readFileSync("./ssl/ssl.crt"),
    ca: fs.readFileSync("./ssl/ssl.ca-bundle"),
    key: fs.readFileSync("./ssl/ssl.key")
}

const app = express();
const server_https = https.createServer(options, app);
//const server_http  = http.createServer(app);
const io = new Server(server_https);

let Lobbies = [];
class Lobby {
    constructor(id, host = {id: "", socket: null}) {
        this.id = id;
        this.host = host;
        this.users = []; // socket
        this.chat = []; // {id: "", username: "", message: ""}
        this.map = [[]]; // Store a reference to the occording socket
    }
}

app.use(express.static("public"));


io.on('connection', (socket) => {
    socket.on('profile load', (user) => {
        socket.data.id = user.id;
        socket.data.username = user.username 
        socket.data.lobby = null;
    })

    socket.on('lobby create', (lobbyID) => {
        // Prevent duplicate lobby ids and users from hosting more than one server
        for (let lobby of Lobbies) {
            if (lobby.host.id == socket.data.id) {
                socket.emit('lobby create -> failed', "A lobby for this session has be already been created!");
                return;
            }

            if (lobby.id == lobbyID) {
                socket.emit('lobby create -> failed', "This lobby name is already being used!");
                return;
            }
        }

        let lobby = new Lobby(lobbyID, {id: socket.data.id, socket: socket});
        lobby.users.push(socket);
        lobby.chat.push({id: "server", username: "Server", message: `Lobby '${lobby.id}' created by ${socket.data.username}`})
        for (let x = 0; x < 16; x++) {
            lobby.map[x] = [];
            for (let y = 0; y < 16; y++)
                lobby.map[x][y] = false;
        }
            
        lobby.map[0][0] = true;

        Lobbies.push(lobby);
        socket.data.lobby = lobby;
        socket.emit('lobby create -> success', null);
    })

    socket.on('lobby join', (lobbyID) => {
        for (let lobby of Lobbies)
            if (lobby.id == lobbyID) {
                for (let user of lobby.users)
                    if (socket.data.id == user.data.id) {
                        socket.emit('lobby join -> failed', "You already have an active connection to this lobby!");
                        return;
                    }

                lobby.users.push(socket);
                lobby.chat.push({id: 'server', username: 'Server', message: `User ${socket.data.username} has connected`});
                lobby.map[lobby.users.length][0] = true;

                socket.data.lobby = lobby;
                socket.emit('lobby join -> success', null);
            }

        socket.emit('lobby join -> failed', "This lobby doesn't exist...");
    })

    socket.on('lobby close', (reason) => {
        // Only the host can close the lobby, whether it be via tab close or disconnect
        if (socket.data.lobby?.host.socket == socket) {
            let lobbyRef = null;
            for (let lobby of Lobbies)
                if (socket.data.lobby == lobby) lobbyRef = lobby;


            for (let user of socket.data.lobby.users) {
                user.emit('lobby update: host disconnected', reason);
                user.data.lobby = null;
            }

            Lobbies = Lobbies.filter(lobby => lobby != lobbyRef);
        }
    })

    socket.on('lobby leave', (empty) => {
        if (socket.data.lobby) {
            // Remove this user from the users list and notify the server of the disconnection
            socket.data.lobby.chat.push({id: 'server', username: 'Server', message: `User ${socket.data.username} has disconnected`});
            socket.data.lobby.users = socket.data.lobby.users.filter(user => user != socket);
            socket.data.lobby = null;
        }
    })

    socket.on('lobby update', (empty) => {
        if (socket.data.lobby?.host.socket == socket) // Only allow host to initiate updates
            for (let user of socket.data.lobby.users) // Send out a copy of, for the moment, chat data
                user.emit('lobby update: sync', {chat: socket.data.lobby.chat, map: socket.data.lobby.map});
    })



    socket.on('message sent', (message) => {
        if (socket.data.lobby?.chat)
            socket.data.lobby.chat.push({id: message.id, username: sanatize(message.username), message: sanatize(message.message)});
    })


    socket.on('user move', (location) => {
        socket.data.lobby.map[location.past.x][location.past.y] = false;
        socket.data.lobby.map[location.new.x][location.new.y] = true;
    })

    socket.on('user interact', (empty) => {

    })
});

server_https.listen(3001, "91.208.92.78", () => {
    console.log('server running at https://app.nellyjelly.me:3001');
});


function sanatize(text) {
    return text.replace(/<(?:.|\n)*?>/gm, '');
}