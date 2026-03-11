// 狀態管理變數
let n = 0;
let clickState = 0; // 0: 等待設定起點, 1: 等待設定終點, 2: 等待設定障礙物, 3: 設定完成
let obstaclesLeft = 0;

// 儲存地圖資訊
let mapData = {
    size: 0,
    start: null,
    end: null,
    obstacles: []
};

// 網頁載入完成後自動生成 5x5 網格
window.onload = function() {
    generateGrid();
};

function generateGrid() {
    const inputVal = document.getElementById('gridSize').value;
    n = parseInt(inputVal);

    if (n < 5 || n > 9) {
        alert("Please enter a number between 5 and 9.");
        return;
    }

    // 重置狀態與資料
    clickState = 0;
    obstaclesLeft = n - 2;
    mapData = { size: n, start: null, end: null, obstacles: [] };
    
    // 更新 UI
    document.getElementById('gridTitle').style.display = 'block';
    document.getElementById('gridTitle').innerText = `${n} x ${n} Square:`;
    document.getElementById('calculateBtn').style.display = 'none';
    document.getElementById('results').style.display = 'none'; // 隱藏之前的結果
    updateInstruction();

    // 生成網格 DOM
    const container = document.getElementById('gridContainer');
    container.innerHTML = ''; 

    let cellNumber = 1;
    for (let i = 0; i < n; i++) {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'grid-row';
        for (let j = 0; j < n; j++) {
            const cellDiv = document.createElement('div');
            cellDiv.className = 'grid-cell';
            cellDiv.innerText = cellNumber++;
            cellDiv.onclick = (e) => handleCellClick(e.target, i, j);
            rowDiv.appendChild(cellDiv);
        }
        container.appendChild(rowDiv);
    }
}

function handleCellClick(cellElement, i, j) {
    if (cellElement.classList.contains('cell-start') || 
        cellElement.classList.contains('cell-end') || 
        cellElement.classList.contains('cell-obstacle')) {
        return;
    }

    if (clickState === 0) {
        cellElement.classList.add('cell-start');
        mapData.start = [i, j];
        clickState = 1;
        updateInstruction();
    } 
    else if (clickState === 1) {
        cellElement.classList.add('cell-end');
        mapData.end = [i, j];
        clickState = 2;
        updateInstruction();
    } 
    else if (clickState === 2) {
        cellElement.classList.add('cell-obstacle');
        mapData.obstacles.push([i, j]);
        obstaclesLeft--;
        updateInstruction();

        if (obstaclesLeft === 0) {
            clickState = 3;
            document.getElementById('calculateBtn').style.display = 'block';
        }
    }
}

function updateInstruction() {
    const inst = document.getElementById('instruction');
    if (clickState === 0) {
        inst.innerText = "1. Click on a cell to set up the start grid as green.";
        inst.style.color = "green";
    } else if (clickState === 1) {
        inst.innerText = "2. Click on a cell to set up the end grid as red.";
        inst.style.color = "red";
    } else if (clickState === 2) {
        inst.innerText = `3. Click on cells to set up obstacles (Grey). ${obstaclesLeft} left.`;
        inst.style.color = "grey";
    } else if (clickState === 3) {
        inst.innerText = "Setup complete! Ready to calculate.";
        inst.style.color = "blue";
    }
}

// === HW1-2: 策略評估演算法 (JavaScript 實作) ===

function calculatePolicy() {
    const gridSize = mapData.size;
    const end = mapData.end;
    const obstacles = mapData.obstacles;
    
    const theta = 1e-4;
    const gamma = 1.0;
    
    // 初始化 V 為 0
    let V = Array.from({ length: gridSize }, () => Array(gridSize).fill(0.0));
    const actions = {
        'up': [-1, 0], 'down': [1, 0], 'left': [0, -1], 'right': [0, 1]
    };

    // 輔助函數：判斷是否為障礙物或終點
    const isObstacle = (r, c) => obstacles.some(obs => obs[0] === r && obs[1] === c);
    const isEnd = (r, c) => end[0] === r && end[1] === c;

    // 1. 執行 Policy Evaluation (隨機策略 0.25)
    while (true) {
        let delta = 0;
        let newV = Array.from({ length: gridSize }, () => Array(gridSize).fill(0.0));
        
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                if (isEnd(r, c) || isObstacle(r, c)) continue;
                
                let vExpected = 0;
                for (let action in actions) {
                    let nextR = r + actions[action][0];
                    let nextC = c + actions[action][1];
                    
                    // 撞牆或障礙物則留在原地
                    if (nextR < 0 || nextR >= gridSize || nextC < 0 || nextC >= gridSize || isObstacle(nextR, nextC)) {
                        nextR = r;
                        nextC = c;
                    }
                    
                    let reward = -1; // 每走一步的 reward
                    vExpected += 0.25 * (reward + gamma * V[nextR][nextC]);
                }
                newV[r][c] = vExpected;
                delta = Math.max(delta, Math.abs(vExpected - V[r][c]));
            }
        }
        V = newV;
        if (delta < theta) break; // 收斂
    }

    // 2. 找出 Greedy Policy (推導箭頭方向)
    let policy = Array.from({ length: gridSize }, () => Array(gridSize).fill([]));
    
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            if (isEnd(r, c) || isObstacle(r, c)) continue;
            
            let maxVal = -Infinity;
            let bestActions = [];
            
            for (let action in actions) {
                let nextR = r + actions[action][0];
                let nextC = c + actions[action][1];
                
                if (nextR < 0 || nextR >= gridSize || nextC < 0 || nextC >= gridSize || isObstacle(nextR, nextC)) {
                    nextR = r;
                    nextC = c;
                }
                
                let val = -1 + gamma * V[nextR][nextC];
                
                // 處理浮點數誤差
                if (val > maxVal + 1e-6) {
                    maxVal = val;
                    bestActions = [action];
                } else if (Math.abs(val - maxVal) <= 1e-6) {
                    bestActions.push(action); // 多個方向同等好
                }
            }
            policy[r][c] = bestActions;
        }
    }

    // 將 V 的數值四捨五入到小數點後兩位
    let roundedV = V.map(row => row.map(val => Number(val.toFixed(2))));

    // 顯示結果
    document.getElementById('results').style.display = 'flex';
    renderResultGrid('valueGrid', roundedV, 'value');
    renderResultGrid('policyGrid', policy, 'policy');
}

// 繪製結果圖表的函數
function renderResultGrid(containerId, matrixData, type) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    const arrows = { 'up': '↑', 'down': '↓', 'left': '←', 'right': '→' };

    for (let i = 0; i < n; i++) {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'grid-row';
        for (let j = 0; j < n; j++) {
            const cellDiv = document.createElement('div');
            cellDiv.className = 'grid-cell';
            
            const isEnd = (mapData.end[0] === i && mapData.end[1] === j);
            const isObstacle = mapData.obstacles.some(obs => obs[0] === i && obs[1] === j);
            
            if (isEnd) {
                cellDiv.classList.add('cell-end');
                // 可自行決定終點要顯示 END 還是空白
            } else if (isObstacle) {
                cellDiv.classList.add('cell-obstacle');
            } else {
                if (type === 'value') {
                    cellDiv.innerText = matrixData[i][j];
                } else if (type === 'policy') {
                    // 將 action 陣列轉換成多個箭頭
                    const actionList = matrixData[i][j];
                    const arrowStr = actionList.map(a => arrows[a]).join('');
                    cellDiv.innerHTML = `<span class="arrow">${arrowStr}</span>`;
                }
            }
            rowDiv.appendChild(cellDiv);
        }
        container.appendChild(rowDiv);
    }
}