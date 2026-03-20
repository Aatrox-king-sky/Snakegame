// script.js - 贪吃蛇贴图版 (蛇身/苹果采用精致手绘贴图风格)
(function () {
    // ---------- DOM 元素 ----------
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const scoreSpan = document.getElementById('score');
    const startBtn = document.getElementById('startBtn');
    const restartBtn = document.getElementById('restartBtn');

    // ---------- 游戏配置 ----------
    const gridSize = 20;          // 格子像素
    const gridCount = 20;         // 400/20 = 20x20 网格

    // 游戏状态变量
    let snake = [];               // 蛇身坐标 {x, y}
    let food = { x: 12, y: 12 };
    let direction = 'right';     // 当前移动方向
    let nextDirection = 'right';
    let score = 0;
    let gameInterval = null;
    let isPaused = false;
    let gameStarted = false;      // 游戏是否进行中（未结束且已开始）

    // ---------- 辅助函数: Canvas roundRect ----------
    if (!CanvasRenderingContext2D.prototype.roundRect) {
        CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
            if (w < 2 * r) r = w / 2;
            if (h < 2 * r) r = h / 2;
            this.moveTo(x + r, y);
            this.lineTo(x + w - r, y);
            this.quadraticCurveTo(x + w, y, x + w, y + r);
            this.lineTo(x + w, y + h - r);
            this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
            this.lineTo(x + r, y + h);
            this.quadraticCurveTo(x, y + h, x, y + h - r);
            this.lineTo(x, y + r);
            this.quadraticCurveTo(x, y, x + r, y);
            return this;
        };
    }

    // ---------- 🎨 贴图绘制模块 (纯canvas绘图模拟精致贴图) ----------
    // 绘制蛇身段 (鳞片质感 + 高光，头部加眼睛和舌头)
    function drawSnakeSegment(x, y, isHead, segmentIndex) {
        const px = x * gridSize;
        const py = y * gridSize;
        const size = gridSize - 1;

        ctx.save();
        ctx.shadowBlur = 0;
        ctx.shadowColor = "transparent";

        // 身体主色调 (根据是否为头部不同)
        if (isHead) {
            // 头部鲜亮黄绿色渐变
            const grad = ctx.createLinearGradient(px, py, px + size, py + size);
            grad.addColorStop(0, '#86cd5e');
            grad.addColorStop(1, '#4f9f2c');
            ctx.fillStyle = grad;
        } else {
            // 身体：翠绿到深绿渐变，仿鳞片
            const grad = ctx.createLinearGradient(px, py, px + size * 0.7, py + size * 0.8);
            grad.addColorStop(0, '#5cb83a');
            grad.addColorStop(1, '#2f7a1f');
            ctx.fillStyle = grad;
        }
        ctx.beginPath();
        ctx.roundRect(px, py, size, size, 7);
        ctx.fill();

        // 背部高光条 (贴图光泽)
        ctx.beginPath();
        ctx.roundRect(px + 2, py + 2, size - 4, 4, 2);
        ctx.fillStyle = isHead ? 'rgba(255, 255, 180, 0.75)' : 'rgba(210, 245, 130, 0.55)';
        ctx.fill();

        // 身体斑点 (增加贴图细节)
        if (!isHead) {
            ctx.fillStyle = '#b1df7a';
            ctx.beginPath();
            ctx.arc(px + size * 0.7, py + size * 0.45, 2.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#8fc750';
            ctx.beginPath();
            ctx.arc(px + size * 0.3, py + size * 0.7, 2, 0, Math.PI * 2);
            ctx.fill();
            // 小暗斑
            ctx.fillStyle = '#437a2a';
            ctx.beginPath();
            ctx.arc(px + size * 0.5, py + size * 0.85, 1.5, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // 🐍 头部添加眼睛和可爱红信子
            // 左眼
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(px + size * 0.28, py + size * 0.35, 3.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#0f2f0a';
            ctx.beginPath();
            ctx.arc(px + size * 0.25, py + size * 0.34, 1.8, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(px + size * 0.21, py + size * 0.3, 0.8, 0, Math.PI * 2);
            ctx.fill();

            // 右眼
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(px + size * 0.72, py + size * 0.35, 3.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#0f2f0a';
            ctx.beginPath();
            ctx.arc(px + size * 0.75, py + size * 0.34, 1.8, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(px + size * 0.79, py + size * 0.3, 0.8, 0, Math.PI * 2);
            ctx.fill();

            // 眉毛/可爱弧度
            ctx.beginPath();
            ctx.strokeStyle = '#4f341a';
            ctx.lineWidth = 1.5;
            ctx.arc(px + size * 0.28, py + size * 0.25, 3, 0.1, Math.PI - 0.2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(px + size * 0.72, py + size * 0.25, 3, 0.1, Math.PI - 0.2);
            ctx.stroke();

            // 红色小舌头 (信子)
            ctx.beginPath();
            ctx.moveTo(px + size * 0.5, py + size * 0.55);
            ctx.lineTo(px + size * 0.45, py + size * 0.68);
            ctx.lineTo(px + size * 0.55, py + size * 0.68);
            ctx.fillStyle = '#e34234';
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(px + size * 0.5, py + size * 0.58);
            ctx.lineTo(px + size * 0.42, py + size * 0.72);
            ctx.lineTo(px + size * 0.5, py + size * 0.68);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(px + size * 0.5, py + size * 0.58);
            ctx.lineTo(px + size * 0.58, py + size * 0.72);
            ctx.lineTo(px + size * 0.5, py + size * 0.68);
            ctx.fill();
        }

        // 腹部浅色 (底部)
        ctx.beginPath();
        ctx.roundRect(px + 3, py + size - 5, size - 6, 4, 2);
        ctx.fillStyle = isHead ? '#ebf5cf' : '#b8dc7a';
        ctx.fill();
        ctx.restore();
    }

    // 绘制苹果食物 (3D红苹果 + 绿叶 + 梗)
    function drawApple(x, y) {
        const px = x * gridSize;
        const py = y * gridSize;
        const size = gridSize - 1;
        const centerX = px + size / 2;
        const centerY = py + size / 2;
        const radius = size * 0.42;

        ctx.save();
        ctx.shadowBlur = 3;
        ctx.shadowColor = "rgba(0,0,0,0.3)";

        // 苹果主体红色渐变
        const grad = ctx.createRadialGradient(px + 6, py + 6, 2, centerX, centerY, radius);
        grad.addColorStop(0, '#f44336');
        grad.addColorStop(0.7, '#c62828');
        grad.addColorStop(1, '#8b2c1d');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radius, radius * 0.92, 0, 0, Math.PI * 2);
        ctx.fill();

        // 高光
        ctx.fillStyle = '#ffb7b0';
        ctx.beginPath();
        ctx.ellipse(centerX - 3, centerY - 3, 3, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.ellipse(centerX - 4.5, centerY - 4, 1.5, 1.2, 0, 0, Math.PI * 2);
        ctx.fill();

        // 苹果梗
        ctx.beginPath();
        ctx.moveTo(centerX + 1, centerY - radius + 2);
        ctx.lineTo(centerX - 2, centerY - radius - 2);
        ctx.lineTo(centerX + 4, centerY - radius - 1);
        ctx.fillStyle = '#7d4a2b';
        ctx.fill();

        // 绿叶
        ctx.fillStyle = '#5fad41';
        ctx.beginPath();
        ctx.ellipse(centerX + 3, centerY - radius - 1, 3, 2, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#39851f';
        ctx.beginPath();
        ctx.ellipse(centerX, centerY - radius - 2, 2.5, 1.8, 0.4, 0, Math.PI * 2);
        ctx.fill();

        // 添加种子小点
        ctx.fillStyle = '#5d3a1a';
        ctx.beginPath();
        ctx.ellipse(centerX - 2, centerY + 1, 1, 1.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(centerX + 2, centerY + 1, 1, 1.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // 绘制网格线 (自然草席风格)
    function drawGrid() {
        ctx.save();
        ctx.strokeStyle = '#536b37';
        ctx.lineWidth = 0.8;
        for (let i = 0; i <= gridCount; i++) {
            ctx.beginPath();
            ctx.moveTo(i * gridSize, 0);
            ctx.lineTo(i * gridSize, canvas.height);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i * gridSize);
            ctx.lineTo(canvas.width, i * gridSize);
            ctx.stroke();
        }
        ctx.restore();
    }

    // 绘制背景装饰 (草地纹理)
    function drawBackground() {
        ctx.fillStyle = '#2e3820';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < 80; i++) {
            ctx.fillStyle = '#405d29';
            ctx.beginPath();
            ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 1.2, 0, Math.PI * 2);
            ctx.fill();
        }
        drawGrid();
    }

    // 渲染完整画面
    function draw() {
        drawBackground();

        // 绘制食物 (美味苹果)
        drawApple(food.x, food.y);

        // 绘制蛇身 (从尾到头，头部最后画覆盖更生动)
        for (let i = snake.length - 1; i >= 0; i--) {
            const seg = snake[i];
            const isHead = (i === 0);
            drawSnakeSegment(seg.x, seg.y, isHead, i);
        }
    }

    // ---------- 游戏逻辑 ----------
    function generateFood() {
        let newFood;
        let maxAttempts = 3000;
        do {
            newFood = {
                x: Math.floor(Math.random() * gridCount),
                y: Math.floor(Math.random() * gridCount)
            };
            maxAttempts--;
            if (maxAttempts <= 0) {
                // 极端情况几乎被蛇占满，遍历查找空位
                for (let i = 0; i < gridCount; i++) {
                    for (let j = 0; j < gridCount; j++) {
                        if (!snake.some(s => s.x === i && s.y === j)) {
                            newFood = { x: i, y: j };
                            break;
                        }
                    }
                }
                break;
            }
        } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
        food = newFood;
    }

    function moveSnake() {
        direction = nextDirection;
        const head = { ...snake[0] };

        switch (direction) {
            case 'up': head.y--; break;
            case 'down': head.y++; break;
            case 'left': head.x--; break;
            case 'right': head.x++; break;
            default: break;
        }

        snake.unshift(head);

        // 吃到食物
        if (head.x === food.x && head.y === food.y) {
            score += 10;
            scoreSpan.textContent = score;
            generateFood();
        } else {
            snake.pop();
        }

        // 碰撞检测
        const hitWall = head.x < 0 || head.x >= gridCount || head.y < 0 || head.y >= gridCount;
        const hitSelf = snake.slice(1).some(segment => segment.x === head.x && segment.y === head.y);

        if (hitWall || hitSelf) {
            gameOver();
        }
    }

    function gameLoop() {
        if (!gameStarted || isPaused) return;
        moveSnake();
        draw();
    }

    function gameOver() {
        if (gameInterval) {
            clearInterval(gameInterval);
            gameInterval = null;
        }
        gameStarted = false;
        startBtn.disabled = false;
        restartBtn.disabled = true;
        alert(`🐍 游戏结束！🍎 最终得分：${score}`);
    }

    function startGame() {
        // 重置全部状态
        if (gameInterval) {
            clearInterval(gameInterval);
            gameInterval = null;
        }

        // 经典蛇身
        snake = [
            { x: 10, y: 10 },
            { x: 9, y: 10 },
            { x: 8, y: 10 },
            { x: 7, y: 10 }
        ];
        direction = 'right';
        nextDirection = 'right';
        score = 0;
        isPaused = false;
        scoreSpan.textContent = "0";
        gameStarted = true;

        // 生成不重合食物
        generateFood();
        // 额外确保食物不与蛇重合
        while (snake.some(seg => seg.x === food.x && seg.y === food.y)) {
            generateFood();
        }

        startBtn.disabled = true;
        restartBtn.disabled = false;

        draw(); // 立即绘制初始场景

        if (gameInterval === null) {
            gameInterval = setInterval(() => {
                gameLoop();
            }, 140);
        }
    }

    function restartGame() {
        if (gameInterval) {
            clearInterval(gameInterval);
            gameInterval = null;
        }
        startGame();
    }

    // ---------- 键盘控制 ----------
    function handleKeydown(e) {
        if (!gameStarted) return;

        const key = e.key;
        const arrowMap = {
            'ArrowUp': 'up',
            'ArrowDown': 'down',
            'ArrowLeft': 'left',
            'ArrowRight': 'right'
        };

        if (arrowMap[key]) {
            e.preventDefault();
            const newDir = arrowMap[key];
            // 禁止原地掉头
            if ((newDir === 'up' && direction !== 'down') ||
                (newDir === 'down' && direction !== 'up') ||
                (newDir === 'left' && direction !== 'right') ||
                (newDir === 'right' && direction !== 'left')) {
                nextDirection = newDir;
            }
        }

        // 空格暂停/继续
        if (key === ' ' || key === 'Space') {
            e.preventDefault();
            if (gameStarted) {
                isPaused = !isPaused;
                // 可选: 显示暂停提示
                if (isPaused) {
                    ctx.save();
                    ctx.font = "bold 22px 'Segoe UI'";
                    ctx.shadowBlur = 0;
                    ctx.fillStyle = "#fff7cf";
                    ctx.shadowColor = "black";
                    ctx.fillText("⏸ 暂停", canvas.width / 2 - 45, canvas.height / 2);
                    ctx.restore();
                } else {
                    draw(); // 刷新画面去掉文字
                }
            }
        }
    }

    // ---------- 初始化界面 (未开始时显示静止画布) ----------
    function drawIdleBackground() {
        drawBackground();
        // 画个可爱的装饰苹果 + 问号蛇
        ctx.fillStyle = "#9cc97e";
        ctx.font = "bold 18px 'Segoe UI'";
        ctx.fillText("🐍 点击「开始游戏」", canvas.width / 2 - 100, canvas.height / 2);
        ctx.font = "14px system-ui";
        ctx.fillStyle = "#ebc87e";
        ctx.fillText("贪吃蛇 · 鲜果派对", canvas.width / 2 - 85, canvas.height / 2 + 35);
        drawApple(5, 15);
        drawApple(14, 4);
    }

    // 重置UI显示等待状态
    function resetToIdle() {
        if (gameInterval) {
            clearInterval(gameInterval);
            gameInterval = null;
        }
        gameStarted = false;
        startBtn.disabled = false;
        restartBtn.disabled = true;
        drawIdleBackground();
    }

    // 监听键盘
    document.addEventListener('keydown', handleKeydown);

    // 按钮绑定
    startBtn.addEventListener('click', () => {
        if (gameStarted) return;
        startGame();
    });

    restartBtn.addEventListener('click', () => {
        if (gameStarted) {
            restartGame();
        } else {
            startGame();
        }
    });

    // 页面启动时绘制漂亮的贴图待机画面
    window.addEventListener('load', () => {
        resetToIdle();
    });
})();
