let n = 0;
let clickState = 0;
let obstaclesLeft = 0;
let mapData = { size: 0, start: null, end: null, obstacles: [] };

window.onload = function() { generateGrid(); };

function generateGrid() {
    const inputVal = document.getElementById('gridSize').value;
    n = parseInt(inputVal);
    if (n < 5 || n > 9) return alert("Please enter a number between 5 and 9.");

    clickState = 0;
    obstaclesLeft = n - 2;
    mapData = { size: n, start: null, end: null, obstacles: [] };
    
    document.getElementById('gridTitle').style.display = 'block';
    document.getElementById('gridTitle').innerText = `${n} x ${n} Square:`;
    document.getElementById('calculateBtn').style.display = 'none';
    document.getElementById('resetBtn').style.display = 'block';
    document.getElementById('results').style.display = 'none';
    updateInstruction();

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
    if (cellElement.classList.contains('cell-start') || cellElement.classList.contains('cell-end') || cellElement.classList.contains('cell-obstacle')) return;

    if (clickState === 0) {
        cellElement.classList.add('cell-start');
        mapData.start = [i, j];
        clickState = 1;
    } else if (clickState === 1) {
        cellElement.classList.add('cell-end');
        mapData.end = [i, j];
        clickState = 2;
    } else if (clickState === 2) {
        cellElement.classList.add('cell-obstacle');
        mapData.obstacles.push([i, j]);
        obstaclesLeft--;
        if (obstaclesLeft === 0) {
            clickState = 3;
            document.getElementById('calculateBtn').style.display = 'block';
        }
    }
    updateInstruction();
}

function updateInstruction() {
    // 1. 先把所有步驟的「高亮狀態」移除
    document.getElementById('step1').classList.remove('active-step');
    document.getElementById('step2').classList.remove('active-step');
    document.getElementById('step3').classList.remove('active-step');
    document.getElementById('step4').style.display = 'none';

    // 2. 根據目前的點擊狀態，點亮對應的步驟
    if (clickState === 0) {
        document.getElementById('step1').classList.add('active-step');
        document.getElementById('step3').innerText = "Step 3: Click to set Obstacles (Grey)";
    } else if (clickState === 1) {
        document.getElementById('step2').classList.add('active-step');
    } else if (clickState === 2) {
        document.getElementById('step3').classList.add('active-step');
        document.getElementById('step3').innerText = `Step 3: Click to set Obstacles (Grey). ${obstaclesLeft} left.`;
    } else if (clickState === 3) {
        // 設定完成，顯示完成文字
        document.getElementById('step4').style.display = 'block';
    }
}

// 新增的 Reset 函數
function resetGrid() {
    // 其實我們原本寫好的 generateGrid() 裡面就包含了重置所有變數和清空網格的邏輯
    // 所以直接呼叫它，就能完美達到 Reset 的效果！
    generateGrid(); 
}

async function submitToFlask() {
    if (!hasValidPath()) {
        alert("⚠️ 錯誤：起點和終點之間被障礙物完全阻擋，找不到可通行的路徑！請點擊 Reset Grid 重新設定。");
        return; // 直接中斷執行，不會把資料傳給 Flask 浪費運算資源
    }

    try {
        const response = await fetch('/api/calculate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(mapData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        document.getElementById('results').style.display = 'block';
        
        // 畫出結果，HW3 額外傳入 optimal_path
        renderResultGrid('hw2ValueGrid', data.hw2_value, 'value');
        renderResultGrid('hw2PolicyGrid', data.hw2_policy, 'policy');
        renderResultGrid('hw3ValueGrid', data.hw3_value, 'value');
        renderResultGrid('hw3PolicyGrid', data.hw3_policy, 'policy', data.hw3_path);
        
    } catch (error) {
        console.error("Error:", error);
        alert("無法連接到 Flask，請確保 app.py 正在執行中 !");
    }
}

// 加入 optimalPath 參數，用來高亮最佳路徑
function renderResultGrid(containerId, matrixData, type, optimalPath = null) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    // 使用比較粗的箭頭符號
    const arrows = { 'up': '🡑', 'down': '🡓', 'left': '🡐', 'right': '🡒' }; 

    for (let i = 0; i < n; i++) {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'grid-row';
        for (let j = 0; j < n; j++) {
            const cellDiv = document.createElement('div');
            cellDiv.className = 'grid-cell';
            
            const isStart = (mapData.start[0] === i && mapData.start[1] === j);
            const isEnd = (mapData.end[0] === i && mapData.end[1] === j);
            const isObstacle = mapData.obstacles.some(obs => obs[0] === i && obs[1] === j);
            const isPath = optimalPath && optimalPath.some(p => p[0] === i && p[1] === j);
            
            if (isObstacle) {
                cellDiv.classList.add('cell-obstacle');
            } else {
                // 如果是在最佳路徑上，加上高亮 class
                if (isPath) {
                    cellDiv.classList.add('cell-path');
                }

                if (type === 'value') {
                    if (isEnd) cellDiv.innerText = 'END';
                    else cellDiv.innerText = matrixData[i][j];
                } else if (type === 'policy') {
                    let content = '';
                    
                    // 根據圖片，START 跟 END 要有小字
                    if (isStart) content += '<div class="small-text">START</div>';
                    
                    if (!isEnd) {
                        const actionList = matrixData[i][j];
                        // 沒有 action 時 (例如被障礙物包圍)，不顯示箭頭
                        if (actionList.length > 0) {
                            const arrowStr = actionList.map(a => arrows[a]).join('');
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

// --- 新增：使用 BFS (廣度優先搜尋) 檢查是否有路徑 ---
function hasValidPath() {
    const size = mapData.size;
    const start = mapData.start;
    const end = mapData.end;
    const obstacles = mapData.obstacles;

    // 判斷是否為障礙物的輔助函數
    const isObstacle = (r, c) => obstacles.some(obs => obs[0] === r && obs[1] === c);
    
    // 建立一個紀錄是否走過的矩陣
    let visited = Array.from({ length: size }, () => Array(size).fill(false));
    
    // 將起點放入佇列
    let queue = [start];
    visited[start[0]][start[1]] = true;

    // 上下左右四個方向
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    while (queue.length > 0) {
        let current = queue.shift();
        let r = current[0];
        let c = current[1];

        // 如果走到終點，代表有路徑！
        if (r === end[0] && c === end[1]) {
            return true;
        }

        // 探索四個方向
        for (let dir of dirs) {
            let nextR = r + dir[0];
            let nextC = c + dir[1];

            // 檢查是否超出邊界
            if (nextR >= 0 && nextR < size && nextC >= 0 && nextC < size) {
                // 如果不是障礙物，且還沒走過
                if (!isObstacle(nextR, nextC) && !visited[nextR][nextC]) {
                    visited[nextR][nextC] = true;
                    queue.push([nextR, nextC]);
                }
            }
        }
    }
    
    // 佇列都清空了還是沒找到終點，代表被死路包圍
    return false;
}