// CRAM CLICKER - Johns Hopkins University Edition
(() => {
  'use strict';

  // --- SOUND SYNTHESIS (Web Audio API) ---
  class SoundFX {
    constructor() {
      this.enabled = true;
      this.ctx = null;
    }

    init() {
      if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    playClick() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      const now = this.ctx.currentTime;
      // Quick cheerful click frequency pop
      osc.frequency.setValueAtTime(320 + Math.random() * 80, now);
      osc.frequency.exponentialRampToValueAtTime(700, now + 0.08);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    }

    playBuy() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 major triad
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);

        gain.gain.setValueAtTime(0.12, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.2);
      });
    }
  }

  const sfx = new SoundFX();

  // --- GAME DEFINITIONS ---
  const BUILDINGS_DEF = [
    {
      id: 'coffee',
      name: 'Brody Café Drip Coffee',
      desc: 'Keeps your eyes open during morning 8 AM lectures.',
      baseCost: 20,
      baseKps: 0.4,
      icon: '☕'
    },
    {
      id: 'flashcards',
      name: 'Anki Flashcard Deck',
      desc: 'Spaced repetition algorithms maximize memory retention.',
      baseCost: 140,
      baseKps: 3,
      icon: '📇'
    },
    {
      id: 'ta',
      name: 'TA Office Hours',
      desc: 'Get unblocked on that brutal organic chemistry problem set.',
      baseCost: 1500,
      baseKps: 22,
      icon: '🧑‍🏫'
    },
    {
      id: 'studyGroup',
      name: 'Brody Atrium Study Group',
      desc: 'Collaborative all-nighters fueled by energy drinks and shared panic.',
      baseCost: 16000,
      baseKps: 175,
      icon: '👥'
    },
    {
      id: 'stacks',
      name: 'MSE Stacks Deep Dive',
      desc: 'Silence so absolute on B-Level that learning happens by osmosis.',
      baseCost: 180000,
      baseKps: 950,
      icon: '📚'
    },
    {
      id: 'gilman',
      name: 'Gilman Bell Tower Focus',
      desc: 'The historic chime of Gilman inspires peak academic performance.',
      baseCost: 2000000,
      baseKps: 5000,
      icon: '🏛️'
    },
    {
      id: 'lab',
      name: 'Bloomberg Lab Grant',
      desc: 'State-of-the-art public health laboratory infrastructure.',
      baseCost: 28000000,
      baseKps: 28000,
      icon: '🔬'
    },
    {
      id: 'laureate',
      name: 'Nobel Laureate Mentorship',
      desc: '1-on-1 guidance from world-renowned Hopkins faculty.',
      baseCost: 450000000,
      baseKps: 160000,
      icon: '🏅'
    }
  ];

  const UPGRADES_DEF = [
    {
      id: 'pens',
      name: 'PaperMate InkJoy Gel Pens',
      desc: 'Silky-smooth 0.7mm gel ink. Double your clicking knowledge.',
      cost: 150,
      icon: '🖊️',
      effect: (state) => { state.clickMultiplier *= 2; }
    },
    {
      id: 'highlighters',
      name: 'Color Highlighters',
      desc: 'Neon visual clarity. Double your clicking knowledge.',
      cost: 800,
      icon: '🖍️',
      effect: (state) => { state.clickMultiplier *= 2; }
    },
    {
      id: 'birdInHand',
      name: 'Bird in Hand Espresso',
      desc: 'Boosts Brody Café output by 2x.',
      cost: 2200,
      icon: '⚡',
      effect: (state) => { state.buildingMultipliers['coffee'] = (state.buildingMultipliers['coffee'] || 1) * 2; }
    },
    {
      id: 'ffc',
      name: 'FFC Unlimited Swipes',
      desc: 'Fresh Food Cafe endless pasta and waffle bar powers late night cramming. +50% total KPS.',
      cost: 6000,
      icon: '🥗',
      effect: (state) => { state.kpsMultiplier *= 1.5; }
    },
    {
      id: 'ergonomicChair',
      name: 'Brody Pod Chair',
      desc: 'Comfortable focus. Double your clicking knowledge.',
      cost: 12000,
      icon: '🪑',
      effect: (state) => { state.clickMultiplier *= 2; }
    },
    {
      id: 'levering',
      name: 'Levering Peach Tea Rush',
      desc: 'A cold peach tea from Levering Lounge keeps the mind sharp. Double your clicking knowledge.',
      cost: 25000,
      icon: '🍑',
      effect: (state) => { state.clickMultiplier *= 2; }
    },
    {
      id: 'crabSpirit',
      name: 'Maryland Crab Spirit',
      desc: 'Pure Baltimore energy. Double clicking knowledge.',
      cost: 60000,
      icon: '🦀',
      effect: (state) => { state.clickMultiplier *= 2; }
    },
    {
      id: 'stuce',
      name: 'Stuce Midnight Hangout',
      desc: 'Decompress and collaborate with friends at the Student Center. Multiplies total KPS by 2x.',
      cost: 150000,
      icon: '🏢',
      effect: (state) => { state.kpsMultiplier *= 2; }
    },
    {
      id: 'laxStick',
      name: 'D1 Championship Lacrosse Stick',
      desc: 'Blue Jay championship mentality. Double total KPS.',
      cost: 400000,
      icon: '🥍',
      effect: (state) => { state.kpsMultiplier *= 2; }
    }
  ];

  const FLAVOR_QUOTES = [
    '"Brody Café is brewing fresh coffee. Start clicking to cram for midterms!"',
    '"Grabbing an all-you-can-eat dinner at FFC before hitting the books."',
    '"Keyser Quad is looking peaceful today. Perfect for reading on the grass."',
    '"Getting a cold peach tea at Levering Lounge to stay sharp."',
    '"Someone left their notes on Level M of MSE. Free knowledge!"',
    '"Heading over to Stuce for late-night project group work."',
    '"Spring Fair is coming up, but finals come first!"',
    '"Gilman Hall clock tower just chimed the hour. Back to studying!"',
    '"You just found an empty study room in Brody with a working whiteboard!"',
    '"Your Blue Jay pride is accelerating your brainpower!"'
  ];

  // --- STATE ---
  let state = {
    knowledge: 0,
    totalKnowledge: 0,
    totalClicks: 0,
    startTime: Date.now(),
    clickMultiplier: 1,
    kpsMultiplier: 1,
    buildingMultipliers: {},
    buildings: {},
    upgradesPurchased: []
  };

  // Initialize building counts
  BUILDINGS_DEF.forEach(b => {
    state.buildings[b.id] = 0;
    state.buildingMultipliers[b.id] = 1;
  });

  // --- HELPERS ---
  function formatNumber(num) {
    if (num < 1000) return num.toLocaleString('en-US', { maximumFractionDigits: 1 });
    const suffixes = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx'];
    const i = Math.floor(Math.log10(num) / 3);
    const formatted = (num / Math.pow(10, i * 3)).toFixed(2);
    return `${formatted} ${suffixes[i] || ''}`;
  }

  function getBuildingCost(buildingDef, currentCount) {
    // 1.18 cost growth factor for smoother, more deliberate progression pacing
    return Math.floor(buildingDef.baseCost * Math.pow(1.18, currentCount));
  }

  function getKps() {
    let kps = 0;
    BUILDINGS_DEF.forEach(b => {
      const count = state.buildings[b.id] || 0;
      const mult = state.buildingMultipliers[b.id] || 1;
      kps += count * b.baseKps * mult;
    });
    return kps * state.kpsMultiplier;
  }

  function getClickPower() {
    return 1 * state.clickMultiplier;
  }

  // --- STORAGE ---
  const STORAGE_KEY = 'jhu_cram_clicker_save';

  function saveGame() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Could not save game:', e);
    }
  }

  function loadGame() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        state = { ...state, ...parsed };
        // Re-apply upgrade effects
        state.clickMultiplier = 1;
        state.kpsMultiplier = 1;
        BUILDINGS_DEF.forEach(b => {
          state.buildingMultipliers[b.id] = 1;
        });
        state.upgradesPurchased.forEach(upgId => {
          const upg = UPGRADES_DEF.find(u => u.id === upgId);
          if (upg) upg.effect(state);
        });
      }
    } catch (e) {
      console.warn('Could not load game save:', e);
    }
  }

  function resetGame() {
    if (confirm('Are you sure you want to reset all your Cram Clicker study progress?')) {
      localStorage.removeItem(STORAGE_KEY);
      location.reload();
    }
  }

  // --- DOM ELEMENTS ---
  const knowledgeDisplay = document.getElementById('knowledgeDisplay');
  const kpsDisplay = document.getElementById('kpsDisplay');
  const clickPowerDisplay = document.getElementById('clickPowerDisplay');
  const mascotBtn = document.getElementById('mascotBtn');
  const clickEffectsContainer = document.getElementById('clickEffectsContainer');
  const buildingsList = document.getElementById('buildingsList');
  const upgradesShelf = document.getElementById('upgradesShelf');
  const flavorText = document.getElementById('flavorText');
  const audioToggleBtn = document.getElementById('audioToggleBtn');
  const audioIcon = document.getElementById('audioIcon');
  const resetGameBtn = document.getElementById('resetGameBtn');
  const statsModalBtn = document.getElementById('statsModalBtn');
  const statsModal = document.getElementById('statsModal');
  const closeStatsBtn = document.getElementById('closeStatsBtn');
  const upgradesOrbit = document.getElementById('upgradesOrbit');

  // Stats DOM
  const statTotalEarned = document.getElementById('statTotalEarned');
  const statTotalClicks = document.getElementById('statTotalClicks');
  const statTimePlayed = document.getElementById('statTimePlayed');
  const statHelpersOwned = document.getElementById('statHelpersOwned');
  const achievementsList = document.getElementById('achievementsList');

  // --- FLOATING CLICK EFFECT ---
  function spawnFloatingNumber(x, y, value) {
    const el = document.createElement('div');
    el.className = 'float-number';
    el.textContent = `+${formatNumber(value)}`;

    // Calculate relative coordinates inside mascot container
    const rect = mascotBtn.getBoundingClientRect();
    const relX = x ? (x - rect.left) : (rect.width / 2);
    const relY = y ? (y - rect.top) : (rect.height / 2);

    el.style.left = `${relX + (Math.random() * 30 - 15)}px`;
    el.style.top = `${relY + (Math.random() * 20 - 10)}px`;

    clickEffectsContainer.appendChild(el);

    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 850);
  }

  // --- CLICK HANDLING ---
  function handleClick(e) {
    const power = getClickPower();
    state.knowledge += power;
    state.totalKnowledge += power;
    state.totalClicks += 1;

    sfx.playClick();
    spawnFloatingNumber(e.clientX, e.clientY, power);
    updateDisplay();
  }

  mascotBtn.addEventListener('click', handleClick);

  // --- STORE RENDERING ---
  function renderBuildings() {
    buildingsList.innerHTML = '';
    BUILDINGS_DEF.forEach(b => {
      const count = state.buildings[b.id] || 0;
      const cost = getBuildingCost(b, count);
      const mult = state.buildingMultipliers[b.id] || 1;
      const effectiveKps = (b.baseKps * mult * state.kpsMultiplier).toFixed(1);

      const card = document.createElement('div');
      card.className = `building-card ${state.knowledge < cost ? 'cant-afford' : ''}`;
      card.id = `building-${b.id}`;

      card.innerHTML = `
        <div class="building-left">
          <div class="building-icon">${b.icon}</div>
          <div class="building-info">
            <span class="building-name">${b.name}</span>
            <span class="building-desc">+${effectiveKps} knowledge/s &bull; ${b.desc}</span>
            <span class="building-cost">⚡ ${formatNumber(cost)} knowledge</span>
          </div>
        </div>
        <div class="building-right">
          <span class="building-count">${count}</span>
        </div>
      `;

      card.addEventListener('click', () => buyBuilding(b));
      buildingsList.appendChild(card);
    });
  }

  function buyBuilding(b) {
    const count = state.buildings[b.id] || 0;
    const cost = getBuildingCost(b, count);
    if (state.knowledge >= cost) {
      state.knowledge -= cost;
      state.buildings[b.id] = count + 1;
      sfx.playBuy();
      updateDisplay();
      renderBuildings();
      renderOrbitIndicators();
      saveGame();
    }
  }

  function renderUpgrades() {
    upgradesShelf.innerHTML = '';
    UPGRADES_DEF.forEach(upg => {
      const isPurchased = state.upgradesPurchased.includes(upg.id);
      if (isPurchased) return; // Hide purchased upgrades

      const canAfford = state.knowledge >= upg.cost;
      const card = document.createElement('div');
      card.className = `upgrade-card ${!canAfford ? 'locked' : ''}`;
      card.title = `${upg.name} (${formatNumber(upg.cost)} knowledge)\n${upg.desc}`;

      card.innerHTML = `
        <span class="upg-icon">${upg.icon}</span>
      `;

      card.addEventListener('click', () => buyUpgrade(upg));
      upgradesShelf.appendChild(card);
    });

    if (upgradesShelf.children.length === 0) {
      upgradesShelf.innerHTML = '<span style="font-size: 0.8rem; color: var(--text-dim); padding: 0.5rem;">All available study upgrades acquired!</span>';
    }
  }

  function buyUpgrade(upg) {
    if (state.knowledge >= upg.cost && !state.upgradesPurchased.includes(upg.id)) {
      state.knowledge -= upg.cost;
      state.upgradesPurchased.push(upg.id);
      upg.effect(state);
      sfx.playBuy();
      updateDisplay();
      renderUpgrades();
      renderBuildings();
      renderOrbitIndicators();
      saveGame();
    }
  }

  let orbitAngle = 0;
  let isOrbitHovered = false;
  let activeOrbitBadges = [];

  function renderOrbitIndicators() {
    if (!upgradesOrbit) return;
    upgradesOrbit.innerHTML = '';
    activeOrbitBadges = [];

    const indicators = [];

    // Add purchased upgrades
    state.upgradesPurchased.forEach(upgId => {
      const upg = UPGRADES_DEF.find(u => u.id === upgId);
      if (upg) {
        indicators.push({
          id: upg.id,
          name: upg.name,
          desc: upg.desc,
          icon: upg.icon,
          count: null,
          type: 'upgrade'
        });
      }
    });

    // Add purchased study helpers/buildings
    BUILDINGS_DEF.forEach(b => {
      const count = state.buildings[b.id] || 0;
      if (count > 0) {
        indicators.push({
          id: b.id,
          name: b.name,
          desc: `${count} active (+${(b.baseKps * count * (state.buildingMultipliers[b.id] || 1) * state.kpsMultiplier).toFixed(1)} KPS)`,
          icon: b.icon,
          count: count,
          type: 'building'
        });
      }
    });

    if (indicators.length === 0) {
      upgradesOrbit.style.borderStyle = 'none';
      return;
    } else {
      upgradesOrbit.style.borderStyle = 'dashed';
    }

    const total = indicators.length;

    indicators.forEach((item, index) => {
      const baseAngle = (index / total) * 2 * Math.PI - Math.PI / 2;

      const badge = document.createElement('div');
      badge.className = 'orbit-badge';

      badge.innerHTML = `
        <span class="badge-icon">${item.icon}</span>
        ${item.count && item.count > 1 ? `<span class="badge-count">${item.count}</span>` : ''}
        <div class="badge-tooltip">
          <strong>${item.name}</strong><br>
          <span>${item.desc}</span>
        </div>
      `;

      badge.addEventListener('mouseenter', () => { isOrbitHovered = true; });
      badge.addEventListener('mouseleave', () => { isOrbitHovered = false; });

      upgradesOrbit.appendChild(badge);
      activeOrbitBadges.push({ element: badge, baseAngle });
    });

    updateOrbitPositions();
  }

  function updateOrbitPositions() {
    const radius = 195; // Radius in pixels for orbit placement
    activeOrbitBadges.forEach(item => {
      const angle = item.baseAngle + orbitAngle;
      const x = Math.round(Math.cos(angle) * radius);
      const y = Math.round(Math.sin(angle) * radius);
      item.element.style.setProperty('--ox', `${x}px`);
      item.element.style.setProperty('--oy', `${y}px`);
    });
  }

  // --- DISPLAY UPDATE ---
  function updateDisplay() {
    knowledgeDisplay.textContent = formatNumber(Math.floor(state.knowledge));
    kpsDisplay.textContent = formatNumber(getKps());
    clickPowerDisplay.textContent = formatNumber(getClickPower());

    // Update affordability classes without recreating DOM elements
    BUILDINGS_DEF.forEach(b => {
      const el = document.getElementById(`building-${b.id}`);
      if (el) {
        const cost = getBuildingCost(b, state.buildings[b.id] || 0);
        if (state.knowledge < cost) {
          el.classList.add('cant-afford');
        } else {
          el.classList.remove('cant-afford');
        }
      }
    });

    const upgCards = upgradesShelf.querySelectorAll('.upgrade-card');
    UPGRADES_DEF.filter(u => !state.upgradesPurchased.includes(u.id)).forEach((u, i) => {
      if (upgCards[i]) {
        if (state.knowledge < u.cost) {
          upgCards[i].classList.add('locked');
        } else {
          upgCards[i].classList.remove('locked');
        }
      }
    });
  }

  // --- STATS & ACHIEVEMENTS ---
  function updateStatsModal() {
    statTotalEarned.textContent = formatNumber(Math.floor(state.totalKnowledge));
    statTotalClicks.textContent = state.totalClicks.toLocaleString();
    const minutes = Math.floor((Date.now() - state.startTime) / 60000);
    statTimePlayed.textContent = `${minutes} min`;

    let helpersCount = 0;
    BUILDINGS_DEF.forEach(b => {
      helpersCount += (state.buildings[b.id] || 0);
    });
    statHelpersOwned.textContent = helpersCount.toLocaleString();

    // Render Achievements
    const achievements = [
      { id: 'first_click', name: 'Freshman Orientation', desc: 'Click the Blue Jay 1 time', unlocked: state.totalClicks >= 1, icon: '🎓' },
      { id: 'clicks_100', name: 'Coffee Addict', desc: 'Click the Blue Jay 100 times', unlocked: state.totalClicks >= 100, icon: '☕' },
      { id: 'k_1000', name: 'Passing Grades', desc: 'Accumulate 1,000 total knowledge', unlocked: state.totalKnowledge >= 1000, icon: '📝' },
      { id: 'k_100k', name: "Dean's List", desc: 'Accumulate 100,000 total knowledge', unlocked: state.totalKnowledge >= 100000, icon: '📜' },
      { id: 'k_10m', name: 'Phi Beta Kappa', desc: 'Accumulate 10,000,000 total knowledge', unlocked: state.totalKnowledge >= 10000000, icon: '🏆' }
    ];

    achievementsList.innerHTML = achievements.map(a => `
      <div class="achievement-card ${a.unlocked ? 'unlocked' : ''}">
        <span class="achievement-icon">${a.unlocked ? a.icon : '🔒'}</span>
        <div>
          <div class="achievement-title">${a.name} ${a.unlocked ? '✓' : ''}</div>
          <div class="achievement-desc">${a.desc}</div>
        </div>
      </div>
    `).join('');
  }

  // --- GAME LOOP ---
  let lastTime = performance.now();
  function gameLoop(now) {
    const delta = (now - lastTime) / 1000;
    lastTime = now;

    const kps = getKps();
    if (kps > 0) {
      const added = kps * delta;
      state.knowledge += added;
      state.totalKnowledge += added;
      updateDisplay();
    }

    // Smooth upright orbit movement (360 deg every 65s), pauses on hover
    if (!isOrbitHovered && activeOrbitBadges.length > 0) {
      orbitAngle += (2 * Math.PI / 65) * delta;
      updateOrbitPositions();
    }

    requestAnimationFrame(gameLoop);
  }

  // --- CYCLIC FLAVOR TEXT ---
  let quoteIndex = 0;
  setInterval(() => {
    quoteIndex = (quoteIndex + 1) % FLAVOR_QUOTES.length;
    flavorText.textContent = FLAVOR_QUOTES[quoteIndex];
  }, 12000);

  // --- EVENT LISTENERS ---
  audioToggleBtn.addEventListener('click', () => {
    sfx.enabled = !sfx.enabled;
    audioIcon.textContent = sfx.enabled ? '🔊' : '🔇';
  });

  resetGameBtn.addEventListener('click', resetGame);

  statsModalBtn.addEventListener('click', () => {
    updateStatsModal();
    statsModal.classList.remove('hidden');
  });

  closeStatsBtn.addEventListener('click', () => {
    statsModal.classList.add('hidden');
  });

  statsModal.addEventListener('click', (e) => {
    if (e.target === statsModal) statsModal.classList.add('hidden');
  });

  // Autosave interval
  setInterval(saveGame, 5000);
  window.addEventListener('beforeunload', saveGame);

  // --- INITIALIZATION ---
  loadGame();
  renderBuildings();
  renderUpgrades();
  renderOrbitIndicators();
  updateDisplay();
  requestAnimationFrame(gameLoop);
})();
