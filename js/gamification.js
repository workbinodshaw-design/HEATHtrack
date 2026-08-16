/**
 * Gamification Engine for HealthTrack
 * Handles XP, Levels, Streaks, and Health Score.
 */

const Gamification = {
  KEYS: {
    DATA: 'ht_gamification'
  },

  init() {
    let data = this.getData();
    
    // Check streak
    const today = new Date().toDateString();
    if (data.lastLogin !== today) {
      if (data.lastLogin) {
        const last = new Date(data.lastLogin);
        const now = new Date();
        const diffTime = Math.abs(now - last);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          data.streak += 1;
        } else {
          data.streak = 1; // reset streak if missed a day
        }
      } else {
        data.streak = 1;
      }
      data.lastLogin = today;
      this.saveData(data);
    }
    
    this.updateUI();
  },

  getData() {
    const raw = localStorage.getItem(this.KEYS.DATA);
    if (raw) return JSON.parse(raw);
    return { xp: 0, level: 1, streak: 0, lastLogin: null };
  },

  saveData(data) {
    localStorage.setItem(this.KEYS.DATA, JSON.stringify(data));
  },

  addXP(amount, reason) {
    let data = this.getData();
    data.xp += amount;
    
    const newLevel = Math.floor(Math.sqrt(data.xp / 100)) + 1;
    let leveledUp = false;
    
    if (newLevel > data.level) {
      data.level = newLevel;
      leveledUp = true;
    }
    
    this.saveData(data);
    this.updateUI();
    this.showFloatingXP(amount, reason);
    
    if (leveledUp) {
      setTimeout(() => this.triggerLevelUp(data.level), 500);
    }
  },

  updateUI() {
    const data = this.getData();
    
    // Update Topbar
    const levelEl = document.getElementById('topbar-level');
    const streakEl = document.getElementById('topbar-streak');
    
    if (levelEl) levelEl.innerHTML = `🏆 Lvl ${data.level}`;
    if (streakEl) streakEl.innerHTML = `🔥 ${data.streak}`;
    
    // Calculate progress to next level
    const currentLevelBaseXP = Math.pow(data.level - 1, 2) * 100;
    const nextLevelBaseXP = Math.pow(data.level, 2) * 100;
    const xpInLevel = data.xp - currentLevelBaseXP;
    const xpNeeded = nextLevelBaseXP - currentLevelBaseXP;
    const pct = Math.min(100, Math.max(0, (xpInLevel / xpNeeded) * 100));
    
    const progressEl = document.getElementById('topbar-level-progress');
    if (progressEl) progressEl.style.width = `${pct}%`;
    
    const xpTextEl = document.getElementById('topbar-xp-text');
    if (xpTextEl) xpTextEl.textContent = `${data.xp} XP`;
  },

  showFloatingXP(amount, reason) {
    const container = document.getElementById('floating-xp-container');
    if (!container) return;
    
    const el = document.createElement('div');
    el.className = 'floating-xp';
    el.innerHTML = `+${amount} XP <small>${reason}</small>`;
    
    // Randomize horizontal position slightly
    el.style.left = `50%`;
    el.style.transform = `translateX(-50%)`;
    
    container.appendChild(el);
    setTimeout(() => el.remove(), 2500);
  },

  triggerLevelUp(newLevel) {
    if (typeof showToast === 'function') {
      showToast(`🎉 LEVEL UP! You are now Level ${newLevel}!`);
    }
    this.fireConfetti();
  },

  fireConfetti() {
    if (typeof confetti !== 'function') return;
    const duration = 3000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#3b82f6', '#10b981', '#f59e0b']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#3b82f6', '#10b981', '#f59e0b']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  },
  
  calculateHealthScore() {
    const water = typeof Storage !== 'undefined' ? Storage.getTodayWater() : {entries:[], goal:2000};
    const nut = typeof Storage !== 'undefined' ? Storage.getTodayNutrition() : {meals:[]};
    const act = typeof Storage !== 'undefined' ? Storage.getTodayActivity() : {sessions:[]};
    const settings = typeof Storage !== 'undefined' ? Storage.getSettings() : {waterGoal:2000, calGoal:2000, actGoal:30};
    
    const totalWater = water.entries.reduce((s, e) => s + e.ml, 0);
    const waterPct = Math.min(100, Math.round(totalWater / (water.goal || settings.waterGoal || 2000) * 100));
    
    const totalCal = nut.meals.reduce((s, m) => s + (m.cal || 0), 0);
    const calPct = Math.min(100, Math.round(totalCal / (settings.calGoal || 2000) * 100));
    
    const totalActMin = act.sessions.reduce((s, a) => s + (a.duration || 0), 0);
    const actPct = Math.min(100, Math.round(totalActMin / (settings.actGoal || 30) * 100));
    
    // Average score
    return Math.round((waterPct + calPct + actPct) / 3);
  }
};
