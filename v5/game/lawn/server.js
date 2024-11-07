const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');

const https = require('node:https');

const app = express();
const server = createServer(app);
const io = new Server(server);


var lobby = null;


app.get('/', (req, res) => {
    res.sendFile(join(__dirname, "index.html"));
});

io.on('connection', (socket) => {
    console.log('a user is connecting...');
    
    socket.on('loaded', (msg) => {
        console.log(`user ${msg} has connected`);
    });

    socket.on('create lobby', (msg) => {
        console.log(`lobby created by user ${msg}`);

        lobby = {
            host: msg, 
            parentConnection: socket,
            connections: []
        }
    });

    socket.on('join lobby', (msg) => {
        console.log(`user ${msg.id} has joined __global`);

        if (msg.lobby == "__global") {
            lobby.connections.push({id: msg.id, connection: socket});
            lobby.parentConnection.emit('player connected', msg);
        }
            
    })

    socket.on('update lobby', (msg) => {
        if (!lobby.connections) return;

        for (let player of lobby.connections) {
            if (player.id != lobby.host)
                player.connection.emit('lobby updated', msg.data);
        }
            
    })

    socket.on('send message', (msg) => {
        lobby.parentConnection.emit("message sent", msg)
    })
});

server.listen(3000, "91.208.92.78", () => {
    console.log('server running at http://91.208.92.78:3000');
});
