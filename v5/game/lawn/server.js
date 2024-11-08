const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');

const https = require('node:https');
const fs = require('fs');

const options = {
    cert: fs.readFileSync("./ssl/ssl.crt"),
    ca: fs.readFileSync("./ssl/ssl.ca-bundle"),
    key: fs.readFileSync("./ssl/ssl.key")
}


const app = express();
const server = https.createServer(options, app);
const io = new Server(server);


var lobby = {
    host: null, 
    parentConnection: null,
    connections: []
}


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

    socket.on('disconnected', () => {
        if (lobby.parentConnection == socket) {
            for (let player of lobby.connections)
                player.connection.emit('lobby closed');
        }
        else {
            for (let index = 0; index < lobby.connections.length; index++) {
                if (lobby.connections[index].connection == socket) {
                    lobby.parentConnection.emit('player disconnected', index);
                    lobby.connections.filter((player) => player.connection != socket);
                    break;
                }

            }

            
        }
    });
});

server.listen(3000, "91.208.92.78", () => {
    console.log('server running at http://91.208.92.78:3000');
});