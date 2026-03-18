from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

ACTIONS = {'up': (-1, 0), 'down': (1, 0), 'left': (0, -1), 'right': (0, 1)}

def get_next_state(r, c, action_name, grid_size, obstacles):
    dr, dc = ACTIONS[action_name]
    next_r, next_c = r + dr, c + dc
    if next_r < 0 or next_r >= grid_size or next_c < 0 or next_c >= grid_size or [next_r, next_c] in obstacles:
        return r, c
    return next_r, next_c

def derive_policy(V, grid_size, end, obstacles, gamma=1.0):
    policy = [[[] for _ in range(grid_size)] for _ in range(grid_size)]
    for r in range(grid_size):
        for c in range(grid_size):
            if [r, c] == end or [r, c] in obstacles:
                continue
            
            max_val = -float('inf')
            best_actions = []
            
            for a in ACTIONS:
                nr, nc = get_next_state(r, c, a, grid_size, obstacles)
                val = -1 + gamma * V[nr][nc]
                
                # 只要嚴格大於目前最大值才更新，遇到平手就不理它！
                if val > max_val + 1e-6:
                    max_val = val
                    best_actions = [a]  # 永遠只保留一個方向
                    
            policy[r][c] = best_actions
    return policy

def trace_optimal_path(policy, start, end):
    path = []
    current = tuple(start)
    visited = set() 
    
    while current != tuple(end):
        if current in visited:
            break
        visited.add(current)
        path.append(list(current))
        
        r, c = current
        actions = policy[r][c]
        if not actions:
            break
            
        best_action = actions[0]
        dr, dc = ACTIONS[best_action]
        current = (r + dr, c + dc)
        
    path.append(list(end))
    return path

def policy_evaluation(grid_size, end, obstacles, theta=1e-4, gamma=1.0):
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
                    v_expected += 0.25 * (-1 + gamma * V[nr][nc])
                new_V[r][c] = v_expected
                delta = max(delta, abs(v_expected - V[r][c]))
        V = new_V
        if delta < theta: break
    policy = derive_policy(V, grid_size, end, obstacles, gamma)
    return V, policy

def value_iteration(grid_size, end, obstacles, theta=1e-4, gamma=1.0):
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
                    v = -1 + gamma * V[nr][nc]
                    if v > max_v: max_v = v
                new_V[r][c] = max_v
                delta = max(delta, abs(max_v - V[r][c]))
        V = new_V
        if delta < theta: break
    policy = derive_policy(V, grid_size, end, obstacles, gamma)
    return V, policy

@app.route('/api/calculate', methods=['POST'])
def calculate():
    data = request.json
    size = data['size']
    start = data['start']
    end = data['end']
    obstacles = data['obstacles']
    
    v_hw2, p_hw2 = policy_evaluation(size, end, obstacles)
    v_hw3, p_hw3 = value_iteration(size, end, obstacles)
    
    optimal_path_hw3 = trace_optimal_path(p_hw3, start, end)
    
    v_hw2_round = [[round(val, 2) for val in row] for row in v_hw2]
    v_hw3_round = [[round(val, 2) for val in row] for row in v_hw3]
    
    return jsonify({
        'hw2_value': v_hw2_round,
        'hw2_policy': p_hw2,
        'hw3_value': v_hw3_round,
        'hw3_policy': p_hw3,
        'hw3_path': optimal_path_hw3 
    })