# Project Guidelines & Modification Log

## Architecture Overview
- **Frontend**: Vanilla JavaScript, HTML5, CSS3.
- **Backend**: Python Flask (deployed via Vercel Serverless Functions).
- **Domain**: Reinforcement Learning - Grid World.

## Grading Criteria Alignment
- **HW1-1**: Interactive grid setup (Start, End, Obstacles).
- **HW1-2**: Policy Evaluation using Bellman Expectation Equation. Displays sampled random actions (single arrows) to represent the random policy.
- **HW1-3**: Value Iteration using Bellman Optimality Equation. Displays single optimal actions and highlights the best path.

## Modification Log

### 2026-05-12 | UI Refactoring: Tabbed Visualization
- **Problem**: The assignment `hw_description.md` explicitly requires that the optimal policy actions should *replace* the previously displayed random actions, and users should be able to clearly visualize the *changes*. Displaying them statically side-by-side made the replacement less intuitive and consumed too much screen space.
- **Changes**:
  - **Frontend (`index.html`, `style.css`, `script.js`)**: 
    - Refactored the `results` section into an interactive **Tabbed UI**.
    - Users can now toggle between "HW1-2: Random Policy" and "HW1-3: Optimal Policy" within the same visual container.
    - Added CSS fade-in animations to make the transition and replacement of actions visually clear.
- **Result**: Perfectly aligns with the requirement "這些行動應該取代之前顯示的隨機行動" by replacing the content logically in the same view. Greatly improves user interface friendliness and visualizes changes effectively.

### 2026-05-12 | Fix: Missing Import & UI Restoration
- **Problem**: 
    - `api/index.py` was missing `import random`, causing a `NameError` during policy evaluation.
    - `index.html` was missing the visual **Legend** and **Algorithm Descriptions** for HW1-2, which were previously documented but absent in the code.
- **Changes**:
    - **Backend (`api/index.py`)**: Added `import random`.
    - **Frontend (`index.html`)**: 
        - Restored the `.legend` section within the grid setup.
        - Added a description for HW1-2 Policy Evaluation (Bellman Expectation Equation).
- **Result**: Backend stability is restored, and the UI now correctly matches the project specifications and documentation.

### 2026-05-12 | Fix: HW1-2 Random Policy Sampling Display
- **Problem**: HW1-2 should display a *sampled* random action (pick one from 4 directions) for each cell, rather than showing all four directions at once.
- **Changes**:
  - **Backend (`api/index.py`)**: Integrated `random.choice` to select exactly one action for each state in the policy evaluation response.
  - **Frontend (`script.js` & `style.css`)**: Reverted to single-arrow rendering logic and increased arrow size for better visibility.
- **Result**: HW1-2 now shows a grid of randomly pointing arrows, fulfilling the "隨機生成行動顯示" requirement.

### 2026-05-12 | Fix: style.css Corruption Cleanup
- **Problem**: Overlapping edits caused duplication and corrupted characters in `style.css`.
- **Changes**:
  - Overwrote `style.css` with a clean, unified version.
  - Ensured all UI enhancements (Legend, 2x2 arrows, path highlighting) are correctly implemented without redundancy.
- **Result**: Styles are now consistent and error-free.

### 2026-05-12 | Fix: HW1-2 Random Policy Representation
- **Problem**: HW1-2 was incorrectly showing a single greedy arrow derived from the value function, which didn't represent the "Random Policy" requirement.
- **Changes**:
  - **Backend (`api/index.py`)**: Updated `policy_evaluation` to return all 4 directions for each state to represent a uniform random policy (25% probability each).
  - **Frontend (`script.js` & `style.css`)**: 
    - Implemented a 2x2 grid layout for arrows within a single cell when multiple actions are present.
    - Added CSS logic to shrink and arrange 4 arrows cleanly.
  - **UI/UX**:
    - Added a visual **Legend** to define grid colors (Start, End, Obstacle, Path).
    - Added **Algorithm Descriptions** in the results section to explain the difference between Bellman Expectation and Optimality equations.
    - Enhanced code comments in the backend for better readability and grading.
- **Result**: HW1-2 now correctly displays a 4-arrow random policy, while HW1-3 displays the single-arrow optimal policy.
