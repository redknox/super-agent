const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gridSize = 100;
const cellSize = 6; // 600 / 100

let snake1 = [{x: 10, y: 10}, {x: 9, y: 10}];
let dir1 = {x: 1, y: 0};
let snake2 = [{x: 90, y: 90}, {x: 91, y: 90}];
let dir2 = {x: -1, y: 0};

let foods = [];

function spawnFood() {
    while (foods.length < 2) {
        let x = Math.floor(Math.random() * gridSize);
        let y = Math.floor(Math.random() * gridSize);
        // Avoid spawning on snakes
        let onSnake = snake1.some(s => s.x === x && s.y === y) || snake2.some(s => s.x === x && s.y === y);
        if (!onSnake) {
            foods.push({x, y});
        }
    }
}

spawnFood();

document.addEventListener('keydown', e => {
    switch(e.key) {
        case 'w': if (dir1.y !== 1) dir1 = {x: 0, y: -1}; break;
        case 's': if (dir1.y !== -1) dir1 = {x: 0, y: 1}; break;
        case 'a': if (dir1.x !== 1) dir1 = {x: -1, y: 0}; break;
        case 'd': if (dir1.x !== -1) dir1 = {x: 1, y: 0}; break;
        case 'ArrowUp': if (dir2.y !== 1) dir2 = {x: 0, y: -1}; break;
        case 'ArrowDown': if (dir2.y !== -1) dir2 = {x: 0, y: 1}; break;
        case 'ArrowLeft': if (dir2.x !== 1) dir2 = {x: -1, y: 0}; break;
        case 'ArrowRight': if (dir2.x !== -1) dir2 = {x: 1, y: 0}; break;
    }
});

function moveSnake(snake, dir) {
    const head = {x: snake[0].x + dir.x, y: snake[0].y + dir.y};
    // Wall collision
    if (head.x < 0 || head.x >= gridSize || head.y < 0 || head.y >= gridSize) return false;
    // Self/Other collision
    if (snake1.some(s => s.x === head.x && s.y === head.y) || snake2.some(s => s.x === head.x && s.y === head.y)) return false;

    snake.unshift(head);
    
    // Food check
    let foodIndex = foods.findIndex(f => f.x === head.x && f.y === head.y);
    if (foodIndex !== -1) {
        foods.splice(foodIndex, 1);
        spawnFood();
    } else {
        snake.pop();
    }
    return true;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw food
    ctx.fillStyle = 'red';
    foods.forEach(f => ctx.fillRect(f.x * cellSize, f.y * cellSize, cellSize - 1, cellSize - 1));
    
    // Draw snakes
    ctx.fillStyle = 'blue';
    snake1.forEach(s => ctx.fillRect(s.x * cellSize, s.y * cellSize, cellSize - 1, cellSize - 1));
    ctx.fillStyle = 'green';
    snake2.forEach(s => ctx.fillRect(s.x * cellSize, s.y * cellSize, cellSize - 1, cellSize - 1));
}

let lastTime = 0;
const speed = 100; // ms

function gameLoop(timestamp) {
    if (timestamp - lastTime > speed) {
        if (!moveSnake(snake1, dir1) || !moveSnake(snake2, dir2)) {
            alert('Game Over!');
            snake1 = [{x: 10, y: 10}, {x: 9, y: 10}];
            snake2 = [{x: 90, y: 90}, {x: 91, y: 90}];
            dir1 = {x: 1, y: 0};
            dir2 = {x: -1, y: 0};
            foods = [];
            spawnFood();
        }
        draw();
        lastTime = timestamp;
    }
    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
