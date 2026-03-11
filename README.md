# Deep Reinforcement Learning - HW1: Grid World Policy Evaluation

👉 **[點此觀看 Live Demo](https://bibaisafish.github.io/DRL_HW1/)**

---

## 🌟 功能 (Features)

### HW1-1: 網格地圖開發 (前端互動)
* **動態網格生成**：允許用戶自由輸入維度 `n` (範圍從 5 到 9)，動態生成 `n x n` 的網格地圖。
* **狀態機互動設計**：透過流暢的滑鼠點擊流程設定環境：
  1. **起點 (Start)**：點擊設定為綠色單元格。
  2. **終點 (End)**：點擊設定為紅色單元格。
  3. **障礙物 (Obstacles)**：設定 `n-2` 個障礙物，點擊變為灰色單元格（保留原始數字顯示）。

### HW1-2: 策略顯示與價值評估 (核心演算法)
* **策略評估 (Policy Evaluation)**：基於隨機策略（上、下、左、右機率各 25%），透過貝爾曼期望方程式 (Bellman Expectation Equation) 迭代計算出每個狀態的價值 `V(s)`，直到數值收斂。
* **策略矩陣 (Policy Matrix)**：根據算出的 `V(s)` 推導出 Greedy Policy，在畫面上顯示每個單元格的最佳行動方向（↑, ↓, ←, →），若有多個最佳方向亦會同時顯示。
* **價值矩陣 (Value Matrix)**：清楚呈現每個單元格最終收斂的預期價值（四捨五入至小數點後兩位）。

---

## 🚀 如何使用 (How to Use)

1. 開啟 [Demo 網頁](https://bibaisafish.github.io/DRL_HW1/)。
2. 在左上角的輸入框輸入 5 到 9 之間的數字，並點擊 **"Generate Square"** 生成網格。
3. 根據畫面上方的提示，依序點擊網格來設定：
   * 第 1 下：設定**起點** (綠色)。
   * 第 2 下：設定**終點** (紅色)。
   * 接下來的 `n-2` 下：設定**障礙物** (灰色)。
4. 設定完成後，點擊下方出現的 **"計算策略與價值 (Calculate)"** 按鈕。
5. 頁面下方會立刻生成並顯示計算完成的 **Value Matrix** (數值) 與 **Policy Matrix** (方向箭頭)。