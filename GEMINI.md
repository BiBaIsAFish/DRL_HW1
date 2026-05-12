# Project Guidelines & Modification Log

## Architecture Overview
- **Frontend**: Vanilla JavaScript, HTML5, CSS3.
- **Backend**: Python Flask (deployed via Vercel Serverless Functions).
- **Domain**: Reinforcement Learning - Grid World.

## Grading Criteria Alignment
- **HW1-1**: Interactive grid setup (Start, End, Obstacles).
- **HW1-2**: Policy Evaluation using Bellman Expectation Equation. Must display 4-way random arrows.
- **HW1-3**: Value Iteration using Bellman Optimality Equation. Must display single optimal arrows and highlight the path.

## Modification Log

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
