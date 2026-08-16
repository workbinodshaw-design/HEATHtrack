/**
 * Gamification Engine for HealthTrack
 * Handles XP, Levels, Streaks, and Health Score.
 */

const Gamification = {
  KEYS: { DATA: 'ht_gamification' },

  init() {
    let data = this.getData();
    const today = new Date().toISOString().slice(0, 10);

    if (data.lastLogin !== today) {
      if (data.lastLogin) {
        const diffMs = new Date(today) - new Date(data.lastLogin);
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
        data.streak = diffDays === 1 ? data.streak + 1 : 1;
      } else {
        data.streak = 1;
      }
      data.lastLogin = today;
      this.saveData(data);
    }

    this.updateUI();
  },

  getData() {
    try {
      const raw = localStorage.getItem(this.KEYS.DATA);
      if (raw) return JSON.parse(raw);
    } catch(e) {}
    return { xp: 0, level: 1, streak: 0, lastLogin: null };
  },

  saveData(data) {
    try { localStorage.setItem(this.KEYS.DATA, JSON.stringify(data)); } catch(e) {}
  },

  getLevel(xp) {
    return Math.floor(Math.sqrt(xp / 100)) + 1;
  },

  addXP(amount, reason) {
    let data = this.getData();
    const oldLevel = data.level;
    data.xp += amount;
    data.level = this.getLevel(data.xp);

    this.saveData(data);
    this.updateUI();
    this.showFloatingXP(amount, reason);

    if (data.level > oldLevel) {
      setTimeout(() => this.triggerLevelUp(data.level), 400);
    }
  },

  updateUI() {
    const data = this.getData();
    const levelEl = document.getElementById('topbar-level');
    const streakEl = document.getElementById('topbar-streak');
    const progressEl = document.getElementById('topbar-level-progress');

    if (levelEl) levelEl.textContent = 'Lvl ' + data.level;
    if (streakEl) streakEl.textContent = data.streak + ' day' + (data.streak !== 1 ? 's' : '');

    const currentBase = Math.pow(data.level - 1, 2) * 100;
    const nextBase    = Math.pow(data.level, 2) * 100;
    const pct = nextBase === currentBase ? 100 : Math.min(100, Math.max(0, (data.xp - currentBase) / (nextBase - currentBase) * 100));
    if (progressEl) progressEl.style.width = pct + '%';
  },

  showFloatingXP(amount, reason) {
    const container = document.getElementById('floating-xp-container');
    if (!container) return;
    const el = document.createElement('div');
    el.className = 'floating-xp';
    el.innerHTML = '+' + amount + ' XP<small>' + (reason || '') + '</small>';
    el.style.left = (30 + Math.random() * 40) + '%';
    container.appendChild(el);
    setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 2500);
  },

  triggerLevelUp(newLevel) {
    if (typeof showToast === 'function') showToast('Level Up! You are now Level ' + newLevel + '!');
    this.fireConfetti();
  },

  fireConfetti() {
    if (typeof confetti !== 'function') return;
    const end = Date.now() + 3000;
    (function frame() {
      confetti({ particleCount: 5, angle: 60,  spread: 55, origin: { x: 0 }, colors: ['#3b82f6','#10b981','#f59e0b'] });
      confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#3b82f6','#10b981','#f59e0b'] });
      if (Date.now() < end) requestAnimationFrame(frame);
    }());
  }
};