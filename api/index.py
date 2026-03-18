from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app) # 允許前端跨域請求 (CORS)

# 定義 Agent 可執行的四個行動與對應的座標位移 (row, col)
ACTIONS = {
    'up': (-1, 0), 
    'down': (1, 0), 
    'left': (0, -1), 
    'right': (0, 1)
}

# =========================================
# MDP 環境動態與輔助函數 (Environment Dynamics)
# =========================================

def get_next_state(r, c, action_name, grid_size, obstacles):
    """
    計算給定狀態與行動下的下一個狀態。
    如果撞牆或撞到障礙物，則保持在原地。
    """
    dr, dc = ACTIONS[action_name]
    next_r, next_c = r + dr, c + dc
    
    # 邊界與障礙物判定
    if (next_r < 0 or next_r >= grid_size or 
        next_c < 0 or next_c >= grid_size or 
        [next_r, next_c] in obstacles):
        return r, c # 留在原地
        
    return next_r, next_c

def derive_policy(V, grid_size, end, obstacles, gamma=1.0):
    """
    根據收斂的價值函數 V(s)，推導出最佳政策 (Greedy Policy)。
    """
    policy = [[[] for _ in range(grid_size)] for _ in range(grid_size)]
    for r in range(grid_size):
        for c in range(grid_size):
            # 終點與障礙物不需要策略
            if [r, c] == end or [r, c] in obstacles:
                continue
            
            max_val = -float('inf')
            best_actions = []
            
            # 評估四個方向，找出期望價值最高的一步
            for a in ACTIONS:
                nr, nc = get_next_state(r, c, a, grid_size, obstacles)
                val = -1 + gamma * V[nr][nc] # Reward 固定為 -1
                
                # 嚴格大於目前最大值才更新，避免產生多重箭頭 (打破平手)
                if val > max_val + 1e-6:
                    max_val = val
                    best_actions = [a] 
                    
            policy[r][c] = best_actions
            
    return policy

def trace_optimal_path(policy, start, end):
    """
    從起點開始，順著最佳政策(箭頭)走到終點，記錄下完整的最佳路徑。
    """
    path = []
    current = tuple(start)
    visited = set() # 用於防止死胡同造成的無限迴圈
    
    while current != tuple(end):
        if current in visited:
            break
        visited.add(current)
        path.append(list(current))
        
        r, c = current
        actions = policy[r][c]
        if not actions:
            break # 沒路可走
            
        # 順著最佳策略走
        best_action = actions[0]
        dr, dc = ACTIONS[best_action]
        current = (r + dr, c + dc)
        
    path.append(list(end))
    return path

# =========================================
# 強化學習核心演算法 (RL Algorithms)
# =========================================

def policy_evaluation(grid_size, end, obstacles, theta=1e-4, gamma=1.0):
    """
    HW1-2: 策略評估 (Policy Evaluation)
    評估「隨機策略」(每個方向機率各 25%) 下的狀態價值。
    使用 Bellman Expectation Equation 進行迭代。
    """
    V = [[0.0 for _ in range(grid_size)] for _ in range(grid_size)]
    
    while True:
        delta = 0
        new_V = [[0.0 for _ in range(grid_size)] for _ in range(grid_size)]
        
        for r in range(grid_size):
            for c in range(grid_size):
                if [r, c] == end or [r, c] in obstacles:
                    continue
                
                v_expected = 0
                for a in ACTIONS:
                    nr, nc = get_next_state(r, c, a, grid_size, obstacles)
                    # 隨機策略: pi(a|s) = 0.25
                    v_expected += 0.25 * (-1 + gamma * V[nr][nc])
                    
                new_V[r][c] = v_expected
                delta = max(delta, abs(v_expected - V[r][c]))
                
        V = new_V
        if delta < theta: # 收斂條件
            break
            
    policy = derive_policy(V, grid_size, end, obstacles, gamma)
    return V, policy

def value_iteration(grid_size, end, obstacles, theta=1e-4, gamma=1.0):
    """
    HW1-3: 價值迭代 (Value Iteration)
    直接推導最佳政策下的狀態價值。
    使用 Bellman Optimality Equation (取 max) 進行迭代。
    """
    V = [[0.0 for _ in range(grid_size)] for _ in range(grid_size)]
    
    while True:
        delta = 0
        new_V = [[0.0 for _ in range(grid_size)] for _ in range(grid_size)]
        
        for r in range(grid_size):
            for c in range(grid_size):
                if [r, c] == end or [r, c] in obstacles:
                    continue
                
                max_v = -float('inf')
                for a in ACTIONS:
                    nr, nc = get_next_state(r, c, a, grid_size, obstacles)
                    # 取四個動作中的最大價值 (Greedy)
                    v = -1 + gamma * V[nr][nc]
                    if v > max_v: 
                        max_v = v
                        
                new_V[r][c] = max_v
                delta = max(delta, abs(max_v - V[r][c]))
                
        V = new_V
        if delta < theta: # 收斂條件
            break
            
    policy = derive_policy(V, grid_size, end, obstacles, gamma)
    return V, policy

# =========================================
# Flask API 路由 (API Routes)
# =========================================

@app.route('/api/calculate', methods=['POST'])
def calculate():
    """接收前端的地圖資料，執行 RL 演算法並回傳結果"""
    data = request.json
    size = data['size']
    start = data['start']
    end = data['end']
    obstacles = data['obstacles']
    
    # 執行 HW1-2: 策略評估 (Random Policy)
    v_hw2, p_hw2 = policy_evaluation(size, end, obstacles)
    
    # 執行 HW1-3: 價值迭代 (Optimal Policy)
    v_hw3, p_hw3 = value_iteration(size, end, obstacles)
    
    # 追蹤 HW1-3 的最佳路徑
    optimal_path_hw3 = trace_optimal_path(p_hw3, start, end)
    
    # 將價值矩陣四捨五入到小數點後兩位，方便前端顯示
    v_hw2_round = [[round(val, 2) for val in row] for row in v_hw2]
    v_hw3_round = [[round(val, 2) for val in row] for row in v_hw3]
    
    # 回傳 JSON 格式結果
    return jsonify({
        'hw2_value': v_hw2_round,
        'hw2_policy': p_hw2,
        'hw3_value': v_hw3_round,
        'hw3_policy': p_hw3,
        'hw3_path': optimal_path_hw3 
    })

# 若需在本地端測試，可將下方兩行取消註解
# if __name__ == '__main__':
#     app.run(debug=True, port=5000)