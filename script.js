// 获取画布和DOM元素
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const startBtn = document.getElementById('startBtn'); // 新增开始按钮
const restartBtn = document.getElementById('restartBtn');

// 游戏配置
const gridSize = 20;
const gridCount = canvas.width / gridSize;
let snake = [];
let food = {};
let direction = 'right';
let nextDirection = 'right';
let score = 0;
let gameInterval;
let isPaused = false;
let gameStarted = false; // 新增：标记游戏是否已开始

// 初始化游戏（仅准备，不启动循环）
function initGame() {
    snake = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 },
    ];
    direction = 'right';
    nextDirection = 'right';
    score = 0;
    scoreElement.textContent = score;
    isPaused = false;
    gameStarted = true;

    // 启用重新开始按钮，禁用开始按钮
    startBtn.disabled = true;
    restartBtn.disabled = false;

    generateFood();
    clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, 150);
    draw(); // 先绘制初始画面
}

// 生成食物
function generateFood() {
    let newFood;
    while (!newFood || snake.some(segment => segment.x === newFood.x && segment.y === newFood.y)) {
        newFood = {
            x: Math.floor(Math.random() * gridCount),
            y: Math.floor(Math.random() * gridCount)
        };
    }
    food = newFood;
}

// 绘制游戏画面
function draw() {
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    snake.forEach((segment, index) => {
        ctx.fillStyle = index === 0 ? '#ff0000' : '#4CAF50';
        ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 1, gridSize - 1);
    });

    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 1, gridSize - 1);
}

// 移动蛇
function moveSnake() {
    direction = nextDirection;
    const head = { ...snake[0] };

    switch (direction) {
        case 'up':
            head.y--;
            break;
        case 'down':
            head.y++;
            break;
        case 'left':
            head.x--;
            break;
        case 'right':
            head.x++;
            break;
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreElement.textContent = score;
        generateFood();
    } else {
        snake.pop();
    }

    if (
        head.x < 0 || head.x >= gridCount ||
        head.y < 0 || head.y >= gridCount ||
        snake.slice(1).some(segment => segment.x === head.x && segment.y === head.y)
    ) {
        gameOver();
    }
}

// 游戏循环
function gameLoop() {
    if (!isPaused && gameStarted) { // 只有游戏开始后才运行
        moveSnake();
        draw();
    }
}

// 游戏结束
function gameOver() {
    clearInterval(gameInterval);
    alert(`游戏结束！最终得分：${score}`);
    // 结束后重置按钮状态
    startBtn.disabled = false;
    restartBtn.disabled = true;
    gameStarted = false;
}

// 监听键盘事件（仅游戏开始后生效）
document.addEventListener('keydown', (e) => {
    if (!gameStarted) return; // 游戏未开始时不响应方向键

    switch (e.key) {
        case 'ArrowUp':
            if (direction !== 'down') nextDirection = 'up';
            break;
        case 'ArrowDown':
            if (direction !== 'up') nextDirection = 'down';
            break;
        case 'ArrowLeft':
            if (direction !== 'right') nextDirection = 'left';
            break;
        case 'ArrowRight':
            if (direction !== 'left') nextDirection = 'right';
            break;
        case ' ':
            isPaused = !isPaused;
            break;
    }
});

// 绑定按钮事件
startBtn.addEventListener('click', initGame); // 点击开始按钮初始化游戏
restartBtn.addEventListener('click', initGame); // 重新开始也是调用初始化

// 页面加载后仅绘制空白画布，不启动游戏
window.addEventListener('load', () => {
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
});