// Delicate ASCII Dots Component for Background
document.addEventListener("DOMContentLoaded", function () {
    const canvas = document.createElement("canvas");
    canvas.id = "ascii-dots-canvas";
    canvas.style.position = "fixed";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100vw";
    canvas.style.height = "100vh";
    canvas.style.zIndex = "-1";
    canvas.style.pointerEvents = "none";
    document.body.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let config = {
        backgroundColor: 'transparent',
        textColor: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? '200, 200, 200' : '85, 85, 85',
        gridSize: 80,
        removeWaveLine: true,
        animationSpeed: 0.75
    };

    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
            config.textColor = event.matches ? '200, 200, 200' : '85, 85, 85';
        });
    }

    let dimensions = { width: window.innerWidth, height: window.innerHeight };
    let mouse = { x: -1000, y: -1000, isDown: false };
    let waves = [];
    let clickWaves = [];
    let time = 0;
    let animationFrameId;

    const CHARS = '⣧⣩⣪⣫⣬⣭⣮⣯⣱⣲⣳⣴⣵⣶⣷⣹⣺⣻⣼⣽⣾⣿⣧⣩⣪⣫⣬⣭⣮⣯⣱⣲⣳⣴⣵⣶⣷⣹⣺⣻⣼⣽⣾⣿'.split('');

    function resizeCanvas() {
        dimensions.width = window.innerWidth;
        dimensions.height = window.innerHeight;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = dimensions.width * dpr;
        canvas.height = dimensions.height * dpr;
        canvas.style.width = dimensions.width + 'px';
        canvas.style.height = dimensions.height + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function handleMouseMove(e) {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    }

    function handleMouseDown(e) {
        mouse.isDown = true;
        const cellWidth = dimensions.width / config.gridSize;
        const cellHeight = dimensions.height / config.gridSize;
        const gridX = e.clientX / cellWidth;
        const gridY = e.clientY / cellHeight;

        clickWaves.push({
            x: gridX,
            y: gridY,
            time: Date.now(),
            intensity: 2
        });

        const now = Date.now();
        clickWaves = clickWaves.filter(w => now - w.time < 4000);
    }

    function handleMouseUp() {
        mouse.isDown = false;
    }

    function getClickWaveInfluence(x, y, currentTime) {
        let totalInfluence = 0;
        clickWaves.forEach(w => {
            const age = currentTime - w.time;
            const maxAge = 4000;
            if (age < maxAge) {
                const dx = x - w.x;
                const dy = y - w.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const waveRadius = (age / maxAge) * config.gridSize * 0.8;
                const waveWidth = config.gridSize * 0.15;

                if (Math.abs(distance - waveRadius) < waveWidth) {
                    const waveStrength = (1 - age / maxAge) * w.intensity;
                    const proximityToWave = 1 - Math.abs(distance - waveRadius) / waveWidth;
                    totalInfluence += waveStrength * proximityToWave * Math.sin((distance - waveRadius) * 0.5);
                }
            }
        });
        return totalInfluence;
    }

    function animate() {
        const currentTime = Date.now();
        time += config.animationSpeed * 0.016;
        
        const { width, height } = dimensions;
        if (width === 0 || height === 0) return;

        if (config.backgroundColor === 'transparent') {
            ctx.clearRect(0, 0, width, height);
        } else {
            ctx.fillStyle = config.backgroundColor;
            ctx.fillRect(0, 0, width, height);
        }

        const newGrid = Array(config.gridSize).fill(0).map(() => Array(config.gridSize).fill(null));
        const cellWidth = width / config.gridSize;
        const cellHeight = height / config.gridSize;

        const mouseGridX = mouse.x / cellWidth;
        const mouseGridY = mouse.y / cellHeight;

        const mouseWave = {
            x: mouseGridX,
            y: mouseGridY,
            frequency: 0.3,
            amplitude: 1,
            phase: time * 2,
            speed: 1
        };

        for (let y = 0; y < config.gridSize; y++) {
            for (let x = 0; x < config.gridSize; x++) {
                let totalWave = 0;
                const allWaves = waves.concat([mouseWave]);

                allWaves.forEach(w => {
                    const dx = x - w.x;
                    const dy = y - w.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const falloff = 1 / (1 + dist * 0.1);
                    const value = Math.sin(dist * w.frequency - time * w.speed + w.phase) * w.amplitude * falloff;
                    totalWave += value;
                });

                const clickInfluence = getClickWaveInfluence(x, y, currentTime);
                totalWave += clickInfluence;

                const mouseDistance = Math.sqrt((x - mouseGridX) ** 2 + (y - mouseGridY) ** 2);
                if (mouseDistance < config.gridSize * 0.3) {
                    const mouseEffect = (1 - mouseDistance / (config.gridSize * 0.3)) * 0.8;
                    totalWave += mouseEffect * Math.sin(time * 3);
                }

                const normalizedWave = (totalWave + 2) / 4;
                if (Math.abs(totalWave) > 0.2) {
                    const charIndex = Math.min(CHARS.length - 1, Math.max(0, Math.floor(normalizedWave * (CHARS.length - 1))));
                    const opacity = Math.min(0.9, Math.max(0.4, 0.4 + normalizedWave * 0.5));
                    newGrid[y][x] = { char: CHARS[charIndex] || CHARS[0], opacity };
                }
            }
        }

        const fontSize = Math.min(cellWidth, cellHeight) * 0.8;
        ctx.font = `${fontSize}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let y = 0; y < config.gridSize; y++) {
            for (let x = 0; x < config.gridSize; x++) {
                const cell = newGrid[y][x];
                if (cell && cell.char) {
                    ctx.fillStyle = `rgba(${config.textColor}, ${cell.opacity})`;
                    ctx.fillText(cell.char, x * cellWidth + cellWidth / 2, y * cellHeight + cellHeight / 2);
                }
            }
        }

        if (!config.removeWaveLine) {
            clickWaves.forEach(w => {
                const age = currentTime - w.time;
                const maxAge = 4000;
                if (age < maxAge) {
                    const progress = age / maxAge;
                    const radius = progress * Math.min(width, height) * 0.5;
                    const alpha = (1 - progress) * 0.3 * w.intensity;

                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(${config.textColor}, ${alpha})`;
                    ctx.lineWidth = 1;
                    ctx.arc(w.x * cellWidth, w.y * cellHeight, radius, 0, 2 * Math.PI);
                    ctx.stroke();
                }
            });
        }

        animationFrameId = requestAnimationFrame(animate);
    }

    function init() {
        for (let i = 0; i < 4; i++) {
            waves.push({
                x: config.gridSize * (0.25 + Math.random() * 0.5),
                y: config.gridSize * (0.25 + Math.random() * 0.5),
                frequency: 0.2 + Math.random() * 0.3,
                amplitude: 0.5 + Math.random() * 0.5,
                phase: Math.random() * Math.PI * 2,
                speed: 0.5 + Math.random() * 0.5
            });
        }

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mouseup', handleMouseUp);
        animate();
    }

    init();
});
