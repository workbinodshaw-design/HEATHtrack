/* ============================================================
   HEALTHAI — STORAGE MANAGER
   Handles all localStorage read/write operations
   ============================================================ */

const Storage = {

  KEYS: {
    PROFILE:    'hai_profile',
    WATER:      'hai_water',       // { date, entries: [{ml, time, icon}], goal }
    MEDICATIONS:'hai_medications', // [{ id, name, dose, freq, times[], color, notes, takenDates:{} }]
    NUTRITION:  'hai_nutrition',   // { date, meals: [{type, name, qty, cal, protein, carbs, fats}] }
    ACTIVITY:   'hai_activity',    // { date, sessions: [{type, duration, calories, notes, time}] }
    SETTINGS:   'hai_settings',
    API_KEY:    'hai_gemini_key',
    ONBOARDED:  'hai_onboarded',
  },

  get(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },

  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch (e) { console.warn('Storage write failed:', e); }
  },

  remove(key) { localStorage.removeItem(key); },

  // ---- PROFILE ----
  getProfile() {
    return this.get(this.KEYS.PROFILE) || {
      name: '', age: '', gender: 'male', blood: '',
      height: '', weight: '', activity: 'sedentary',
      conditions: [], allergies: ''
    };
  },
  saveProfile(data) { this.set(this.KEYS.PROFILE, data); },

  // ---- WATER ----
  getTodayWater() {
    const today = this._today();
    const stored = this.get(this.KEYS.WATER);
    if (stored && stored.date === today) return stored;
    return { date: today, entries: [], goal: this.getSettings().waterGoal || 2000 };
  },
  saveWater(data) { this.set(this.KEYS.WATER, { ...data, date: this._today() }); },

  getWeeklyWater() {
    // Returns array of 7 values (ml per day for last 7 days)
    // For now, simulates with today's data; extend with history array as needed
    const history = this.get('hai_water_history') || {};
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = this._dateOffset(-i);
      days.push(history[d] || 0);
    }
    return days;
  },
  saveWaterHistory(ml) {
    const history = this.get('hai_water_history') || {};
    history[this._today()] = ml;
    this.set('hai_water_history', history);
  },

  // ---- MEDICATIONS ----
  getMedications() { return this.get(this.KEYS.MEDICATIONS) || []; },
  saveMedications(meds) { this.set(this.KEYS.MEDICATIONS, meds); },
  addMedication(med) {
    const meds = this.getMedications();
    meds.push({ ...med, id: Date.now() });
    this.saveMedications(meds);
  },
  removeMedication(id) {
    const meds = this.getMedications().filter(m => m.id !== id);
    this.saveMedications(meds);
  },
  markMedTaken(medId, time) {
    const meds = this.getMedications();
    const med = meds.find(m => m.id === medId);
    if (!med) return;
    if (!med.takenDates) med.takenDates = {};
    const key = `${this._today()}_${time}`;
    med.takenDates[key] = true;
    this.saveMedications(meds);
  },
  isMedTaken(medId, time) {
    const meds = this.getMedications();
    const med = meds.find(m => m.id === medId);
    if (!med || !med.takenDates) return false;
    return !!med.takenDates[`${this._today()}_${time}`];
  },

  // ---- NUTRITION ----
  getTodayNutrition() {
    const today = this._today();
    const stored = this.get(this.KEYS.NUTRITION);
    if (stored && stored.date === today) return stored;
    return { date: today, meals: [] };
  },
  saveNutrition(data) { this.set(this.KEYS.NUTRITION, { ...data, date: this._today() }); },

  getWeeklyCalories() {
    const history = this.get('hai_cal_history') || {};
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = this._dateOffset(-i);
      days.push(history[d] || 0);
    }
    return days;
  },
  saveCalHistory(cal) {
    const history = this.get('hai_cal_history') || {};
    history[this._today()] = cal;
    this.set('hai_cal_history', history);
  },

  // ---- ACTIVITY ----
  getTodayActivity() {
    const today = this._today();
    const stored = this.get(this.KEYS.ACTIVITY);
    if (stored && stored.date === today) return stored;
    return { date: today, sessions: [] };
  },
  saveActivity(data) { this.set(this.KEYS.ACTIVITY, { ...data, date: this._today() }); },

  getWeeklyActivity() {
    const history = this.get('hai_act_history') || {};
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = this._dateOffset(-i);
      days.push(history[d] || 0);
    }
    return days;
  },
  saveActHistory(min) {
    const history = this.get('hai_act_history') || {};
    history[this._today()] = min;
    this.set('hai_act_history', history);
  },

  // ---- SETTINGS ----
  getSettings() {
    return this.get(this.KEYS.SETTINGS) || {
      waterGoal: 2000, calGoal: 2000, actGoal: 30,
      waterNotif: true, medNotif: true, quietHours: false,
      theme: 'light', waterReminderInterval: 60, waterReminderOn: false
    };
  },
  saveSettings(data) { this.set(this.KEYS.SETTINGS, { ...this.getSettings(), ...data }); },

  // ---- API KEY ----
  getApiKey() { return this.get(this.KEYS.API_KEY) || ''; },
  saveApiKey(key) { this.set(this.KEYS.API_KEY, key); },

  // ---- HELPERS ----
  _today() { return new Date().toISOString().slice(0, 10); },
  _dateOffset(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  },

  clearToday() {
    this.saveWater({ date: this._today(), entries: [], goal: this.getSettings().waterGoal });
    this.saveNutrition({ date: this._today(), meals: [] });
    this.saveActivity({ date: this._today(), sessions: [] });
  },

  clearAll() {
    Object.values(this.KEYS).forEach(k => localStorage.removeItem(k));
    ['hai_water_history','hai_cal_history','hai_act_history'].forEach(k => localStorage.removeItem(k));
  }
};
