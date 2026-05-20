const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const uiLayer = document.getElementById('ui-layer');
const joinBtn = document.getElementById('join-btn');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let socket;
let mouseX = canvas.width / 2;
let mouseY = canvas.height / 2;
let myId;

joinBtn.addEventListener('click', () => {
    uiLayer.style.display = 'none';
    socket = io();

    socket.on('connect', () => {
        myId = socket.id;
    });

    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    // Send local mouse positions relative to screen center
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

    socket.on('gameState', (state) => {
        const { players, food, mapWidth, mapHeight } = state;
        const me = players[myId];

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.save();
        // Camera Tracking Physics: Translate matrix context to lock view onto local blob
        if (me) {
            ctx.translate(canvas.width / 2 - me.x, canvas.height / 2 - me.y);
        }

        // Draw Map Grid/Borders
        ctx.strokeStyle = '#bdbdbd';
        ctx.lineWidth = 4;
        ctx.strokeRect(0, 0, mapWidth, mapHeight);
        
        // Render Grid Lines for depth perception
        ctx.beginPath();
        for(let x=0; x<mapWidth; x+=100) {
            ctx.moveTo(x, 0); ctx.lineTo(x, mapHeight);
        }
        for(let y=0; y<mapHeight; y+=100) {
            ctx.moveTo(0, y); ctx.lineTo(mapWidth, y);
        }
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Draw Food Pellets
        for (let i = 0; i < food.length; i++) {
            const f = food[i];
            ctx.beginPath();
            ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
            ctx.fillStyle = f.color;
            ctx.fill();
            ctx.closePath();
        }

        // Draw Players
        for (let id in players) {
            const p = players[id];
            
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#000000';
            ctx.stroke();
            ctx.closePath();

            // Render text name/score tags inside blobs
            ctx.fillStyle = '#000000';
            ctx.font = `bold ${Math.max(12, p.radius * 0.3)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText(id === myId ? "You" : "Player", p.x, p.y + 4);
        }

        ctx.restore(); // Revert canvas view modifications for standard overlays

        // Draw HUD overlay (Score)
        if (me) {
            ctx.fillStyle = 'black';
            ctx.font = 'bold 20px sans-serif';
            ctx.fillText(`Mass: ${Math.floor(me.radius)}`, 20, 40);
        }
    });
});

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});
