const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const uiLayer = document.getElementById('ui-layer');
const joinBtn = document.getElementById('join-btn');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let socket;
let mouseX = canvas.width / 2;
let mouseY = canvas.height / 2;
let myId = null;

joinBtn.addEventListener('click', () => {
    uiLayer.style.display = 'none';
    
    // 1. Establish the connection immediately
    socket = io();

    // 2. Explicitly capture the true underlying socket ID on connect
    socket.on('connect', () => {
        myId = socket.id;
        console.log("Successfully assigned local player ID:", myId);
    });

    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    // Send mouse tracking telemetry positions
    setInterval(() => {
        if (socket && socket.connected) {
            socket.emit('move', {
                x: mouseX,
                y: mouseY,
                canvasWidth: canvas.width,
                canvasHeight: canvas.height
            });
        }
    }, 1000 / 30);

    socket.on('killed', () => {
        alert('You got consumed! Click OK to respawn.');
    });

    // 3. Engine Frame Processing
    socket.on('gameState', (state) => {
        const { players, food, mapWidth, mapHeight } = state;
        
        // Safety check: if our ID hasn't registered yet, try reading it from the socket object directly
        if (!myId && socket) {
            myId = socket.id;
        }

        const me = players[myId];

        // Reset canvas frame buffer
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.save();
        
        // CAMERA SYSTEM DETECTOR:
        if (me) {
            // Lock camera layout precisely over our local sphere center point
            ctx.translate(canvas.width / 2 - me.x, canvas.height / 2 - me.y);
        } else {
            // Fallback: Default to center map workspace coordinates if ID matching takes an extra tick
            ctx.translate(canvas.width / 2 - (mapWidth / 2), canvas.height / 2 - (mapHeight / 2));
        }

        // Draw Map Border Area
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 8;
        ctx.strokeRect(0, 0, mapWidth, mapHeight);
        
        // Render Internal Grid Matrix Paths
        ctx.beginPath();
        for(let x = 0; x <= mapWidth; x += 100) {
            ctx.moveTo(x, 0); ctx.lineTo(x, mapHeight);
        }
        for(let y = 0; y <= mapHeight; y += 100) {
            ctx.moveTo(0, y); ctx.lineTo(mapWidth, y);
        }
        ctx.strokeStyle = '#e3e3e3';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Draw Food Elements
        for (let i = 0; i < food.length; i++) {
            const f = food[i];
            ctx.beginPath();
            ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
            ctx.fillStyle = f.color;
            ctx.fill();
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'rgba(0,0,0,0.15)';
            ctx.stroke();
            ctx.closePath();
        }

        // Draw Players Outer Spheres
        for (let id in players) {
            const p = players[id];
            
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
            ctx.lineWidth = 4;
            ctx.strokeStyle = '#000000';
            ctx.stroke();
            ctx.closePath();

            // Text Label Configuration
            ctx.fillStyle = '#000000';
            ctx.font = `bold ${Math.max(14, p.radius * 0.35)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(id === myId ? "You" : "Blob", p.x, p.y);
        }

        ctx.restore(); // Revert matrix translation layout modifications for clean HUD text layers

        // Draw Scoreboard UI Overlay HUD
        if (me) {
            // Draw a bold tracking card background box
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            ctx.fillRect(20, 20, 160, 50);
            ctx.strokeRect(20, 20, 160, 50);

            ctx.fillStyle = '#000000';
            ctx.font = 'bold 18px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(`Mass: ${Math.floor(me.radius)}`, 35, 52);
        }
    });
});

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});
