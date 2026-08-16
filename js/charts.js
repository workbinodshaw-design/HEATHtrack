/* ============================================================
   HEALTHAI — CHARTS MODULE
   Chart.js wrappers for all visualizations
   ============================================================ */

const Charts = {

  instances: {},

  _weekLabels() {
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const labels = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      labels.push(i === 0 ? 'Today' : days[d.getDay()]);
    }
    return labels;
  },

  _destroy(id) {
    if (this.instances[id]) { this.instances[id].destroy(); delete this.instances[id]; }
  },

  _isDark() {
    return document.documentElement.getAttribute('data-theme') !== 'light';
  },

  _defaults() {
    const dark = this._isDark();
    const gridColor  = dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
    const tickColor  = dark ? 'rgba(240,240,244,0.35)'  : 'rgba(15,17,23,0.4)';
    const tooltipBg  = dark ? '#1e1e25' : '#111115';
    return {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: tooltipBg,
          titleColor: 'rgba(255,255,255,0.9)',
          bodyColor: 'rgba(255,255,255,0.65)',
          borderColor: 'rgba(255,255,255,0.08)', borderWidth: 1,
          padding: 12, cornerRadius: 12,
          titleFont: { family: 'Sora', weight: '700', size: 13 },
          bodyFont: { family: 'Inter', size: 12 },
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: tickColor, font: { size: 11, family: 'Inter', weight: '500' } },
          border: { display: false }
        },
        y: {
          grid: { color: gridColor, drawBorder: false },
          ticks: { color: tickColor, font: { size: 11, family: 'Inter', weight: '500' } },
          border: { display: false }
        }
      }
    };
  },

  // Weekly Water Chart
  drawWeeklyWater(canvasId) {
    this._destroy(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    const data = Storage.getWeeklyWater();
    const goal = Storage.getSettings().waterGoal || 2000;

    this.instances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this._weekLabels(),
        datasets: [{
          data,
          backgroundColor: data.map(v => v >= goal ? 'hsl(210, 90%, 56%)' : 'hsl(210, 90%, 80%)'),
          borderRadius: 8,
          borderSkipped: false,
        }, {
          type: 'line',
          data: Array(7).fill(goal),
          borderColor: 'hsl(160, 68%, 44%)',
          borderDash: [5, 3],
          borderWidth: 1.5,
          pointRadius: 0,
          fill: false,
        }]
      },
      options: {
        ...this._defaults(),
        scales: {
          ...this._defaults().scales,
          y: { ...this._defaults().scales.y, suggestedMax: goal * 1.3, beginAtZero: true }
        },
        plugins: {
          ...this._defaults().plugins,
          tooltip: {
            ...this._defaults().plugins.tooltip,
            callbacks: {
              label: ctx => `${ctx.raw} ml`
            }
          }
        }
      }
    });
  },

  // Weekly Calories Chart
  drawWeeklyCalories(canvasId) {
    this._destroy(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    const data = Storage.getWeeklyCalories();
    const goal = Storage.getSettings().calGoal || 2000;

    this.instances[canvasId] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this._weekLabels(),
        datasets: [{
          data,
          borderColor: 'hsl(28, 90%, 56%)',
          backgroundColor: 'hsl(28, 90%, 56%, 0.1)',
          borderWidth: 2.5,
          pointBackgroundColor: 'hsl(28, 90%, 56%)',
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true,
          tension: 0.4,
        }]
      },
      options: {
        ...this._defaults(),
        scales: {
          ...this._defaults().scales,
          y: { ...this._defaults().scales.y, suggestedMax: goal * 1.3, beginAtZero: true }
        }
      }
    });
  },

  // Weekly Activity Chart
  drawWeeklyActivity(canvasId) {
    this._destroy(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    const data = Storage.getWeeklyActivity();

    this.instances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this._weekLabels(),
        datasets: [{
          data,
          backgroundColor: 'hsl(160, 68%, 44%)',
          borderRadius: 8,
          borderSkipped: false,
        }]
      },
      options: {
        ...this._defaults(),
        scales: {
          ...this._defaults().scales,
          y: { ...this._defaults().scales.y, beginAtZero: true }
        },
        plugins: {
          ...this._defaults().plugins,
          tooltip: {
            ...this._defaults().plugins.tooltip,
            callbacks: { label: ctx => `${ctx.raw} min` }
          }
        }
      }
    });
  },

  // Med Adherence Chart — REAL data from localStorage
  drawMedAdherence(canvasId) {
    this._destroy(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    // Build real 7-day adherence data
    const meds = Storage.getMedications();
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().slice(0, 10);

      if (!meds.length) { data.push(0); continue; }

      let taken = 0, total = 0;
      meds.forEach(med => {
        if (med.times && med.times.length) {
          med.times.forEach(t => {
            total++;
            const key = dateKey + '_' + t;
            if (med.takenDates && med.takenDates[key]) taken++;
          });
        }
      });
      data.push(total > 0 ? Math.round(taken / total * 100) : 0);
    }

    this.instances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this._weekLabels(),
        datasets: [{
          data,
          backgroundColor: data.map(v => v >= 100 ? 'hsl(160, 68%, 44%)' : v >= 60 ? 'hsl(210, 90%, 56%)' : v > 0 ? 'hsl(28, 90%, 56%)' : 'rgba(255,255,255,0.08)'),
          borderRadius: 8,
          borderSkipped: false,
        }]
      },
      options: {
        ...this._defaults(),
        scales: {
          ...this._defaults().scales,
          y: { ...this._defaults().scales.y, min: 0, max: 100 }
        },
        plugins: {
          ...this._defaults().plugins,
          tooltip: {
            ...this._defaults().plugins.tooltip,
            callbacks: { label: ctx => ctx.raw + '% taken' }
          }
        }
      }
    });
  },

  // Update ring progress (SVG dashoffset trick)
  updateRing(elementId, percent) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const circumference = 2 * Math.PI * 15.9; // r=15.9
    const offset = circumference - (Math.min(percent, 100) / 100) * circumference;
    el.style.strokeDasharray = `${circumference}`;
    el.style.strokeDashoffset = offset;
  },

  // Update activity ring
  updateActivityRing(elementId, percent) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const circumference = 2 * Math.PI * 40; // r=40
    const offset = circumference - (Math.min(percent, 100) / 100) * circumference;
    el.style.strokeDasharray = `${circumference}`;
    el.style.strokeDashoffset = offset;
  }
};
