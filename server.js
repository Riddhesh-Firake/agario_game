const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const MAP_WIDTH = 3000;
const MAP_HEIGHT = 3000;
const players = {};
let food = [];

// Generate initial food pellets
function spawnFood(count) {
    for (let i = 0; i < count; i++) {
        food.push({
            id: Math.random().toString(36).substring(2, 9),
            x: Math.random() * MAP_WIDTH,
            y: Math.random() * MAP_HEIGHT,
            color: `hsl(${Math.random() * 360}, 100%, 50%)`,
            radius: 5
        });
    }
}
spawnFood(500); // Keep a dense map of food

io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);
    
    players[socket.id] = {
        id: socket.id,
        x: Math.random() * MAP_WIDTH,
        y: Math.random() * MAP_HEIGHT,
        radius: 24, // Starting size
        color: `hsl(${Math.random() * 360}, 100%, 60%)`,
        score: 0
    };

    socket.on('move', (mouseData) => {
        const player = players[socket.id];
        if (!player) return;

        // Calculate angle between player center and mouse position
        const dx = mouseData.x - (mouseData.canvasWidth / 2);
        const dy = mouseData.y - (mouseData.canvasHeight / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 10) {
            // Adjust speed dynamically: larger blobs move slower
            const speed = Math.max(1.5, 8 - (player.radius * 0.05));
            const angle = Math.atan2(dy, dx);
            
            player.x += Math.cos(angle) * speed;
            player.y += Math.sin(angle) * speed;

            // Keep player inside map boundaries
            player.x = Math.max(player.radius, Math.min(MAP_WIDTH - player.radius, player.x));
            player.y = Math.max(player.radius, Math.min(MAP_HEIGHT - player.radius, player.y));
        }
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
    });
});

// Main Server Engine Loop (30Hz)
setInterval(() => {
    // 1. Food Collision Detection
    for (let pId in players) {
        const p = players[pId];
        food = food.filter(f => {
            const dx = p.x - f.x;
            const dy = p.y - f.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < p.radius) {
                p.radius += 0.2; // Absorb food mass
                p.score += 1;
                return false; // Remove pellet
            }
            return true;
        });
    }

    // Respawn eaten food to keep the map populated
    if (food.length < 500) {
        spawnFood(500 - food.length);
    }

    // 2. PvP Eating Logic
    const pIds = Object.keys(players);
    for (let i = 0; i < pIds.length; i++) {
        for (let j = 0; j < pIds.length; j++) {
            if (i === j) continue;
            const p1 = players[pIds[i]];
            const p2 = players[pIds[j]];

            if (p1 && p2 && p1.radius > p2.radius * 1.15) { // Must be 15% larger to eat
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // If p1 covers the center of p2
                if (dist < p1.radius - p2.radius / 3) {
                    p1.radius += p2.radius * 0.5; // Gain mass
                    p1.score += p2.score + 10;
                    
                    // Reset the eaten player instead of crashing
                    p2.x = Math.random() * MAP_WIDTH;
                    p2.y = Math.random() * MAP_HEIGHT;
                    p2.radius = 24;
                    p2.score = 0;
                    io.to(p2.id).emit('killed');
                }
            }
        }
    }

    // Broadcast updated game state
    io.emit('gameState', { players, food, mapWidth: MAP_WIDTH, mapHeight: MAP_HEIGHT });
}, 1000 / 30);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server executing on port ${PORT}`));
