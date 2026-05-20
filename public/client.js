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
    socket = io('https://blob-io-route-t-r-uongh-i-e-n-mai-dev.apps.rm1.0a51.p1.openshiftapps.com');

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
    // Engine Frame Processing
    socket.on('gameState', (state) => {
        const { players, food, mapWidth, mapHeight } = state;
        
        if (!myId && socket) {
            myId = socket.id;
        }

        const me = players[myId];

        // 1. Clear the canvas frame buffer completely
        ctx.fillStyle = '#fbfbfb';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // If our local player blob hasn't spawned into the server state array yet, skip rendering this frame
        if (!me) return;

        // 2. CAMERA CALCULATION: Find the center screen anchoring offsets
        const camX = canvas.width / 2 - me.x;
        const camY = canvas.height / 2 - me.y;

        // 3. DRAW MAP BORDER: Offset the map walls relative to our camera positioning
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 6;
        ctx.strokeRect(0 + camX, 0 + camY, mapWidth, mapHeight);
        
        // 4. RENDER BACKGROUND GRID LINES: Draw them relative to the camera vector position
        ctx.beginPath();
        ctx.strokeStyle = '#e8e8e8';
        ctx.lineWidth = 1;
        // Draw vertical column grid ticks
        for (let x = 0; x <= mapWidth; x += 100) {
            ctx.moveTo(x + camX, 0 + camY);
            ctx.lineTo(x + camX, mapHeight + camY);
        }
        // Draw horizontal row grid ticks
        for (let y = 0; y <= mapHeight; y += 100) {
            ctx.moveTo(0 + camX, y + camY);
            ctx.lineTo(mapWidth + camX, y + camY);
        }
        ctx.stroke();

        // 5. RENDER ALL FOOD PELLETS
        for (let i = 0; i < food.length; i++) {
            const f = food[i];
            // Only draw food if it is roughly inside the player's viewing screen window to optimize performance
            if (f.x + camX >= 0 && f.x + camX <= canvas.width && f.y + camY >= 0 && f.y + camY <= canvas.height) {
                ctx.beginPath();
                ctx.arc(f.x + camX, f.y + camY, f.radius, 0, Math.PI * 2);
                ctx.fillStyle = f.color;
                ctx.fill();
                ctx.closePath();
            }
        }

        // 6. RENDER ALL ACTIVE PLAYER BLOBS
        for (let id in players) {
            const p = players[id];
            
            ctx.beginPath();
            ctx.arc(p.x + camX, p.y + camY, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
            ctx.lineWidth = 4;
            ctx.strokeStyle = '#000000';
            ctx.stroke();
            ctx.closePath();

            // Render text name configuration overhead tags inside blobs
            ctx.fillStyle = '#000000';
            ctx.font = `bold ${Math.max(14, p.radius * 0.35)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(id === myId ? "You" : "Blob", p.x + camX, p.y + camY);
        }

        // 7. DRAW SCOREBOARD FIXED HEADS-UP UI (HUD) OVERLAY
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        ctx.fillRect(25, 25, 150, 50);
        ctx.strokeRect(25, 25, 150, 50);

        ctx.fillStyle = '#000000';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(`Score: ${Math.floor(me.radius * 10 - 240)}`, 40, 56);
    });
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});
