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
    const inst = document.getElementById('instruction');
    if (clickState === 0) { inst.innerText = "1. Click to set START (Green)."; inst.style.color = "green"; } 
    else if (clickState === 1) { inst.innerText = "2. Click to set END (Red)."; inst.style.color = "red"; } 
    else if (clickState === 2) { inst.innerText = `3. Click to set Obstacles (Grey). ${obstaclesLeft} left.`; inst.style.color = "grey"; } 
    else if (clickState === 3) { inst.innerText = "Setup complete! Ready to calculate."; inst.style.color = "blue"; }
}

async function submitToFlask() {
    try {
        const response = await fetch('http://127.0.0.1:5000/calculate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(mapData)
        });
        
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