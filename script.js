/* =========================================
   全局狀態管理 (Global State)
========================================= */
let n = 0;                  // 網格維度 (n x n)
let clickState = 0;         // 狀態機：0(等起點), 1(等終點), 2(等障礙物), 3(設定完成)
let obstaclesLeft = 0;      // 剩餘可設定的障礙物數量

// 儲存目前地圖配置，準備傳遞給後端 Flask API
let mapData = { 
    size: 0, 
    start: null, 
    end: null, 
    obstacles: [] 
};

// 網頁載入完成後，自動生成預設網格
window.onload = function() { 
    generateGrid(); 
};

/* =========================================
   網格生成與初始化 (Grid Initialization)
========================================= */
function generateGrid() {
    const inputVal = document.getElementById('gridSize').value;
    n = parseInt(inputVal);
    
    // 驗證輸入範圍
    if (n < 5 || n > 9) return alert("Please enter a number between 5 and 9.");

    // 重置所有狀態與地圖資料
    clickState = 0;
    obstaclesLeft = n - 2;
    mapData = { size: n, start: null, end: null, obstacles: [] };
    
    // 更新 UI 顯示狀態
    document.getElementById('gridTitle').style.display = 'block';
    document.getElementById('gridTitle').innerText = `${n} x ${n} Square:`;
    document.getElementById('calculateBtn').style.display = 'none';
    document.getElementById('resetBtn').style.display = 'block';
    document.getElementById('results').style.display = 'none';
    updateInstruction();

    // 清空並重新生成網格 DOM 元素
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
            // 綁定點擊事件，傳入網格座標 (i, j)
            cellDiv.onclick = (e) => handleCellClick(e.target, i, j);
            rowDiv.appendChild(cellDiv);
        }
        container.appendChild(rowDiv);
    }
}

// 快速重置網格
function resetGrid() {
    generateGrid(); 
}

/* =========================================
   使用者點擊互動邏輯 (User Interaction)
========================================= */
function handleCellClick(cellElement, i, j) {
    // 避免重複點擊已經設定過的格子
    if (cellElement.classList.contains('cell-start') || 
        cellElement.classList.contains('cell-end') || 
        cellElement.classList.contains('cell-obstacle')) return;

    // 依據狀態機進行不同動作
    if (clickState === 0) {
        // 設定起點
        cellElement.classList.add('cell-start');
        mapData.start = [i, j];
        clickState = 1;
    } else if (clickState === 1) {
        // 設定終點
        cellElement.classList.add('cell-end');
        mapData.end = [i, j];
        clickState = 2;
    } else if (clickState === 2) {
        // 設定障礙物
        cellElement.classList.add('cell-obstacle');
        mapData.obstacles.push([i, j]);
        obstaclesLeft--;
        
        // 障礙物扣完即完成設定
        if (obstaclesLeft === 0) {
            clickState = 3;
            document.getElementById('calculateBtn').style.display = 'block';
        }
    }
    updateInstruction();
}

// 動態更新上方步驟提示的樣式
function updateInstruction() {
    // 清除所有高亮狀態
    document.getElementById('step1').classList.remove('active-step');
    document.getElementById('step2').classList.remove('active-step');
    document.getElementById('step3').classList.remove('active-step');
    document.getElementById('step4').style.display = 'none';

    // 點亮當前應進行的步驟
    if (clickState === 0) {
        document.getElementById('step1').classList.add('active-step');
        document.getElementById('step3').innerText = "Step 3: Click to set Obstacles (Grey)";
    } else if (clickState === 1) {
        document.getElementById('step2').classList.add('active-step');
    } else if (clickState === 2) {
        document.getElementById('step3').classList.add('active-step');
        document.getElementById('step3').innerText = `Step 3: Click to set Obstacles (Grey). ${obstaclesLeft} left.`;
    } else if (clickState === 3) {
        document.getElementById('step4').style.display = 'block';
    }
}

/* =========================================
   API 請求與資料處理 (API Request)
========================================= */
async function submitToFlask() {
    // 【防呆機制】檢查是否有路可走
    if (!hasValidPath()) {
        alert("⚠️ 錯誤：起點和終點之間被障礙物完全阻擋，找不到可通行的路徑！請點擊 Reset Grid 重新設定。");
        return; 
    }

    try {
        // 將地圖配置發送給 Flask / Vercel 後端
        const response = await fetch('/api/calculate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(mapData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // 顯示結果區塊
        document.getElementById('results').style.display = 'block';
        
        // 渲染四個不同的結果矩陣
        renderResultGrid('hw2ValueGrid', data.hw2_value, 'value');
        renderResultGrid('hw2PolicyGrid', data.hw2_policy, 'policy');
        renderResultGrid('hw3ValueGrid', data.hw3_value, 'value');
        // HW3 Policy 額外傳入最佳路徑 (optimal_path) 以進行高亮渲染
        renderResultGrid('hw3PolicyGrid', data.hw3_policy, 'policy', data.hw3_path);
        
    } catch (error) {
        console.error("Error:", error);
        alert("無法連接到後端伺服器，請確保 API 正在運行中 !");
    }
}

/* =========================================
   結果渲染函數 (Result Rendering)
========================================= */
function renderResultGrid(containerId, matrixData, type, optimalPath = null) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    // 定義粗體箭頭符號
    const arrows = { 'up': '🡑', 'down': '🡓', 'left': '🡐', 'right': '🡒' }; 

    for (let i = 0; i < n; i++) {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'grid-row';
        for (let j = 0; j < n; j++) {
            const cellDiv = document.createElement('div');
            cellDiv.className = 'grid-cell';
            
            // 判斷當前格子的屬性
            const isStart = (mapData.start[0] === i && mapData.start[1] === j);
            const isEnd = (mapData.end[0] === i && mapData.end[1] === j);
            const isObstacle = mapData.obstacles.some(obs => obs[0] === i && obs[1] === j);
            const isPath = optimalPath && optimalPath.some(p => p[0] === i && p[1] === j);
            
            if (isObstacle) {
                cellDiv.classList.add('cell-obstacle');
            } else {
                // 若屬於最佳路徑，加上綠色高亮背景
                if (isPath) {
                    cellDiv.classList.add('cell-path');
                }

                if (type === 'value') {
                    // 渲染 Value Matrix (數字)
                    if (isEnd) cellDiv.innerText = 'END';
                    else cellDiv.innerText = matrixData[i][j];
                } else if (type === 'policy') {
                    // 渲染 Policy Matrix (箭頭)
                    let content = '';
                    
                    if (isStart) content += '<div class="small-text">START</div>';
                    
                    if (!isEnd) {
                        const actionList = matrixData[i][j];
                        // 確保該格子有可行動方向
                        if (actionList.length > 0) {
                            const arrowStr = actionList.map(a => arrows[a]).join('');
                            // 判斷是否為最佳路徑上的箭頭，決定顏色深淺
                            const arrowClass = isPath ? 'arrow-path' : 'arrow-normal';
                            content += `<div class="arrow ${arrowClass}">${arrowStr}</div>`;
                        }
                    } else {
                        content += '<div class="small-text">END</div>';
                    }
                    
                    cellDiv.innerHTML = content;
                }
            }
            rowDiv.appendChild(cellDiv);
        }
        container.appendChild(rowDiv);
    }
}

/* =========================================
   防呆尋路演算法 (BFS Pathfinding Validation)
   - 用於檢查起點與終點之間是否被障礙物阻擋
========================================= */
function hasValidPath() {
    const size = mapData.size;
    const start = mapData.start;
    const end = mapData.end;
    const obstacles = mapData.obstacles;

    // 輔助函數：判斷是否為障礙物
    const isObstacle = (r, c) => obstacles.some(obs => obs[0] === r && obs[1] === c);
    
    // 建立紀錄訪問狀態的 2D 陣列
    let visited = Array.from({ length: size }, () => Array(size).fill(false));
    
    // 初始化 BFS 佇列
    let queue = [start];
    visited[start[0]][start[1]] = true;

    // 定義上下左右位移
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    while (queue.length > 0) {
        let current = queue.shift();
        let r = current[0];
        let c = current[1];

        // 成功尋得終點
        if (r === end[0] && c === end[1]) {
            return true;
        }

        // 探索鄰近節點
        for (let dir of dirs) {
            let nextR = r + dir[0];
            let nextC = c + dir[1];

            // 確保不越界
            if (nextR >= 0 && nextR < size && nextC >= 0 && nextC < size) {
                // 若為可行走路徑且未訪問過，加入佇列
                if (!isObstacle(nextR, nextC) && !visited[nextR][nextC]) {
                    visited[nextR][nextC] = true;
                    queue.push([nextR, nextC]);
                }
            }
        }
    }
    
    // 窮舉所有可達節點後仍未見終點，判定為無效路徑
    return false;
}