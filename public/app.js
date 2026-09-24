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

    playFail() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.linearRampToValueAtTime(180, now + 0.25);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    }
  }

  const sfx = new SoundFX();

  // --- GAME DEFINITIONS ---
  const BUILDINGS_DEF = [
    {
      id: 'coffee',
      tier: 1,
      name: 'Brody Café Drip Coffee',
      desc: 'Keeps your eyes open during morning 8 AM lectures.',
      baseCost: 20,
      baseKps: 0.4,
      icon: '☕'
    },
    {
      id: 'flashcards',
      tier: 1,
      name: 'Anki Flashcard Deck',
      desc: 'Spaced repetition algorithms maximize memory retention.',
      baseCost: 140,
      baseKps: 3,
      icon: '📇'
    },
    {
      id: 'ta',
      tier: 2,
      name: 'TA Office Hours',
      desc: 'Get unblocked on that brutal organic chemistry problem set.',
      baseCost: 1500,
      baseKps: 22,
      icon: '🧑‍🏫'
    },
    {
      id: 'studyGroup',
      tier: 2,
      name: 'Brody Atrium Study Group',
      desc: 'Collaborative all-nighters fueled by energy drinks and shared panic.',
      baseCost: 16000,
      baseKps: 175,
      icon: '👥'
    },
    {
      id: 'stacks',
      tier: 3,
      name: 'MSE Stacks Deep Dive',
      desc: 'Silence so absolute on B-Level that learning happens by osmosis.',
      baseCost: 180000,
      baseKps: 950,
      icon: '📚'
    },
    {
      id: 'gilman',
      tier: 3,
      name: 'Gilman Bell Tower Focus',
      desc: 'The historic chime of Gilman inspires peak academic performance.',
      baseCost: 2000000,
      baseKps: 5000,
      icon: '🏛️'
    },
    {
      id: 'lab',
      tier: 3,
      name: 'Bloomberg Lab Grant',
      desc: 'State-of-the-art public health laboratory infrastructure.',
      baseCost: 28000000,
      baseKps: 28000,
      icon: '🔬'
    },
    {
      id: 'laureate',
      tier: 3,
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
      tier: 1,
      name: 'PaperMate InkJoy Gel Pens',
      desc: 'Silky-smooth 0.7mm gel ink. Double your clicking knowledge.',
      cost: 150,
      icon: '🖊️',
      effect: (state) => { state.clickMultiplier *= 2; }
    },
    {
      id: 'highlighters',
      tier: 1,
      name: 'Color Highlighters',
      desc: 'Neon visual clarity. Double your clicking knowledge.',
      cost: 800,
      icon: '🖍️',
      effect: (state) => { state.clickMultiplier *= 2; }
    },
    {
      id: 'birdInHand',
      tier: 1,
      name: 'Bird in Hand Espresso',
      desc: 'Boosts Brody Café output by 2x.',
      cost: 2200,
      icon: '⚡',
      effect: (state) => { state.buildingMultipliers['coffee'] = (state.buildingMultipliers['coffee'] || 1) * 2; }
    },
    {
      id: 'ffc',
      tier: 2,
      name: 'FFC Unlimited Swipes',
      desc: 'Fresh Food Cafe endless pasta and waffle bar powers late night cramming. +50% total KPS.',
      cost: 6000,
      icon: '🥗',
      effect: (state) => { state.kpsMultiplier *= 1.5; }
    },
    {
      id: 'ergonomicChair',
      tier: 2,
      name: 'Brody Pod Chair',
      desc: 'Comfortable focus. Double your clicking knowledge.',
      cost: 12000,
      icon: '🪑',
      effect: (state) => { state.clickMultiplier *= 2; }
    },
    {
      id: 'levering',
      tier: 2,
      name: 'Levering Peach Tea Rush',
      desc: 'A cold peach tea from Levering Lounge keeps the mind sharp. Double your clicking knowledge.',
      cost: 25000,
      icon: '🍑',
      effect: (state) => { state.clickMultiplier *= 2; }
    },
    {
      id: 'crabSpirit',
      tier: 2,
      name: 'Maryland Crab Spirit',
      desc: 'Pure Baltimore energy. Double clicking knowledge.',
      cost: 60000,
      icon: '🦀',
      effect: (state) => { state.clickMultiplier *= 2; }
    },
    {
      id: 'stuce',
      tier: 3,
      name: 'Stuce Midnight Hangout',
      desc: 'Decompress and collaborate with friends at the Student Center. Multiplies total KPS by 2x.',
      cost: 150000,
      icon: '🏢',
      effect: (state) => { state.kpsMultiplier *= 2; }
    },
    {
      id: 'laxStick',
      tier: 3,
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

  // --- STATE TEMPLATE ---
  function createFreshGameState() {
    const s = {
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
    BUILDINGS_DEF.forEach(b => {
      s.buildings[b.id] = 0;
      s.buildingMultipliers[b.id] = 1;
    });
    return s;
  }

  let state = createFreshGameState();

  // --- STUDY SESSIONS STORAGE ---
  const SESSIONS_STORAGE_KEY = 'jhu_cram_sessions_list_v2';
  const ACTIVE_SESSION_KEY = 'jhu_cram_active_session_id_v2';

  let sessions = [];
  let currentSession = null;

  function saveCurrentSession() {
    if (!currentSession) return;
    currentSession.lastPlayed = Date.now();
    currentSession.state = JSON.parse(JSON.stringify(state));

    const idx = sessions.findIndex(s => s.id === currentSession.id);
    if (idx !== -1) {
      sessions[idx] = currentSession;
    } else {
      sessions.unshift(currentSession);
    }

    try {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
      localStorage.setItem(ACTIVE_SESSION_KEY, currentSession.id);
    } catch (e) {
      console.warn('Failed to save sessions:', e);
    }
  }

  function loadSessions() {
    try {
      const raw = localStorage.getItem(SESSIONS_STORAGE_KEY);
      sessions = raw ? JSON.parse(raw) : [];
    } catch (e) {
      sessions = [];
    }

    const activeId = localStorage.getItem(ACTIVE_SESSION_KEY);
    let sessionToLoad = null;

    if (activeId && sessions.length > 0) {
      sessionToLoad = sessions.find(s => s.id === activeId);
    }

    if (!sessionToLoad && sessions.length > 0) {
      sessionToLoad = sessions[0];
    }

    if (sessionToLoad) {
      loadSession(sessionToLoad);
    } else {
      // First time user with zero sessions: Open topics modal with empty state!
      renderBuildings();
      renderUpgrades();
      renderOrbitIndicators();
      updateDisplay();
      openTopicsModal(true);
    }
  }

  function loadSession(session) {
    currentSession = session;
    if (!Array.isArray(currentSession.askedQuestions)) {
      currentSession.askedQuestions = [];
    }
    state = JSON.parse(JSON.stringify(session.state));

    // Ensure all building keys exist
    BUILDINGS_DEF.forEach(b => {
      if (typeof state.buildings[b.id] !== 'number') state.buildings[b.id] = 0;
      if (typeof state.buildingMultipliers[b.id] !== 'number') state.buildingMultipliers[b.id] = 1;
    });

    // Re-apply upgrade effects from scratch
    state.clickMultiplier = 1;
    state.kpsMultiplier = 1;
    BUILDINGS_DEF.forEach(b => {
      state.buildingMultipliers[b.id] = 1;
    });
    (state.upgradesPurchased || []).forEach(upgId => {
      const upg = UPGRADES_DEF.find(u => u.id === upgId);
      if (upg) upg.effect(state);
    });

    // Update active topic badge in top-nav
    if (currentTopicDisplay) {
      currentTopicDisplay.textContent = session.topicName;
    }

    closeTopicsModal();
    if (typeof closeTopicPopup === 'function') closeTopicPopup();
    renderBuildings();
    renderUpgrades();
    renderOrbitIndicators();
    updateDisplay();
    saveCurrentSession();
  }

  function deleteSession(sessionId, e) {
    if (e) e.stopPropagation();
    const sessionToDelete = sessions.find(s => s.id === sessionId);
    if (!sessionToDelete) return;

    if (confirm(`Are you sure you want to delete the study session for "${sessionToDelete.topicName}"?`)) {
      sessions = sessions.filter(s => s.id !== sessionId);
      try {
        localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
      } catch (err) {}

      if (currentSession && currentSession.id === sessionId) {
        if (sessions.length > 0) {
          loadSession(sessions[0]);
        } else {
          currentSession = null;
          state = createFreshGameState();
          if (currentTopicDisplay) currentTopicDisplay.textContent = 'No Topic Selected';
          if (typeof closeTopicPopup === 'function') closeTopicPopup();
          updateDisplay();
          renderBuildings();
          renderUpgrades();
          renderOrbitIndicators();
          openTopicsModal(true);
        }
      } else {
        renderTopicsList();
        if (typeof renderTopicPopupMenu === 'function') renderTopicPopupMenu();
      }
    }
  }

  // --- HELPERS ---
  function formatNumber(num) {
    if (num < 1000) return num.toLocaleString('en-US', { maximumFractionDigits: 1 });
    const suffixes = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx'];
    const i = Math.floor(Math.log10(num) / 3);
    const formatted = (num / Math.pow(10, i * 3)).toFixed(2);
    return `${formatted} ${suffixes[i] || ''}`;
  }

  function getBuildingCost(buildingDef, currentCount) {
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

  // Topic & Session DOM
  const currentTopicDisplay = document.getElementById('currentTopicDisplay');
  const switchTopicBtn = document.getElementById('switchTopicBtn');
  const activeTopicBadge = document.getElementById('activeTopicBadge');
  const topicSwitcherContainer = document.getElementById('topicSwitcherContainer');
  const topicPopupMenu = document.getElementById('topicPopupMenu');
  const popupSessionsList = document.getElementById('popupSessionsList');
  const popupSessionCountBadge = document.getElementById('popupSessionCountBadge');
  const popupNewTopicBtn = document.getElementById('popupNewTopicBtn');
  const topicsModal = document.getElementById('topicsModal');
  const closeTopicsBtn = document.getElementById('closeTopicsBtn');
  const topicsListView = document.getElementById('topicsListView');
  const topicsEmptyState = document.getElementById('topicsEmptyState');
  const topicsPopulatedState = document.getElementById('topicsPopulatedState');
  const sessionsGrid = document.getElementById('sessionsGrid');
  const newTopicFromEmptyBtn = document.getElementById('newTopicFromEmptyBtn');
  const newTopicBtn = document.getElementById('newTopicBtn');
  const topicCreateView = document.getElementById('topicCreateView');
  const createTopicForm = document.getElementById('createTopicForm');
  const topicNameInput = document.getElementById('topicNameInput');
  const topicScopeInput = document.getElementById('topicScopeInput');
  const topicDifficultyInput = document.getElementById('topicDifficultyInput');
  const cancelCreateTopicBtn = document.getElementById('cancelCreateTopicBtn');
  const topicsSessionCountBadge = document.getElementById('topicsSessionCountBadge');

  // Quiz Checkpoint DOM
  const quizModal = document.getElementById('quizModal');
  const closeQuizBtn = document.getElementById('closeQuizBtn');
  const quizTierBadge = document.getElementById('quizTierBadge');
  const quizTargetLabel = document.getElementById('quizTargetLabel');
  const quizUpgradeIcon = document.getElementById('quizUpgradeIcon');
  const quizUpgradeTitle = document.getElementById('quizUpgradeTitle');
  const quizUpgradeCost = document.getElementById('quizUpgradeCost');
  const quizTopicName = document.getElementById('quizTopicName');
  const quizScopeText = document.getElementById('quizScopeText');
  const quizLoading = document.getElementById('quizLoading');
  const quizQuestionContent = document.getElementById('quizQuestionContent');
  const quizQuestionPrompt = document.getElementById('quizQuestionPrompt');
  const quizOptionsGrid = document.getElementById('quizOptionsGrid');
  const quizFeedbackBox = document.getElementById('quizFeedbackBox');
  const feedbackIcon = document.getElementById('feedbackIcon');
  const feedbackTitle = document.getElementById('feedbackTitle');
  const feedbackExplanation = document.getElementById('feedbackExplanation');
  const quizActionBtn = document.getElementById('quizActionBtn');

  // Stats DOM
  const statTotalEarned = document.getElementById('statTotalEarned');
  const statTotalClicks = document.getElementById('statTotalClicks');
  const statTimePlayed = document.getElementById('statTimePlayed');
  const statHelpersOwned = document.getElementById('statHelpersOwned');
  const achievementsList = document.getElementById('achievementsList');

  // --- TOPIC POP-UP DROPDOWN MENU ---
  function toggleTopicPopup(force) {
    if (!topicPopupMenu) return;
    const isClosed = topicPopupMenu.classList.contains('hidden');
    const shouldOpen = typeof force === 'boolean' ? force : isClosed;

    if (shouldOpen) {
      renderTopicPopupMenu();
      topicPopupMenu.classList.remove('hidden');
      topicSwitcherContainer?.classList.add('open');
      if (switchTopicBtn) switchTopicBtn.setAttribute('aria-expanded', 'true');
    } else {
      closeTopicPopup();
    }
  }

  function closeTopicPopup() {
    if (!topicPopupMenu) return;
    topicPopupMenu.classList.add('hidden');
    topicSwitcherContainer?.classList.remove('open');
    if (switchTopicBtn) switchTopicBtn.setAttribute('aria-expanded', 'false');
  }

  function renderTopicPopupMenu() {
    if (!popupSessionsList) return;
    popupSessionCountBadge.textContent = `${sessions.length} Topic${sessions.length === 1 ? '' : 's'}`;
    popupSessionsList.innerHTML = '';

    if (sessions.length === 0) {
      popupSessionsList.innerHTML = `
        <div class="popup-empty">
          <p>No past study topics found.</p>
        </div>
      `;
      return;
    }

    sessions.forEach(sess => {
      const isActive = currentSession && currentSession.id === sess.id;
      const totalKnowledge = Math.floor(sess.state?.totalKnowledge || 0);
      const upgradesCount = (sess.state?.upgradesPurchased || []).length;
      const helpersCount = Object.values(sess.state?.buildings || {}).reduce((a, b) => a + b, 0);

      const item = document.createElement('div');
      item.className = `popup-item ${isActive ? 'active' : ''}`;
      item.innerHTML = `
        <div class="popup-item-info">
          <div class="popup-item-name-row">
            <span class="popup-item-name" title="${sess.topicName}">${sess.topicName}</span>
            ${isActive ? '<span class="active-pill">Active</span>' : ''}
          </div>
          <div class="popup-item-scope" title="${sess.scope}">🎯 ${sess.scope}</div>
          <div class="popup-item-meta">
            <span>⚡ ${formatNumber(totalKnowledge)}</span>
            <span>🧩 ${upgradesCount}/9 upgrades</span>
            <span>🏛️ ${helpersCount} aids</span>
          </div>
        </div>
        <button class="popup-item-del-btn" title="Delete Session" type="button">🗑️</button>
      `;

      item.addEventListener('click', (e) => {
        if (e.target.closest('.popup-item-del-btn')) return;
        loadSession(sess);
        closeTopicPopup();
      });

      item.querySelector('.popup-item-del-btn').addEventListener('click', (e) => {
        deleteSession(sess.id, e);
      });

      popupSessionsList.appendChild(item);
    });
  }

  // --- TOPICS & SESSIONS MODAL LOGIC ---
  function openTopicsModal(isFirstTime = false) {
    closeTopicPopup();
    topicsModal.classList.remove('hidden');
    topicsSessionCountBadge.textContent = `${sessions.length} Session${sessions.length === 1 ? '' : 's'}`;

    if (isFirstTime && sessions.length === 0) {
      closeTopicsBtn.style.display = 'none'; // Must create topic first
    } else {
      closeTopicsBtn.style.display = 'block';
    }

    showTopicsList();
  }

  function closeTopicsModal() {
    if (sessions.length === 0 && !currentSession) return; // Prevent closing if no topic set
    topicsModal.classList.add('hidden');
  }

  function showTopicsList() {
    topicsListView.classList.remove('hidden');
    topicCreateView.classList.add('hidden');
    renderTopicsList();
  }

  function showCreateTopicForm() {
    topicsListView.classList.add('hidden');
    topicCreateView.classList.remove('hidden');
    topicNameInput.value = '';
    topicScopeInput.value = '';
    topicDifficultyInput.value = '';
    topicNameInput.focus();
  }

  function renderTopicsList() {
    topicsSessionCountBadge.textContent = `${sessions.length} Session${sessions.length === 1 ? '' : 's'}`;

    if (sessions.length === 0) {
      topicsEmptyState.classList.remove('hidden');
      topicsPopulatedState.classList.add('hidden');
    } else {
      topicsEmptyState.classList.add('hidden');
      topicsPopulatedState.classList.remove('hidden');
      sessionsGrid.innerHTML = '';

      sessions.forEach(sess => {
        const isActive = currentSession && currentSession.id === sess.id;
        const totalKnowledge = Math.floor(sess.state?.totalKnowledge || 0);
        const helpersCount = Object.values(sess.state?.buildings || {}).reduce((a, b) => a + b, 0);
        const upgradesCount = (sess.state?.upgradesPurchased || []).length;
        const dateStr = new Date(sess.lastPlayed || sess.created).toLocaleDateString();

        const card = document.createElement('div');
        card.className = `session-card ${isActive ? 'active-session' : ''}`;

        card.innerHTML = `
          <div class="session-card-info">
            <div class="session-card-title">
              <span>${sess.topicName}</span>
              ${isActive ? '<span class="active-pill">Active</span>' : ''}
            </div>
            <div class="session-card-scope" title="${sess.scope}">
              🎯 ${sess.scope}
            </div>
            <div class="session-card-meta">
              <span>⚡ ${formatNumber(totalKnowledge)} knowledge</span>
              <span>🧩 ${upgradesCount}/9 upgrades</span>
              <span>🏛️ ${helpersCount} study aids</span>
              <span>📅 ${dateStr}</span>
            </div>
          </div>
          <div class="session-card-actions">
            <button class="btn btn-primary btn-sm resume-btn">
              ${isActive ? 'Continue' : 'Resume'}
            </button>
            <button class="btn-icon-danger delete-btn" title="Delete Session">🗑️</button>
          </div>
        `;

        card.querySelector('.resume-btn').addEventListener('click', () => loadSession(sess));
        card.querySelector('.delete-btn').addEventListener('click', (e) => deleteSession(sess.id, e));
        sessionsGrid.appendChild(card);
      });
    }
  }

  newTopicFromEmptyBtn.addEventListener('click', showCreateTopicForm);
  newTopicBtn.addEventListener('click', showCreateTopicForm);
  cancelCreateTopicBtn.addEventListener('click', () => {
    if (currentSession) {
      closeTopicsModal();
    } else {
      showTopicsList();
    }
  });

  createTopicForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const topicName = topicNameInput.value.trim();
    const scope = topicScopeInput.value.trim();
    const difficultyBounds = topicDifficultyInput.value.trim();

    if (!topicName || !scope || !difficultyBounds) return;

    const newSession = {
      id: 'session_' + Date.now(),
      topicName,
      scope,
      difficultyBounds,
      askedQuestions: [],
      created: Date.now(),
      lastPlayed: Date.now(),
      state: createFreshGameState()
    };

    sessions.unshift(newSession);
    loadSession(newSession);
    closeTopicPopup();
  });

  switchTopicBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleTopicPopup();
  });

  if (activeTopicBadge) {
    activeTopicBadge.addEventListener('click', (e) => {
      if (e.target.closest('#switchTopicBtn')) return;
      toggleTopicPopup();
    });
  }

  popupNewTopicBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeTopicPopup();
    openTopicsModal(false);
    showCreateTopicForm();
  });

  closeTopicsBtn.addEventListener('click', closeTopicsModal);

  topicsModal.addEventListener('click', (e) => {
    if (e.target === topicsModal && currentSession) {
      closeTopicsModal();
    }
  });

  // Close popup menu on outside click
  document.addEventListener('click', (e) => {
    if (topicSwitcherContainer && !topicSwitcherContainer.contains(e.target)) {
      closeTopicPopup();
    }
  });

  // Close popup menu on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeTopicPopup();
    }
  });

  // --- EXAM CHECKPOINT QUIZ GATE (AUTOCLICKERS & UPGRADES) ---
  let pendingItem = null;
  let currentQuestion = null;

  async function openQuizGate(item) {
    pendingItem = item;
    currentQuestion = null;

    quizModal.classList.remove('hidden');
    quizUpgradeIcon.textContent = item.def.icon;
    quizUpgradeTitle.textContent = item.def.name;
    quizUpgradeCost.textContent = `Cost: ${formatNumber(item.cost)} knowledge`;
    if (quizTargetLabel) {
      quizTargetLabel.textContent = item.type === 'upgrade' ? 'UNLOCKING STUDY UPGRADE' : 'ACQUIRING STUDY AID';
    }

    const tier = item.def.tier || item.tier || 1;
    quizTierBadge.className = `quiz-tier-badge tier-${tier}`;
    quizTierBadge.textContent = tier === 1 ? 'Tier 1: Fundamentals' : tier === 2 ? 'Tier 2: Application' : 'Tier 3: Mastery';

    quizTopicName.textContent = currentSession ? currentSession.topicName : 'General Study';
    quizScopeText.textContent = currentSession ? currentSession.scope : 'General curriculum';

    // Reset action button & feedback state
    quizActionBtn.textContent = 'Continue';
    quizActionBtn.onclick = null;
    quizQuestionPrompt.textContent = '';
    quizOptionsGrid.innerHTML = '';
    feedbackTitle.textContent = '';
    feedbackExplanation.textContent = '';
    feedbackIcon.textContent = '';
    quizFeedbackBox.className = 'quiz-feedback-box hidden';
    quizFeedbackBox.classList.add('hidden');
    quizQuestionContent.classList.add('hidden');
    quizLoading.classList.remove('hidden');

    try {
      const prevAsked = Array.isArray(currentSession?.askedQuestions) ? currentSession.askedQuestions : [];
      const res = await fetch('/api/generate-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicName: currentSession?.topicName || 'Academic Subject',
          scope: currentSession?.scope || 'Core concepts',
          difficultyBounds: currentSession?.difficultyBounds || 'College undergraduate',
          tier: tier,
          upgradeName: item.def.name,
          previousQuestions: prevAsked.slice(-10)
        })
      });

      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      currentQuestion = data;
      if (currentSession && data.question) {
        if (!Array.isArray(currentSession.askedQuestions)) currentSession.askedQuestions = [];
        if (!currentSession.askedQuestions.includes(data.question)) {
          currentSession.askedQuestions.push(data.question);
          if (currentSession.askedQuestions.length > 25) currentSession.askedQuestions.shift();
          saveCurrentSession();
        }
      }
      renderQuizQuestion(data);
    } catch (err) {
      console.warn('Question API failed, using fallback question:', err);
      const fallback = {
        question: `Exam Checkpoint for ${currentSession?.topicName || 'your topic'}: Which method most effectively solidifies your understanding of ${currentSession?.scope?.slice(0, 35) || 'key topics'}?`,
        options: [
          'Active recall and solving representative mechanism problems',
          'Passively re-reading textbook chapters without notes',
          'Memorizing raw answer keys without understanding concepts',
          'Skipping practice questions until the final exam'
        ],
        correctIndex: 0,
        explanation: 'Active recall and conceptual problem solving systematically strengthen synaptic pathways and ensure exam readiness.'
      };
      currentQuestion = fallback;
      renderQuizQuestion(fallback);
    }
  }

  function renderQuizQuestion(data) {
    quizLoading.classList.add('hidden');
    quizFeedbackBox.className = 'quiz-feedback-box hidden';
    quizFeedbackBox.classList.add('hidden');
    quizQuestionContent.classList.remove('hidden');

    quizQuestionPrompt.textContent = data.question;
    quizOptionsGrid.innerHTML = '';

    data.options.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-option-btn';

      const letterSpan = document.createElement('span');
      letterSpan.className = 'option-letter';
      letterSpan.textContent = String.fromCharCode(65 + idx);

      const textSpan = document.createElement('span');
      textSpan.className = 'option-text';
      textSpan.textContent = opt;

      btn.appendChild(letterSpan);
      btn.appendChild(textSpan);
      btn.addEventListener('click', () => handleQuizAnswer(idx, data));
      quizOptionsGrid.appendChild(btn);
    });
  }

  function handleQuizAnswer(selectedIdx, data) {
    const isCorrect = selectedIdx === data.correctIndex;
    const optionBtns = quizOptionsGrid.querySelectorAll('.quiz-option-btn');

    optionBtns.forEach((btn, idx) => {
      btn.disabled = true;
      if (idx === data.correctIndex) {
        btn.classList.add('selected-correct');
      } else if (idx === selectedIdx && !isCorrect) {
        btn.classList.add('selected-incorrect');
      }
    });

    quizFeedbackBox.classList.remove('hidden');

    if (isCorrect) {
      sfx.playBuy();
      quizFeedbackBox.className = 'quiz-feedback-box feedback-success';
      feedbackIcon.textContent = '🎉';
      feedbackTitle.textContent = 'Checkpoint Passed! Correct!';
      feedbackExplanation.textContent = data.explanation || 'Great job! Your knowledge unlocked this academic aid.';
      quizActionBtn.textContent = pendingItem
        ? (pendingItem.type === 'upgrade' ? `Unlock ${pendingItem.def.name}` : `Claim ${pendingItem.def.name}`)
        : 'Claim Item';

      quizActionBtn.onclick = () => {
        if (!pendingItem) return;

        if (pendingItem.type === 'building') {
          const b = pendingItem.def;
          const count = state.buildings[b.id] || 0;
          if (state.knowledge >= pendingItem.cost) {
            state.knowledge -= pendingItem.cost;
          }
          state.buildings[b.id] = count + 1;
        } else if (pendingItem.type === 'upgrade') {
          const upg = pendingItem.def;
          if (state.knowledge >= pendingItem.cost) {
            state.knowledge -= pendingItem.cost;
            if (!state.upgradesPurchased.includes(upg.id)) {
              state.upgradesPurchased.push(upg.id);
              upg.effect(state);
            }
          }
        }

        sfx.playBuy();
        closeQuizGateModal();
        updateDisplay();
        renderUpgrades();
        renderBuildings();
        renderOrbitIndicators();
        saveCurrentSession();
      };
    } else {
      sfx.playFail();
      quizFeedbackBox.className = 'quiz-feedback-box feedback-error';
      feedbackIcon.textContent = '❌';
      feedbackTitle.textContent = 'Not Quite. Knowledge Retained.';
      feedbackExplanation.textContent = `${data.explanation || 'Review this concept in your notes.'} Keep cramming knowledge and retry!`;
      quizActionBtn.textContent = 'Review & Close';

      quizActionBtn.onclick = () => {
        closeQuizGateModal();
      };
    }
  }

  function closeQuizGateModal() {
    quizModal.classList.add('hidden');
    quizFeedbackBox.className = 'quiz-feedback-box hidden';
    quizFeedbackBox.classList.add('hidden');
    quizQuestionContent.classList.add('hidden');
    quizLoading.classList.remove('hidden');
    quizQuestionPrompt.textContent = '';
    quizOptionsGrid.innerHTML = '';
    feedbackTitle.textContent = '';
    feedbackExplanation.textContent = '';
    feedbackIcon.textContent = '';
    pendingItem = null;
    currentQuestion = null;
    if (quizActionBtn) {
      quizActionBtn.textContent = 'Continue';
      quizActionBtn.onclick = null;
    }
  }

  closeQuizBtn.addEventListener('click', closeQuizGateModal);
  quizModal.addEventListener('click', (e) => {
    if (e.target === quizModal) closeQuizGateModal();
  });

  // --- FLOATING CLICK EFFECT ---
  function spawnFloatingNumber(x, y, value) {
    const el = document.createElement('div');
    el.className = 'float-number';
    el.textContent = `+${formatNumber(value)}`;

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

  function showToastHint(msg) {
    let toast = document.getElementById('gameToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'gameToast';
      toast.className = 'game-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.remove('hidden', 'show');
    void toast.offsetWidth;
    toast.classList.add('show');
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 3200);
  }

  function buyBuilding(b) {
    const count = state.buildings[b.id] || 0;
    const cost = getBuildingCost(b, count);

    if (state.knowledge < cost) {
      showToastHint(`You need ${formatNumber(cost)} knowledge to take the checkpoint for ${b.name}! (You have ${formatNumber(Math.floor(state.knowledge))})`);
      const card = document.getElementById(`building-${b.id}`);
      if (card) {
        card.classList.remove('shake-card');
        void card.offsetWidth;
        card.classList.add('shake-card');
      }
      sfx.playFail();
      return;
    }

    // Trigger the Quiz Gate Checkpoint for this autoclicker!
    openQuizGate({
      type: 'building',
      def: b,
      cost: cost,
      tier: b.tier || 1
    });
  }

  function renderUpgrades() {
    upgradesShelf.innerHTML = '';
    UPGRADES_DEF.forEach(upg => {
      const isPurchased = (state.upgradesPurchased || []).includes(upg.id);
      if (isPurchased) return;

      const tier = upg.tier || 1;
      const tierLabel = tier === 1 ? 'Tier 1' : tier === 2 ? 'Tier 2' : 'Tier 3';
      const canAfford = state.knowledge >= upg.cost;

      const card = document.createElement('div');
      card.className = `upgrade-card tier-${tier} ${!canAfford ? 'cant-afford' : ''}`;
      card.id = `upgrade-${upg.id}`;
      card.title = `${upg.name} (${tierLabel} Exam Checkpoint)\nCost: ${formatNumber(upg.cost)} knowledge\n${upg.desc}\nClick to answer exam checkpoint question and unlock!`;

      card.innerHTML = `
        <span class="upg-icon">${upg.icon}</span>
        <span class="tier-indicator">T${tier}</span>
      `;

      card.addEventListener('click', () => buyUpgrade(upg));
      upgradesShelf.appendChild(card);
    });

    if (upgradesShelf.children.length === 0) {
      upgradesShelf.innerHTML = '<span style="font-size: 0.8rem; color: var(--text-dim); padding: 0.5rem;">All available study upgrades acquired!</span>';
    }
  }

  function buyUpgrade(upg) {
    if ((state.upgradesPurchased || []).includes(upg.id)) return;

    if (state.knowledge < upg.cost) {
      showToastHint(`You need ${formatNumber(upg.cost)} knowledge to take the checkpoint for ${upg.name}! (You have ${formatNumber(Math.floor(state.knowledge))})`);
      const card = document.getElementById(`upgrade-${upg.id}`);
      if (card) {
        card.classList.remove('shake-card');
        void card.offsetWidth;
        card.classList.add('shake-card');
      }
      sfx.playFail();
      return;
    }

    // Trigger the active Quiz Gate Checkpoint!
    openQuizGate({
      type: 'upgrade',
      def: upg,
      cost: upg.cost || 0,
      tier: upg.tier || 1
    });
  }

  // --- VISUAL UPGRADES & HELPERS ORBIT AROUND CLICKER ---
  let orbitAngle = 0;
  let isOrbitHovered = false;
  let activeOrbitBadges = [];

  function renderOrbitIndicators() {
    if (!upgradesOrbit) return;
    upgradesOrbit.innerHTML = '';
    activeOrbitBadges = [];

    const indicators = [];

    // Add purchased upgrades
    (state.upgradesPurchased || []).forEach(upgId => {
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

    UPGRADES_DEF.forEach(upg => {
      const el = document.getElementById(`upgrade-${upg.id}`);
      if (el) {
        if (state.knowledge < upg.cost) {
          el.classList.add('cant-afford');
        } else {
          el.classList.remove('cant-afford');
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

  resetGameBtn.addEventListener('click', () => {
    if (confirm('Reset knowledge and upgrades for this current study session?')) {
      state = createFreshGameState();
      updateDisplay();
      renderBuildings();
      renderUpgrades();
      renderOrbitIndicators();
      saveCurrentSession();
    }
  });

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
  setInterval(saveCurrentSession, 4000);
  window.addEventListener('beforeunload', saveCurrentSession);

  // --- INITIALIZATION ---
  loadSessions();
  requestAnimationFrame(gameLoop);
})();
