const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public')); // Serve the frontend files

const players = {};

// When a new player connects
io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);
    
    // Create a new player
    players[socket.id] = {
        x: Math.random() * 800,
        y: Math.random() * 600,
        radius: 20,
        color: `hsl(${Math.random() * 360}, 100%, 50%)`
    };

    // Listen for mouse movement from this specific client
    socket.on('move', (targetPos) => {
        const player = players[socket.id];
        if (player) {
            // Simple linear interpolation (lerp) towards mouse
            const dx = targetPos.x - player.x;
            const dy = targetPos.y - player.y;
            player.x += dx * 0.05;
            player.y += dy * 0.05;
        }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        console.log(`Player disconnected: ${socket.id}`);
        delete players[socket.id];
    });
});

// The Game Loop: Broadcast state to everyone 30 times a second
setInterval(() => {
    io.emit('gameState', players);
}, 1000 / 30); 

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Game server running on port ${PORT}`);
});