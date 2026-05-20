const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const uiLayer = document.getElementById('ui-layer');
const joinBtn = document.getElementById('join-btn');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let socket;
let mouseX = canvas.width / 2;
let mouseY = canvas.height / 2;

joinBtn.addEventListener('click', () => {
    uiLayer.style.display = 'none'; // Hide UI
    socket = io(); // Connect to server

    // Track mouse movement
    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    // Send mouse position to server every frame
    setInterval(() => {
        if (socket) {
            socket.emit('move', { x: mouseX, y: mouseY });
        }
    }, 1000 / 30);

    // Listen for the game state from the server and draw
    socket.on('gameState', (players) => {
        // Clear screen
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw all players
        for (let id in players) {
            const player = players[id];
            
            ctx.beginPath();
            ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
            ctx.fillStyle = player.color;
            ctx.fill();
            ctx.lineWidth = 3;
            ctx.strokeStyle = 'black';
            ctx.stroke();
            ctx.closePath();
        }
    });
});

// Handle window resize
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});