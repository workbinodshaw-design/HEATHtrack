/* ============================================================
   HEALTHAI — NOTIFICATION SYSTEM
   Browser Push Notifications + Water/Med Reminders
   ============================================================ */

const Notifications = {

  permission: 'default',
  waterTimer: null,
  medTimers: [],

  async request() {
    if (!('Notification' in window)) {
      showToast('❌ Your browser does not support notifications');
      return false;
    }
    if (Notification.permission === 'granted') {
      this.permission = 'granted';
      return true;
    }
    const result = await Notification.requestPermission();
    this.permission = result;
    return result === 'granted';
  },

  async send(title, body, icon = '💊', tag = 'healthai') {
    // Check quiet hours
    const settings = Storage.getSettings();
    if (settings.quietHours) {
      const h = new Date().getHours();
      if (h >= 23 || h < 7) return;
    }

    if (Notification.permission !== 'granted') {
      const ok = await this.request();
      if (!ok) return;
    }

    try {
      const n = new Notification(title, {
        body,
        icon: `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>${icon}</text></svg>`,
        tag,
        badge: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>❤️</text></svg>',
      });
      setTimeout(() => n.close(), 6000);
    } catch (e) {
      console.warn('Notification failed:', e);
    }
  },

  // ---- WATER REMINDERS ----
  startWaterReminder(intervalMinutes = 60) {
    this.stopWaterReminder();
    const ms = intervalMinutes * 60 * 1000;
    this.waterTimer = setInterval(() => {
      const water = Storage.getTodayWater();
      const totalMl = water.entries.reduce((s, e) => s + e.ml, 0);
      const pct = Math.round(totalMl / water.goal * 100);
      if (pct < 100) {
        this.send(
          '💧 Time to Drink Water!',
          `You've had ${totalMl}ml so far (${pct}% of goal). Stay hydrated!`,
          '💧', 'water-reminder'
        );
      }
    }, ms);
    Storage.saveSettings({ waterReminderOn: true, waterReminderInterval: intervalMinutes });
    showToast(`✅ Water reminders set every ${intervalMinutes} minutes`);
  },

  stopWaterReminder() {
    if (this.waterTimer) { clearInterval(this.waterTimer); this.waterTimer = null; }
    Storage.saveSettings({ waterReminderOn: false });
  },

  // ---- MEDICATION REMINDERS ----
  scheduleMedications() {
    // Clear existing timers
    this.medTimers.forEach(t => clearTimeout(t));
    this.medTimers = [];

    const meds = Storage.getMedications();
    const settings = Storage.getSettings();
    if (!settings.medNotif) return;

    meds.forEach(med => {
      if (!med.times) return;
      med.times.forEach(timeStr => {
        const ms = this._msUntil(timeStr);
        if (ms > 0) {
          const t = setTimeout(() => {
            if (!Storage.isMedTaken(med.id, timeStr)) {
              this.send(
                `💊 Medicine Reminder`,
                `Time to take ${med.name} — ${med.dose}${med.notes ? ' | ' + med.notes : ''}`,
                '💊', `med-${med.id}-${timeStr}`
              );
            }
          }, ms);
          this.medTimers.push(t);
        }
      });
    });
  },

  _msUntil(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    const now = new Date();
    const target = new Date(now);
    target.setHours(h, m, 0, 0);
    const diff = target - now;
    return diff > 0 ? diff : diff + 86400000; // next day if past
  },

  // ---- ACHIEVEMENT NOTIFICATIONS ----
  celebrateWaterGoal() {
    this.send('🎉 Water Goal Achieved!', 'Amazing! You\'ve reached your daily water goal. Keep it up!', '🎉', 'achievement');
  },

  lowWaterAlert() {
    this.send('⚠️ Low Water Intake', 'You\'ve had less than 25% of your daily water goal. Drink up!', '⚠️', 'low-water');
  }
};
