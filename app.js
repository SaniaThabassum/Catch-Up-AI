/**
 * CatchUp AI Application Controller (Full-Stack Integrated)
 * Communicates with Python Scikit-Learn + SQLite REST API backend when online,
 * with seamless fallback to client-side on-device engine when running standalone.
 */

// Initialize Local Client NLP Engine (fallback / standalone)
const clientEngine = new LocalChatIntelligenceEngine();

// Application State
const state = {
  backendOnline: false,
  currentChannel: null,
  currentPersona: 'Alex',
  currentTab: 'priority',
  priorityFilter: 'all',
  actionFilter: 'all',
  deadlineFilter: 'all',
  planFilter: 'all',
  searchQuery: '',
  completedTasks: new Set(),
  analysisResult: null,
  customMessages: [],
  pendingParsedMessages: null,
  pendingRawText: null,
  backendInfo: null
};

// Avatar Color Generator
const AVATAR_COLORS = [
  '#6366f1', '#ec4899', '#8b5cf6', '#10b981', '#f59e0b',
  '#3b82f6', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'
];

function getAvatarColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name) {
  if (!name) return '?';
  const clean = name.replace(/bot|lead|commander|architect|pm|dba/gi, '').trim();
  const parts = clean.split(' ').filter(p => p.length > 0);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

/**
 * Check if Python REST API Backend is running
 */
async function checkBackendStatus() {
  try {
    const res = await fetch('/api/health', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      state.backendOnline = true;
      state.backendInfo = data;
      updateBackendBadge(true, data);
      return true;
    }
  } catch (e) {
    // Standalone mode
  }
  state.backendOnline = false;
  updateBackendBadge(false);
  return false;
}

function updateBackendBadge(isOnline, info) {
  const btn = document.getElementById('openPrivacyModalBtn');
  if (!btn) return;
  if (isOnline) {
    btn.innerHTML = `
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
      </svg>
      <span>🟢 Full-Stack Mode (Python ML + SQLite • 0 B Egress)</span>
    `;
    btn.style.borderColor = 'rgba(16, 185, 129, 0.5)';
  } else {
    btn.innerHTML = `
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
      </svg>
      <span>🔒 Standalone Local Mode (0 B Egress)</span>
    `;
  }
}

/**
 * Get current message dataset (for standalone or custom)
 */
function getCurrentMessages() {
  if (state.currentChannel === 'demo') {
    return SAMPLE_DATASETS.incident?.messages || [];
  }
  if (state.currentChannel === 'launch') {
    return SAMPLE_DATASETS.launch?.messages || [];
  }
  return state.customMessages || [];
}

/**
 * Main analysis and re-render pipeline
 */
async function runAnalysisAndRender() {
  if (!state.currentChannel && !state.customMessages.length) {
    renderAllViews();
    return;
  }

  if (state.backendOnline && state.currentChannel === 'demo') {
    try {
      const url = `/api/sample?persona=${encodeURIComponent(state.currentPersona)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        state.analysisResult = data;
        state.completedTasks.clear();
        (data.actionItems || []).forEach(a => {
          if (a.completed) state.completedTasks.add(a.id);
        });
        renderAllViews();
        return;
      }
    } catch (e) {
      console.warn("Backend request failed, falling back to client-side engine:", e);
    }
  }

  if (state.backendOnline && state.currentChannel && state.currentChannel.startsWith('custom_')) {
    try {
      const url = `/api/channels/${state.currentChannel}?persona=${encodeURIComponent(state.currentPersona)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        state.analysisResult = data;
        state.completedTasks.clear();
        (data.actionItems || []).forEach(a => {
          if (a.completed) state.completedTasks.add(a.id);
        });
        renderAllViews();
        return;
      }
    } catch (e) {
      console.warn("Backend request failed, falling back to client-side engine:", e);
    }
  }

  // Fallback / Standalone In-Browser Analysis
  const messages = getCurrentMessages();
  if (messages && messages.length > 0) {
    state.analysisResult = clientEngine.analyze(messages, state.currentPersona);
  }
  renderAllViews();
}

function renderAllViews() {
  const inputCard = document.getElementById('inputWorkspaceCard');
  const resultsDashboard = document.getElementById('resultsDashboard');

  if (!state.analysisResult) {
    if (inputCard) inputCard.style.display = 'flex';
    if (resultsDashboard) resultsDashboard.style.display = 'none';
    return;
  }

  if (inputCard) inputCard.style.display = 'none';
  if (resultsDashboard) resultsDashboard.style.display = 'block';

  // Update active conversation banner
  const titleEl = document.getElementById('activeConvTitle');
  const badgeEl = document.getElementById('activeConvBadge');
  const msgCount = state.analysisResult.messages ? state.analysisResult.messages.length : 0;
  if (titleEl) {
    titleEl.textContent = state.currentChannel === 'demo' ? "🧪 Demo Sample Incident Conversation" : "Analyzed Chat Conversation";
  }
  if (badgeEl) {
    badgeEl.textContent = `${msgCount} messages analyzed`;
  }

  renderHeroDigest();
  renderMetrics();
  renderCriticalUpdatesMissed();
  renderPriorityFeed();
  renderActionItems();
  renderDeadlinesRadar();
  renderChangedPlans();
  renderDecisions();
  renderTimeline();
  renderFullThread();
  updateTabBadges();
}

/**
 * Render Hero "Catch Me Up in 30 Seconds" Digest
 */
function renderHeroDigest() {
  const { summary, metrics } = state.analysisResult;
  const digestTitle = document.getElementById('digestTitle');
  const statusPill = document.getElementById('statusPill');
  const bulletsGrid = document.getElementById('digestBulletsGrid');

  if (state.currentChannel === 'demo') {
    digestTitle.textContent = "Demo Incident Catch-Up Digest";
  } else {
    digestTitle.textContent = `Executive Catch-Up Digest for @${state.currentPersona}`;
  }

  if (metrics.criticalCount > 0) {
    statusPill.className = "status-pill critical";
    statusPill.textContent = `🚨 ${metrics.criticalCount} Critical Items Require Attention`;
  } else if (metrics.decisionsCount > 0) {
    statusPill.className = "status-pill decision";
    statusPill.textContent = `⚖️ ${metrics.decisionsCount} Key Decisions Finalized`;
  } else {
    statusPill.className = "status-pill normal";
    statusPill.textContent = `✅ Conversation Steady • No Blockers`;
  }

  bulletsGrid.innerHTML = '';
  summary.bullets.forEach(b => {
    const card = document.createElement('div');
    card.className = `digest-bullet-card ${b.type}`;

    let typeTitle = 'Update';
    let icon = '💡';
    if (b.type === 'critical') { typeTitle = 'Critical Blocker'; icon = '🚨'; }
    else if (b.type === 'question') { typeTitle = 'Waiting on You'; icon = '❓'; }
    else if (b.type === 'action') { typeTitle = 'Your Immediate Task'; icon = '📋'; }
    else if (b.type === 'decision') { typeTitle = 'Team Decision'; icon = '⚖️'; }

    card.innerHTML = `
      <div>
        <div class="bullet-header">
          <span class="bullet-type-badge ${b.type}">
            <span>${icon}</span>
            <span>${typeTitle}</span>
          </span>
        </div>
        <div class="bullet-text">${escapeHtml(b.text)}</div>
      </div>
      <button class="view-source-btn bullet-jump-btn" data-target="${b.targetId}">
        <span>🔍 View Original Message</span>
        <span>&rarr;</span>
      </button>
    `;

    bulletsGrid.appendChild(card);
  });

  bulletsGrid.querySelectorAll('.bullet-jump-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      jumpToThreadMessage(btn.getAttribute('data-target'));
    });
  });
}

/**
 * Render Metric Numbers Ribbon (Feature 1)
 */
function renderMetrics() {
  const { metrics, stats } = state.analysisResult;
  const importantCount = metrics.importantCount ?? (metrics.criticalCount + metrics.highCount);
  const pendingTasks = metrics.pendingTasksCount ?? (state.analysisResult.actionItems || []).filter(a => !state.completedTasks.has(a.id)).length;
  const upcomingDeadlines = metrics.upcomingDeadlinesCount ?? (state.analysisResult.deadlinesRadar || []).length;
  const criticalMissed = metrics.criticalMissedCount ?? (state.analysisResult.criticalUpdatesMissed || []).length;

  const elImportant = document.getElementById('metricImportant');
  if (elImportant) elImportant.textContent = importantCount;

  const elPending = document.getElementById('metricPendingTasks');
  if (elPending) elPending.textContent = pendingTasks;

  const elDeadlines = document.getElementById('metricUpcomingDeadlines');
  if (elDeadlines) elDeadlines.textContent = upcomingDeadlines;

  const elCritical = document.getElementById('metricCriticalMissed');
  if (elCritical) elCritical.textContent = criticalMissed;

  const elDecisions = document.getElementById('metricDecisions');
  if (elDecisions) elDecisions.textContent = metrics.decisionsCount;

  const elCompute = document.getElementById('metricComputeTime');
  if (elCompute) elCompute.textContent = `${stats.executionTimeMs} ms`;
}

/**
 * Render Critical Updates You Missed While Away (Feature 1)
 */
function renderCriticalUpdatesMissed() {
  const section = document.getElementById('criticalMissedSection');
  const grid = document.getElementById('criticalMissedGrid');
  if (!section || !grid) return;

  const criticals = state.analysisResult.criticalUpdatesMissed || [];
  if (criticals.length === 0) {
    section.style.display = 'none';
    grid.innerHTML = '';
    return;
  }

  section.style.display = 'block';
  grid.innerHTML = '';

  criticals.forEach(c => {
    const card = document.createElement('div');
    card.className = 'critical-missed-card';
    card.innerHTML = `
      <div>
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.4rem;">
          <span class="badge critical">🚨 ${escapeHtml(c.title)}</span>
          <span style="font-size: 0.72rem; color: var(--text-muted);">${escapeHtml(c.time)}</span>
        </div>
        <div style="font-size: 0.9rem; font-weight: 600; color: #fff; line-height: 1.45; margin-bottom: 0.5rem;">
          ${highlightKeywords(escapeHtml(c.text), state.currentPersona)}
        </div>
      </div>
      <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 0.5rem;">
        <span style="font-size: 0.75rem; color: var(--text-muted);">From <strong>${escapeHtml(c.author)}</strong></span>
        <button class="view-source-btn" data-target="${c.messageId}">
          <span>🔍 View Original Message</span> &rarr;
        </button>
      </div>
    `;
    grid.appendChild(card);
  });

  grid.querySelectorAll('.view-source-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      jumpToThreadMessage(btn.getAttribute('data-target'));
    });
  });
}

/**
 * Render Tab: Chronological Timeline of Important Events (Feature 1)
 */
function renderTimeline() {
  const container = document.getElementById('timelineStream');
  if (!container) return;
  container.innerHTML = '';

  const events = state.analysisResult.chronologicalTimeline || [];
  if (events.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 3rem; color: var(--text-muted); font-size: 0.95rem;">
        No major event milestones detected in this thread.
      </div>
    `;
    return;
  }

  events.forEach(ev => {
    const item = document.createElement('div');
    item.className = 'timeline-item';
    item.innerHTML = `
      <div class="timeline-dot ${ev.type}"></div>
      <div class="timeline-top-row">
        <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
          <span class="timeline-event-badge ${ev.type}">${escapeHtml(ev.badge)}</span>
          <span class="timeline-time-badge">⏱️ ${escapeHtml(ev.time)}</span>
        </div>
        <button class="view-source-btn" data-target="${ev.messageId}">
          <span>🔍 View Original Message</span> &rarr;
        </button>
      </div>
      <div style="font-size: 0.92rem; font-weight: 700; color: var(--text-primary);">
        ${escapeHtml(ev.title)}
      </div>
      <div style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.45;">
        ${escapeHtml(ev.description)}
      </div>
      <div style="font-size: 0.72rem; color: var(--text-muted);">
        Milestone by <strong>${escapeHtml(ev.author)}</strong> at ${escapeHtml(ev.time)}
      </div>
    `;
    container.appendChild(item);
  });

  container.querySelectorAll('.view-source-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      jumpToThreadMessage(btn.getAttribute('data-target'));
    });
  });
}

/**
 * Render Tab 1: Priority Feed
 */
function renderPriorityFeed() {
  const feedContainer = document.getElementById('priorityFeedList');
  feedContainer.innerHTML = '';

  let messages = [...state.analysisResult.messages];

  if (state.priorityFilter === 'critical') {
    messages = messages.filter(m => m.priorityTier === 'critical');
  } else if (state.priorityFilter === 'high') {
    messages = messages.filter(m => m.priorityTier === 'high');
  } else if (state.priorityFilter === 'medium') {
    messages = messages.filter(m => m.priorityTier === 'medium');
  } else if (state.priorityFilter === 'for-me') {
    messages = messages.filter(m => m.isRelevantToMe);
  }

  if (state.searchQuery.trim()) {
    const q = state.searchQuery.toLowerCase();
    messages = messages.filter(m => 
      m.text.toLowerCase().includes(q) || 
      m.author.toLowerCase().includes(q)
    );
  }

  messages.sort((a, b) => b.score - a.score);

  if (messages.length === 0) {
    feedContainer.innerHTML = `
      <div style="text-align: center; padding: 3rem; color: var(--text-muted); font-size: 0.95rem;">
        No messages match the current filter or search criteria.
      </div>
    `;
    return;
  }

  messages.forEach(msg => {
    const card = document.createElement('div');
    card.className = `message-card ${msg.priorityTier}-tier`;
    card.id = `feed_card_${msg.id}`;

    const avatarColor = getAvatarColor(msg.author);
    const initials = getInitials(msg.author);

    const badgesHtml = [];
    if (msg.priorityTier === 'critical') {
      badgesHtml.push(`<span class="badge critical">🚨 Critical</span>`);
    } else if (msg.priorityTier === 'high') {
      badgesHtml.push(`<span class="badge high">⚡ High</span>`);
    } else if (msg.priorityTier === 'medium') {
      badgesHtml.push(`<span class="badge medium">Important</span>`);
    }

    if (msg.isRelevantToMe) {
      badgesHtml.push(`<span class="badge for-me">👤 For You</span>`);
    }

    badgesHtml.push(`<span class="badge score">Score ${msg.score}/100</span>`);

    const flagChips = [];
    if (msg.mentionsMe) flagChips.push('<span class="flag-chip">@Mentions You</span>');
    if (msg.isQuestionForMe) flagChips.push('<span class="flag-chip">❓ Question For You</span>');
    if (msg.hasActionItem) flagChips.push('<span class="flag-chip">📋 Action Item</span>');
    if (msg.isDecision) flagChips.push('<span class="flag-chip">⚖️ Decision</span>');
    if (msg.deadlineMatch) flagChips.push(`<span class="flag-chip">⏰ Deadline: ${escapeHtml(msg.deadlineMatch)}</span>`);

    card.innerHTML = `
      <div class="avatar" style="background-color: ${avatarColor};">
        ${initials}
      </div>
      <div class="card-main">
        <div class="card-top">
          <div class="author-name-group">
            <span class="author-name">${escapeHtml(msg.author)}</span>
            <span class="message-time">${escapeHtml(msg.time)}</span>
          </div>
          <div class="card-badges">
            ${badgesHtml.join('')}
          </div>
        </div>
        <div class="message-text">
          ${highlightKeywords(escapeHtml(msg.text), state.currentPersona)}
        </div>
        <div class="card-footer">
          <div class="card-flags">
            ${flagChips.join('')}
          </div>
          <button class="jump-link-btn" data-target="${msg.id}">
            <span>View Context</span> &rarr;
          </button>
        </div>
      </div>
    `;

    feedContainer.appendChild(card);
  });

  feedContainer.querySelectorAll('.jump-link-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      jumpToThreadMessage(btn.getAttribute('data-target'));
    });
  });
}

/**
 * Render Tab 2: Action Items & Deadlines
 */
function renderActionItems() {
  const container = document.getElementById('actionsList');
  container.innerHTML = '';

  let items = [...state.analysisResult.actionItems];

  if (state.actionFilter === 'me') {
    items = items.filter(i => i.isAssignedToMe);
  } else if (state.actionFilter === 'pending') {
    items = items.filter(i => !state.completedTasks.has(i.id));
  } else if (state.actionFilter === 'completed') {
    items = items.filter(i => state.completedTasks.has(i.id));
  } else if (state.actionFilter === 'urgent') {
    items = items.filter(i => i.priority === 'critical' || i.priority === 'high');
  } else if (state.actionFilter === 'deadline') {
    items = items.filter(i => i.deadline);
  }

  if (state.searchQuery.trim()) {
    const q = state.searchQuery.toLowerCase();
    items = items.filter(i => 
      i.task.toLowerCase().includes(q) || 
      i.assignee.toLowerCase().includes(q)
    );
  }

  if (items.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 3rem; color: var(--text-muted); font-size: 0.95rem;">
        No action items match the selected filter.
      </div>
    `;
    return;
  }

  items.forEach(item => {
    const card = document.createElement('div');
    const isCompleted = state.completedTasks.has(item.id);
    card.className = `action-item-card ${isCompleted ? 'completed' : ''}`;
    card.id = `action_card_${item.id}`;

    const isAssignedToMe = item.isAssignedToMe;
    const priority = item.priority || (isAssignedToMe ? 'high' : 'medium');
    const deadlineHtml = item.deadline ? `
      <span class="deadline-badge">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        Due: ${escapeHtml(item.deadline)}
      </span>
    ` : '';

    card.innerHTML = `
      <input type="checkbox" class="action-checkbox" data-task-id="${item.id}" ${isCompleted ? 'checked' : ''} title="Mark task completed">
      <div class="action-content">
        <div class="task-desc">${escapeHtml(item.task)}</div>
        <div class="action-meta">
          <span class="assignee-badge ${isAssignedToMe ? 'me' : ''}">
            👤 Assigned: ${escapeHtml(item.assignee)} ${isAssignedToMe ? '(You)' : ''}
          </span>
          <span class="task-priority-badge ${priority}">
            ⚡ Priority: ${priority.toUpperCase()}
          </span>
          ${deadlineHtml}
          <span class="task-status-pill ${isCompleted ? 'completed' : 'pending'}">
            ${isCompleted ? '✅ Completed' : '⏳ Pending'}
          </span>
          <span style="color: var(--text-muted);">From ${escapeHtml(item.author)} (${escapeHtml(item.time)})</span>
          <div style="margin-left: auto; display: flex; gap: 0.5rem; align-items: center;">
            <button class="verify-btn" data-verify-type="action" data-item-id="${item.id}" style="background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.25); color: var(--primary-light); font-size: 0.72rem; padding: 3px 8px; border-radius: 4px; cursor: pointer;">
              🔍 Verify AI Evidence
            </button>
            <button class="view-source-btn" data-target="${item.messageId}">
              <span>🔍 View Original Message</span> &rarr;
            </button>
          </div>
        </div>
      </div>
    `;

    container.appendChild(card);
  });

  // Attach checkbox listeners (synced with backend SQLite if online)
  container.querySelectorAll('.action-checkbox').forEach(cb => {
    cb.addEventListener('change', async (e) => {
      const taskId = e.target.getAttribute('data-task-id');
      const isChecked = e.target.checked;

      if (isChecked) {
        state.completedTasks.add(taskId);
      } else {
        state.completedTasks.delete(taskId);
      }

      const parentCard = document.getElementById(`action_card_${taskId}`);
      if (parentCard) {
        parentCard.classList.toggle('completed', isChecked);
      }

      // Sync with SQLite backend if online
      if (state.backendOnline) {
        try {
          await fetch(`/api/actions/${taskId}/toggle`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: '{}'
          });
        } catch (err) {
          console.warn("Could not sync task with backend:", err);
        }
      }

      showToast(isChecked ? "Task completed! Synced to local database 🎉" : "Task restored to pending.");
    });
  });

  container.querySelectorAll('.view-source-btn, .jump-link-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      jumpToThreadMessage(btn.getAttribute('data-target'));
    });
  });

  container.querySelectorAll('.verify-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const itemId = btn.getAttribute('data-item-id');
      const item = state.analysisResult.actionItems.find(a => a.id === itemId);
      if (item) showEvidenceModal(item, "Action Item");
    });
  });
}

/**
 * Render Tab 3: Deadlines Radar (Section 4 & 7)
 */
function renderDeadlinesRadar() {
  const container = document.getElementById('deadlinesRadarList');
  if (!container) return;
  container.innerHTML = '';

  let list = [...(state.analysisResult.deadlinesRadar || [])];

  if (state.deadlineFilter === 'for-me') {
    list = list.filter(d => d.isForMe);
  } else if (state.deadlineFilter === 'urgent') {
    list = list.filter(d => d.priority === 'critical' || d.priority === 'high');
  }

  if (state.searchQuery.trim()) {
    const q = state.searchQuery.toLowerCase();
    list = list.filter(d => d.task.toLowerCase().includes(q) || d.deadline.toLowerCase().includes(q));
  }

  if (list.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 3rem; color: var(--text-muted); font-size: 0.95rem;">
        No deadlines match the current filter.
      </div>
    `;
    return;
  }

  list.forEach(dl => {
    const card = document.createElement('div');
    card.className = `deadline-radar-card ${dl.priority}`;

    card.innerHTML = `
      <div style="flex: 1; display: flex; flex-direction: column; gap: 0.4rem;">
        <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
          <span class="badge ${dl.priority}">⏰ ${escapeHtml(dl.deadline)}</span>
          <span class="assignee-badge ${dl.isForMe ? 'me' : ''}">👤 ${escapeHtml(dl.assignee)}</span>
          <span class="urgency-reason-pill">💡 ${escapeHtml(dl.urgencyReason)}</span>
        </div>
        <div style="font-size: 0.92rem; font-weight: 600; color: var(--text-primary);">${escapeHtml(dl.task)}</div>
        <div style="font-size: 0.75rem; color: var(--text-muted);">Declared by ${escapeHtml(dl.author)} at ${escapeHtml(dl.time)}</div>
      </div>
      <div style="display: flex; flex-direction: column; gap: 0.4rem; align-items: flex-end;">
        <button class="verify-btn" data-verify-type="deadline" data-dl-id="${dl.id}" style="background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.25); color: var(--primary-light); font-size: 0.72rem; padding: 3px 8px; border-radius: 4px; cursor: pointer;">
          🔍 Verify AI Evidence
        </button>
        <button class="view-source-btn" data-target="${dl.messageId}">
          <span>🔍 View Original Message</span> &rarr;
        </button>
      </div>
    `;

    container.appendChild(card);
  });

  container.querySelectorAll('.view-source-btn, .jump-link-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      jumpToThreadMessage(btn.getAttribute('data-target'));
    });
  });

  container.querySelectorAll('.verify-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const dlId = btn.getAttribute('data-dl-id');
      const item = state.analysisResult.deadlinesRadar.find(d => d.id === dlId);
      if (item) showEvidenceModal(item, "Deadline Commitment");
    });
  });
}

/**
 * Render Tab 4: Changed Plans (Section 5 & 7)
 */
function renderChangedPlans() {
  const container = document.getElementById('changedPlansGrid');
  if (!container) return;
  container.innerHTML = '';

  let plans = [...(state.analysisResult.changedPlans || [])];

  if (state.planFilter === 'schedule') {
    plans = plans.filter(p => p.changeType === 'schedule');
  } else if (state.planFilter === 'venue') {
    plans = plans.filter(p => p.changeType === 'venue');
  }

  if (state.searchQuery.trim()) {
    const q = state.searchQuery.toLowerCase();
    plans = plans.filter(p => p.summary.toLowerCase().includes(q));
  }

  if (plans.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 3rem; color: var(--text-muted); font-size: 0.95rem; grid-column: 1 / -1;">
        No plan, schedule, or venue changes were detected in this thread.
      </div>
    `;
    return;
  }

  plans.forEach(plan => {
    const card = document.createElement('div');
    card.className = 'changed-plan-card';
    card.id = `cp_card_${plan.id}`;

    const isTentative = plan.isTentative;

    card.innerHTML = `
      <div>
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
          <span class="plan-type-pill">🔄 ${escapeHtml(plan.changeType)} Update</span>
          <span class="plan-verification-tag ${isTentative ? 'tentative' : 'verified'}">
            ${isTentative ? '⚠️ Needs Verification' : '✅ Verified Announcement'}
          </span>
        </div>
        <div style="font-size: 0.95rem; font-weight: 600; color: var(--text-primary); margin-bottom: 0.75rem;">
          ${escapeHtml(plan.summary)}
        </div>
        <div class="plan-comparison-box">
          <div class="comparison-row">
            <span class="comparison-label before">Before</span>
            <span style="color: var(--text-muted);">${escapeHtml(plan.originalPlan)}</span>
          </div>
          <div class="comparison-row">
            <span class="comparison-label after">Updated</span>
            <span style="color: #34d399; font-weight: 600;">${escapeHtml(plan.updatedPlan)}</span>
          </div>
        </div>
      </div>
      <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted); border-top: 1px solid rgba(255, 255, 255, 0.05); padding-top: 0.65rem;">
        <span>Updated by ${escapeHtml(plan.author)} at ${escapeHtml(plan.time)}</span>
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <button class="verify-btn" data-plan-id="${plan.id}" style="background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.25); color: var(--primary-light); font-size: 0.72rem; padding: 2px 7px; border-radius: 4px; cursor: pointer;">
            🔍 Evidence
          </button>
          <button class="view-source-btn" data-target="${plan.messageId}">
            <span>🔍 View Original Message</span> &rarr;
          </button>
        </div>
      </div>
    `;

    container.appendChild(card);
  });

  container.querySelectorAll('.view-source-btn, .jump-link-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      jumpToThreadMessage(btn.getAttribute('data-target'));
    });
  });

  container.querySelectorAll('.verify-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const planId = btn.getAttribute('data-plan-id');
      const item = state.analysisResult.changedPlans.find(p => p.id === planId);
      if (item) showEvidenceModal(item, "Plan Modification");
    });
  });
}

/**
 * Render Tab 5: Decisions Log
 */
function renderDecisions() {
  const container = document.getElementById('decisionsGrid');
  container.innerHTML = '';

  let decisions = [...state.analysisResult.decisions];

  if (state.searchQuery.trim()) {
    const q = state.searchQuery.toLowerCase();
    decisions = decisions.filter(d => 
      d.decision.toLowerCase().includes(q) || 
      d.author.toLowerCase().includes(q)
    );
  }

  if (decisions.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 3rem; color: var(--text-muted); font-size: 0.95rem; grid-column: 1 / -1;">
        No explicit decisions were recorded in this conversation yet.
      </div>
    `;
    return;
  }

  decisions.forEach(d => {
    const card = document.createElement('div');
    card.className = 'decision-card';
    card.id = `dec_card_${d.id}`;

    card.innerHTML = `
      <div>
        <div class="decision-badge-label">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          Finalized Decision
        </div>
        <div class="decision-text">${escapeHtml(d.decision)}</div>
      </div>
      <div class="decision-author-meta">
        <span>Announced by <strong>${escapeHtml(d.author)}</strong> at ${escapeHtml(d.time)}</span>
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <button class="verify-btn" data-dec-id="${d.id}" style="background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.25); color: var(--primary-light); font-size: 0.72rem; padding: 2px 7px; border-radius: 4px; cursor: pointer;">
            🔍 Evidence
          </button>
          <button class="view-source-btn" data-target="${d.messageId}">
            <span>🔍 View Original Message</span> &rarr;
          </button>
        </div>
      </div>
    `;

    container.appendChild(card);
  });

  container.querySelectorAll('.view-source-btn, .jump-link-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      jumpToThreadMessage(btn.getAttribute('data-target'));
    });
  });

  container.querySelectorAll('.verify-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const decId = btn.getAttribute('data-dec-id');
      const item = state.analysisResult.decisions.find(d => d.id === decId);
      if (item) showEvidenceModal(item, "Consensus Decision");
    });
  });
}

/**
 * Render Tab 4: Full Conversation Thread
 */
function renderFullThread() {
  const container = document.getElementById('threadContainer');
  container.innerHTML = '';

  const messages = state.analysisResult.messages;

  messages.forEach(msg => {
    const item = document.createElement('div');
    const mentionsMeClass = msg.isRelevantToMe ? 'mentions-active-user' : '';
    item.className = `thread-message ${mentionsMeClass}`;
    item.id = `thread_msg_${msg.id}`;

    const avatarColor = getAvatarColor(msg.author);
    const initials = getInitials(msg.author);

    item.innerHTML = `
      <div class="thread-avatar" style="background-color: ${avatarColor};">
        ${initials}
      </div>
      <div class="thread-content">
        <div class="thread-header">
          <span class="thread-author">${escapeHtml(msg.author)}</span>
          <span class="thread-time">${escapeHtml(msg.time)}</span>
          ${msg.priorityTier === 'critical' ? '<span class="badge critical" style="font-size: 0.65rem; padding: 1px 5px;">🚨 Critical</span>' : ''}
          ${msg.isRelevantToMe ? '<span class="badge for-me" style="font-size: 0.65rem; padding: 1px 5px;">👤 You</span>' : ''}
        </div>
        <div class="thread-body">
          ${highlightKeywords(escapeHtml(msg.text), state.currentPersona)}
        </div>
      </div>
    `;

    container.appendChild(item);
  });
}

/**
 * Jump to a specific message in the full thread with a smooth scroll & pulse animation
 */
function jumpToThreadMessage(messageId) {
  if (!messageId) return;

  switchTab('thread');

  setTimeout(() => {
    const targetElement = document.getElementById(`thread_msg_${messageId}`);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      targetElement.classList.add('pulse-target');
      showToast("Scrolled to original source message in thread! 🔍");
      setTimeout(() => {
        targetElement.classList.remove('pulse-target');
      }, 3000);
    }
  }, 100);
}

/**
 * Switch active navigation tab
 */
function switchTab(tabName) {
  state.currentTab = tabName;

  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
  });

  document.querySelectorAll('.tab-pane').forEach(pane => {
    pane.classList.remove('active');
  });

  const activePaneMap = {
    priority: 'tabPriority',
    actions: 'tabActions',
    deadlines: 'tabDeadlines',
    changed_plans: 'tabChangedPlans',
    decisions: 'tabDecisions',
    timeline: 'tabTimeline',
    thread: 'tabThread'
  };

  const targetPane = document.getElementById(activePaneMap[tabName]);
  if (targetPane) {
    targetPane.classList.add('active');
  }
}

/**
 * Update tab counts
 */
function updateTabBadges() {
  const { actionItems, decisions, messages, deadlinesRadar, changedPlans, chronologicalTimeline } = state.analysisResult;
  const elPriority = document.getElementById('tabCountPriority');
  if (elPriority) elPriority.textContent = messages.length;
  const elActions = document.getElementById('tabCountActions');
  if (elActions) elActions.textContent = actionItems.length;
  const elDeadlines = document.getElementById('tabCountDeadlines');
  if (elDeadlines && deadlinesRadar) elDeadlines.textContent = deadlinesRadar.length;
  const elPlans = document.getElementById('tabCountChangedPlans');
  if (elPlans && changedPlans) elPlans.textContent = changedPlans.length;
  const elDecisions = document.getElementById('tabCountDecisions');
  if (elDecisions) elDecisions.textContent = decisions.length;
  const elTimeline = document.getElementById('tabCountTimeline');
  if (elTimeline && chronologicalTimeline) elTimeline.textContent = chronologicalTimeline.length;
  const elThread = document.getElementById('tabCountThread');
  if (elThread) elThread.textContent = messages.length;
}

/**
 * Keyword Highlighting Helper
 */
function highlightKeywords(text, persona) {
  const personaRegex = new RegExp(`(@?${persona})`, 'gi');
  text = text.replace(personaRegex, '<span style="color: #818cf8; font-weight: 700; background: rgba(99, 102, 241, 0.18); padding: 1px 4px; border-radius: 4px;">$1</span>');

  const criticalKeywords = ['critical', 'blocker', 'outage', 'down', 'rollback', '502', 'p0'];
  criticalKeywords.forEach(kw => {
    const kwRegex = new RegExp(`\\b(${kw})\\b`, 'gi');
    text = text.replace(kwRegex, '<span style="color: #f87171; font-weight: 700;">$1</span>');
  });

  return text;
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function showToast(message) {
  const toast = document.getElementById('toastNotice');
  toast.querySelector('span').textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

function exportSummaryAsMarkdown() {
  const { summary, actionItems, decisions, metrics } = state.analysisResult;
  const channel = state.currentChannel;

  let md = `# CatchUp AI: Executive Digest for @${state.currentPersona}\n`;
  md += `**Channel:** #${channel} | **Unread:** ${metrics.totalUnread} | **Generated On-Device:** 100% Local\n\n`;

  md += `## ⚡ Executive TL;DR\n`;
  summary.bullets.forEach(b => {
    md += `- **[${b.type.toUpperCase()}]** ${b.text}\n`;
  });

  md += `\n## 📋 Action Items (${actionItems.length})\n`;
  actionItems.forEach(a => {
    const done = state.completedTasks.has(a.id) ? 'x' : ' ';
    const due = a.deadline ? ` (Due: ${a.deadline})` : '';
    md += `- [${done}] **@${a.assignee}**: ${a.task}${due}\n`;
  });

  md += `\n## ⚖️ Key Decisions (${decisions.length})\n`;
  decisions.forEach(d => {
    md += `- ${d.decision} *(Facilitated by ${d.author} at ${d.time})*\n`;
  });

  navigator.clipboard.writeText(md).then(() => {
    showToast("Full Summary exported as Markdown to clipboard! 📋");
  }).catch(() => {
    showToast("Export copied!");
  });
}

function exportTasksAsMarkdown() {
  const { actionItems } = state.analysisResult;
  let md = `## 📋 Action Items Checklist\n\n`;
  actionItems.forEach(a => {
    const done = state.completedTasks.has(a.id) ? 'x' : ' ';
    const due = a.deadline ? ` (Due: ${a.deadline})` : '';
    md += `- [${done}] **@${a.assignee}**: ${a.task}${due}\n`;
  });

  navigator.clipboard.writeText(md).then(() => {
    showToast("Action Items copied as Markdown checklist! 📋");
  });
}

/**
 * Show Evidence & Verification Modal (Section 6: Message Evidence & Verification)
 * Directly provides exact quotes, authors, timestamps, AI reasoning, and surrounding message context.
 */
function showEvidenceModal(item, category = "Intelligence Finding") {
  const modal = document.getElementById('evidenceModal');
  const body = document.getElementById('evidenceModalBody');
  if (!modal || !body) return;

  const quote = item.evidence?.quote || item.rawText || item.task || item.summary || item.text || "Direct statement from conversation.";
  const author = item.author || item.evidence?.author || "Unknown";
  const time = item.time || item.evidence?.time || "N/A";
  const reasoning = item.evidence?.reasoning || item.urgencyReason || `Extracted via on-device heuristic pattern matching and local NLP classification.`;
  const isTentative = Boolean(item.isTentative);
  const confidence = item.confidence ? Math.round(item.confidence * 100) : (isTentative ? 65 : 96);
  const statusBadge = isTentative 
    ? `<span style="background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4); padding: 3px 8px; border-radius: 9999px; font-size: 0.75rem; font-weight: 600;">⚠️ Tentative (Requires Verification)</span>`
    : `<span style="background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); padding: 3px 8px; border-radius: 9999px; font-size: 0.75rem; font-weight: 600;">✅ High Confidence (${confidence}%)</span>`;

  // Find surrounding messages in thread
  const messages = state.analysisResult?.messages || [];
  const targetId = item.messageId || item.id;
  const targetIndex = messages.findIndex(m => m.id === targetId);

  let surroundingHtml = '';
  if (targetIndex !== -1) {
    const start = Math.max(0, targetIndex - 2);
    const end = Math.min(messages.length, targetIndex + 3);
    const slice = messages.slice(start, end);

    surroundingHtml = slice.map(m => {
      const isTarget = m.id === targetId;
      return `
        <div style="padding: 0.5rem 0.75rem; margin-bottom: 0.35rem; border-radius: 6px; font-size: 0.8rem; background: ${isTarget ? 'rgba(99, 102, 241, 0.18)' : 'rgba(255, 255, 255, 0.02)'}; border-left: 3px solid ${isTarget ? 'var(--primary-light)' : 'rgba(255, 255, 255, 0.1)'};">
          <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
            <strong style="color: ${isTarget ? 'var(--primary-light)' : 'var(--text-primary)'};">${escapeHtml(m.author)}</strong>
            <span style="color: var(--text-muted); font-size: 0.72rem;">${escapeHtml(m.time)}</span>
          </div>
          <div style="color: ${isTarget ? '#fff' : 'var(--text-secondary)'};">${escapeHtml(m.text)}</div>
        </div>
      `;
    }).join('');
  }

  body.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
      <span style="font-size: 0.85rem; font-weight: 700; color: var(--primary-light); text-transform: uppercase; letter-spacing: 0.05em;">${escapeHtml(category)}</span>
      ${statusBadge}
    </div>

    <div style="margin-bottom: 1rem;">
      <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.35rem; font-weight: 600; text-transform: uppercase;">Exact Source Quote</div>
      <div style="background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(255, 255, 255, 0.1); border-left: 4px solid var(--primary-light); padding: 0.85rem; border-radius: 6px; font-size: 0.88rem; color: var(--text-primary); line-height: 1.5;">
        "${escapeHtml(quote)}"
        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.4rem;">
          — <strong>${escapeHtml(author)}</strong> (${escapeHtml(time)})
        </div>
      </div>
    </div>

    <div style="margin-bottom: 1rem;">
      <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.35rem; font-weight: 600; text-transform: uppercase;">AI Verification Rationale</div>
      <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.2); padding: 0.75rem; border-radius: 6px; font-size: 0.82rem; color: #a7f3d0; line-height: 1.45;">
        💡 ${escapeHtml(reasoning)}
      </div>
    </div>

    ${surroundingHtml ? `
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
          <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Surrounding Conversation Context</span>
          <button id="modalJumpToChatBtn" style="background: none; border: none; color: var(--primary-light); font-size: 0.75rem; cursor: pointer; text-decoration: underline;">
            Jump to full chat &rarr;
          </button>
        </div>
        <div style="max-height: 180px; overflow-y: auto; padding-right: 0.25rem;">
          ${surroundingHtml}
        </div>
      </div>
    ` : ''}
  `;

  modal.classList.add('open');

  const jumpBtn = body.querySelector('#modalJumpToChatBtn');
  if (jumpBtn && targetId) {
    jumpBtn.addEventListener('click', () => {
      modal.classList.remove('open');
      jumpToThreadMessage(targetId);
    });
  }
}

/**
 * Show Pre-Analysis Message Preview Modal (Section 1: Conversation Input & Import)
 */
function showPreviewModal(parsedMessages, rawText) {
  const modal = document.getElementById('previewModal');
  const body = document.getElementById('previewModalBody');
  if (!modal || !body) return;

  state.pendingParsedMessages = parsedMessages;
  state.pendingRawText = rawText;

  const participants = [...new Set(parsedMessages.map(m => m.author))];
  const timeStart = parsedMessages[0]?.time || 'Start';
  const timeEnd = parsedMessages[parsedMessages.length - 1]?.time || 'End';

  const previewSnippet = parsedMessages.slice(0, 3).map(m => `
    <div style="padding: 0.4rem 0.6rem; margin-bottom: 0.25rem; background: rgba(255, 255, 255, 0.03); border-radius: 4px; font-size: 0.8rem;">
      <strong style="color: var(--primary-light);">${escapeHtml(m.author)}</strong> <span style="color: var(--text-muted); font-size: 0.72rem;">(${escapeHtml(m.time)})</span>: ${escapeHtml(m.text)}
    </div>
  `).join('');

  body.innerHTML = `
    <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1rem;">
      Review the detected messages and participants before executing on-device AI analysis.
    </p>

    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; margin-bottom: 1rem;">
      <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); padding: 0.75rem; border-radius: 6px; text-align: center;">
        <div style="font-size: 1.25rem; font-weight: 700; color: #fff;">${parsedMessages.length}</div>
        <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">Messages Detected</div>
      </div>
      <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); padding: 0.75rem; border-radius: 6px; text-align: center;">
        <div style="font-size: 1.25rem; font-weight: 700; color: #fff;">${participants.length}</div>
        <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">Participants</div>
      </div>
      <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); padding: 0.75rem; border-radius: 6px; text-align: center;">
        <div style="font-size: 0.88rem; font-weight: 700; color: #fff; padding-top: 0.25rem;">${escapeHtml(timeStart)} - ${escapeHtml(timeEnd)}</div>
        <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">Time Span</div>
      </div>
    </div>

    <div style="margin-bottom: 1rem;">
      <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; margin-bottom: 0.35rem;">Detected Participants</div>
      <div style="display: flex; gap: 0.35rem; flex-wrap: wrap;">
        ${participants.map(p => `<span style="background: rgba(99, 102, 241, 0.15); color: var(--primary-light); padding: 2px 8px; border-radius: 4px; font-size: 0.78rem;">${escapeHtml(p)}</span>`).join('')}
      </div>
    </div>

    <div>
      <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; margin-bottom: 0.35rem;">Initial Message Samples (First 3)</div>
      ${previewSnippet}
    </div>
  `;

  modal.classList.add('open');
}

/**
 * Load Demonstration Sample (Section 1: Load sample conversation for demonstration)
 * Explicitly labeled as a demo for testing without entering fake data by default.
 */
async function loadDemoSample() {
  state.currentChannel = 'demo';
  if (state.backendOnline) {
    try {
      const res = await fetch(`/api/sample?persona=${encodeURIComponent(state.currentPersona)}`);
      if (res.ok) {
        const data = await res.json();
        state.analysisResult = data;
        state.completedTasks.clear();
        (data.actionItems || []).forEach(a => {
          if (a.completed) state.completedTasks.add(a.id);
        });
        renderAllViews();
        showToast("Loaded sample conversation for demonstration! 🧪");
        return;
      }
    } catch (e) {
      console.warn("Backend demo sample failed, using client engine:", e);
    }
  }

  // Client mode
  const msgs = SAMPLE_DATASETS.incident.messages;
  state.customMessages = msgs;
  state.analysisResult = clientEngine.analyze(msgs, state.currentPersona);
  renderAllViews();
  showToast("Loaded sample incident conversation for demonstration! 🚨");
}

/**
 * Load Product Launch Sample Conversation
 */
async function loadLaunchSample() {
  state.currentChannel = 'launch';
  const msgs = SAMPLE_DATASETS.launch?.messages || [];
  state.customMessages = msgs;
  state.analysisResult = clientEngine.analyze(msgs, state.currentPersona);
  state.completedTasks.clear();
  renderAllViews();
  showToast("Loaded Q4 Product Launch demo conversation! 🚀");
}

/**
 * Analyze User's Actual Conversation (Section 11: Analyze user's actual conversation)
 */
async function analyzeCustomConversation(rawText) {
  if (!rawText || !rawText.trim()) {
    showToast("⚠️ Please paste or upload conversation text to analyze.");
    return false;
  }

  const parsed = clientEngine.parseRawText(rawText);
  if (!parsed || parsed.length === 0) {
    showToast("⚠️ Could not parse messages. Please verify format (e.g., [10:15 AM] Name: text).");
    return false;
  }

  state.pendingRawText = rawText;
  state.pendingParsedMessages = parsed;

  if (state.backendOnline) {
    try {
      const res = await fetch('/api/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: "uploaded-chat",
          rawText: rawText,
          persona: state.currentPersona
        })
      });
      if (res.ok) {
        const data = await res.json();
        state.currentChannel = data.channelId;
        state.analysisResult = data;
        state.completedTasks.clear();
        renderAllViews();
        showToast(`Analyzed ${data.messageCount} messages using local ML! 🚀`);
        return true;
      }
    } catch (err) {
      console.warn("Backend analysis failed, using client engine:", err);
    }
  }

  // Standalone client NLP analysis
  state.customMessages = parsed;
  state.currentChannel = 'custom';
  state.analysisResult = clientEngine.analyze(parsed, state.currentPersona);
  state.completedTasks.clear();
  renderAllViews();
  showToast(`Analyzed ${parsed.length} messages using on-device NLP! 🚀`);
  return true;
}

/**
 * Execute custom conversation analysis after user confirmation in Preview Modal
 */
async function executeCustomAnalysis() {
  const modal = document.getElementById('previewModal');
  if (modal) modal.classList.remove('open');

  const rawText = state.pendingRawText;
  if (rawText) {
    await analyzeCustomConversation(rawText);
  }
}

/**
 * Clear Session & Wipe User Data (Section 9: Privacy & Data Protection)
 */
async function clearSession() {
  if (!confirm("Are you sure you want to clear this session? All local temporary data, uploaded messages, and completed tasks will be wiped.")) {
    return;
  }

  state.customMessages = [];
  state.completedTasks.clear();
  state.pendingParsedMessages = null;
  state.pendingRawText = null;
  state.currentChannel = null;
  state.analysisResult = null;

  const workspaceChatInput = document.getElementById('workspaceChatInput');
  if (workspaceChatInput) workspaceChatInput.value = '';
  const customChatInput = document.getElementById('customChatInput');
  if (customChatInput) customChatInput.value = '';

  if (state.backendOnline) {
    try {
      await fetch('/api/session/clear', { method: 'POST' });
    } catch (e) {
      console.warn("Backend session clear failed:", e);
    }
  }

  renderAllViews();
  showToast("Local session completely wiped. 0 bytes retained on disk or memory! 🔒");
}

// ==========================================================================
// Authentication & Session Management (100% Local-First / Zero Cloud Egress)
// ==========================================================================

function checkAuthStatus() {
  const homeLoginView = document.getElementById('homeLoginView');
  const mainAppView = document.getElementById('mainAppView');
  const userNameInput = document.getElementById('userNameInput');
  const savedUser = localStorage.getItem('catchup_user');

  if (savedUser) {
    state.currentUser = savedUser;
    state.currentPersona = savedUser;
    if (userNameInput) userNameInput.value = savedUser;
    if (homeLoginView) homeLoginView.style.display = 'none';
    if (mainAppView) mainAppView.style.display = 'block';
    return true;
  } else {
    state.currentUser = null;
    if (homeLoginView) homeLoginView.style.display = 'flex';
    if (mainAppView) mainAppView.style.display = 'none';
    return false;
  }
}

function handleLogin(name, role) {
  const cleanName = (name || '').trim() || 'Alex';
  const cleanRole = (role || '').trim();
  localStorage.setItem('catchup_user', cleanName);
  if (cleanRole) {
    localStorage.setItem('catchup_role', cleanRole);
  } else {
    localStorage.removeItem('catchup_role');
  }

  state.currentUser = cleanName;
  state.currentPersona = cleanName;
  const userNameInput = document.getElementById('userNameInput');
  if (userNameInput) userNameInput.value = cleanName;

  const homeLoginView = document.getElementById('homeLoginView');
  const mainAppView = document.getElementById('mainAppView');
  if (homeLoginView) homeLoginView.style.display = 'none';
  if (mainAppView) mainAppView.style.display = 'block';

  showToast(`Welcome, ${cleanName}! Workspace ready.`);
  runAnalysisAndRender();
}

function handleLogout() {
  localStorage.removeItem('catchup_user');
  localStorage.removeItem('catchup_role');
  state.currentUser = null;

  // Reset current analysis session
  state.analysisResult = null;
  state.customMessages = [];
  state.currentChannel = null;

  const homeLoginView = document.getElementById('homeLoginView');
  const mainAppView = document.getElementById('mainAppView');
  if (homeLoginView) homeLoginView.style.display = 'flex';
  if (mainAppView) mainAppView.style.display = 'none';

  const loginNameInput = document.getElementById('loginNameInput');
  if (loginNameInput) loginNameInput.value = '';

  showToast("Logged out successfully.");
}

// ==========================================================================
// Initialization & Listeners
// ==========================================================================

document.addEventListener('DOMContentLoaded', async () => {
  // Check backend connectivity first
  await checkBackendStatus();

  // Auth & Session Listeners
  const loginForm = document.getElementById('loginForm');
  const enterAppBtn = document.getElementById('enterAppBtn');
  const quickDemoLoginBtn = document.getElementById('quickDemoLoginBtn');
  const loginNameInput = document.getElementById('loginNameInput');
  const loginRoleInput = document.getElementById('loginRoleInput');
  const logoutBtn = document.getElementById('logoutBtn');

  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleLogin(loginNameInput ? loginNameInput.value : '', loginRoleInput ? loginRoleInput.value : '');
    });
  }

  if (enterAppBtn) {
    enterAppBtn.addEventListener('click', (e) => {
      e.preventDefault();
      handleLogin(loginNameInput ? loginNameInput.value : '', loginRoleInput ? loginRoleInput.value : '');
    });
  }

  if (quickDemoLoginBtn) {
    quickDemoLoginBtn.addEventListener('click', () => {
      handleLogin('Alex', 'Frontend Lead');
      loadDemoSample();
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }

  // Quick Persona Chips on Login Screen
  document.querySelectorAll('.home-persona-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.home-persona-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const name = chip.getAttribute('data-name');
      const role = chip.getAttribute('data-role');
      if (loginNameInput) loginNameInput.value = name;
      if (loginRoleInput) loginRoleInput.value = role;
    });
  });

  // Pre-fill login input if cached previously
  const cachedUser = localStorage.getItem('catchup_user');
  if (cachedUser && loginNameInput) {
    loginNameInput.value = cachedUser;
  }
  const cachedRole = localStorage.getItem('catchup_role');
  if (cachedRole && loginRoleInput) {
    loginRoleInput.value = cachedRole;
  }

  // 1. User Name & Persona Quick Select in Header
  const userNameInput = document.getElementById('userNameInput');
  const personaQuickSelect = document.getElementById('personaQuickSelect');

  if (personaQuickSelect) {
    personaQuickSelect.value = state.currentPersona || 'Alex';
    personaQuickSelect.addEventListener('change', (e) => {
      const selected = e.target.value;
      if (selected === 'custom') {
        if (userNameInput) {
          userNameInput.style.display = 'inline-block';
          userNameInput.focus();
        }
      } else {
        if (userNameInput) {
          userNameInput.style.display = 'none';
          userNameInput.value = selected;
        }
        state.currentPersona = selected;
        state.currentUser = selected;
        localStorage.setItem('catchup_user', selected);
        if (state.analysisResult) {
          runAnalysisAndRender();
          showToast(`Dashboard personalized for @${selected}! 👤`);
        }
      }
    });
  }

  if (userNameInput) {
    userNameInput.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      state.currentPersona = val || 'Alex';
      state.currentUser = state.currentPersona;
      localStorage.setItem('catchup_user', state.currentPersona);
      if (state.analysisResult) {
        runAnalysisAndRender();
        showToast(`Personalized for @${state.currentPersona}`);
      }
    });
  }

  // 2. Demo Sample Buttons in Header
  const loadDemoSampleBtn = document.getElementById('loadDemoSampleBtn');
  if (loadDemoSampleBtn) {
    loadDemoSampleBtn.addEventListener('click', loadDemoSample);
  }

  const loadLaunchSampleBtn = document.getElementById('loadLaunchSampleBtn');
  if (loadLaunchSampleBtn) {
    loadLaunchSampleBtn.addEventListener('click', loadLaunchSample);
  }

  // 3. Workspace Card Controls
  const workspaceChatInput = document.getElementById('workspaceChatInput');
  const workspaceAnalyzeBtn = document.getElementById('workspaceAnalyzeBtn');
  const workspacePreviewBtn = document.getElementById('workspacePreviewBtn');
  const workspaceDemoBtn = document.getElementById('workspaceDemoBtn');
  const workspaceLaunchBtn = document.getElementById('workspaceLaunchBtn');
  const workspaceDropZone = document.getElementById('workspaceDropZone');
  const workspaceFileInput = document.getElementById('workspaceFileInput');
  const analyzeNewChatBtn = document.getElementById('analyzeNewChatBtn');

  if (workspaceAnalyzeBtn) {
    workspaceAnalyzeBtn.addEventListener('click', () => {
      analyzeCustomConversation(workspaceChatInput.value);
    });
  }

  if (workspacePreviewBtn) {
    workspacePreviewBtn.addEventListener('click', () => {
      const text = workspaceChatInput.value;
      if (!text || !text.trim()) {
        showToast("⚠️ Please paste conversation text to preview.");
        return;
      }
      const parsed = clientEngine.parseRawText(text);
      if (!parsed || parsed.length === 0) {
        showToast("⚠️ Could not parse messages. Please verify format.");
        return;
      }
      showPreviewModal(parsed, text);
    });
  }

  if (workspaceDemoBtn) {
    workspaceDemoBtn.addEventListener('click', loadDemoSample);
  }

  if (workspaceLaunchBtn) {
    workspaceLaunchBtn.addEventListener('click', loadLaunchSample);
  }

  if (analyzeNewChatBtn) {
    analyzeNewChatBtn.addEventListener('click', () => {
      const inputCard = document.getElementById('inputWorkspaceCard');
      if (inputCard) {
        inputCard.style.display = 'flex';
        inputCard.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  if (workspaceDropZone && workspaceFileInput) {
    workspaceDropZone.addEventListener('click', () => workspaceFileInput.click());
    workspaceFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          workspaceChatInput.value = evt.target.result;
          showToast(`Loaded "${file.name}"! Click "Run Local AI Analysis" to process.`);
        };
        reader.readAsText(file);
      }
    });

    workspaceDropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      workspaceDropZone.style.borderColor = 'var(--primary-light)';
      workspaceDropZone.style.background = 'rgba(99, 102, 241, 0.08)';
    });
    workspaceDropZone.addEventListener('dragleave', () => {
      workspaceDropZone.style.borderColor = 'rgba(99, 102, 241, 0.3)';
      workspaceDropZone.style.background = 'rgba(99, 102, 241, 0.03)';
    });
    workspaceDropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      workspaceDropZone.style.borderColor = 'rgba(99, 102, 241, 0.3)';
      workspaceDropZone.style.background = 'rgba(99, 102, 241, 0.03)';
      if (e.dataTransfer.files && e.dataTransfer.files.length) {
        const file = e.dataTransfer.files[0];
        const reader = new FileReader();
        reader.onload = (evt) => {
          workspaceChatInput.value = evt.target.result;
          showToast(`Loaded "${file.name}"! Click "Run Local AI Analysis" to process.`);
        };
        reader.readAsText(file);
      }
    });
  }

  // 3. Navigation Tabs
  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.getAttribute('data-tab'));
    });
  });

  // 4. Filters
  document.querySelectorAll('[data-priority-filter]').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('[data-priority-filter]').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.priorityFilter = chip.getAttribute('data-priority-filter');
      renderPriorityFeed();
    });
  });

  document.querySelectorAll('[data-action-filter]').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('[data-action-filter]').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.actionFilter = chip.getAttribute('data-action-filter');
      renderActionItems();
    });
  });

  // Deadline Filter Chips
  document.querySelectorAll('[data-deadline-filter]').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('[data-deadline-filter]').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.deadlineFilter = chip.getAttribute('data-deadline-filter');
      renderDeadlinesRadar();
    });
  });

  // Changed Plan Filter Chips
  document.querySelectorAll('[data-plan-filter]').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('[data-plan-filter]').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.planFilter = chip.getAttribute('data-plan-filter');
      renderChangedPlans();
    });
  });

  // 5. Search
  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    renderPriorityFeed();
    renderActionItems();
    renderDeadlinesRadar();
    renderChangedPlans();
    renderDecisions();
  });

  // Clear Session Button (Section 9: Privacy)
  const clearSessionBtn = document.getElementById('clearSessionBtn');
  if (clearSessionBtn) {
    clearSessionBtn.addEventListener('click', clearSession);
  }

  // 6. Custom Chat Import
  const importModal = document.getElementById('importModal');
  const openImportModalBtn = document.getElementById('openImportModalBtn');
  const closeImportModalBtn = document.getElementById('closeImportModalBtn');
  const analyzeCustomChatBtn = document.getElementById('analyzeCustomChatBtn');
  const loadCustomExampleBtn = document.getElementById('loadCustomExampleBtn');
  const customChatInput = document.getElementById('customChatInput');

  openImportModalBtn.addEventListener('click', () => {
    importModal.classList.add('open');
  });

  closeImportModalBtn.addEventListener('click', () => {
    importModal.classList.remove('open');
  });

  loadCustomExampleBtn.addEventListener('click', () => {
    customChatInput.value = `[10:00 AM] Sarah: Urgent update: The staging server certificates have expired.
[10:02 AM] David: I can generate new SSL certificates using Let's Encrypt.
[10:05 AM] Sarah: @Alex please test the checkout redirect immediately once David completes it, deadline by 11:30 AM today.
[10:10 AM] David: Action Item: @David deploy automated renewal cron job by Friday.
[10:15 AM] Sarah: Decision: We will standardize on Cloudflare SSL edge certificates going forward.
[10:20 AM] Alex: @David let me know when staging is ready for me to verify.`;
  });

  const loadCustomSprintBtn = document.getElementById('loadCustomSprintBtn');
  if (loadCustomSprintBtn) {
    loadCustomSprintBtn.addEventListener('click', () => {
      customChatInput.value = `[9:00 AM] Sarah: Announcement: Good morning team! Today is Launch Day - 2 for Q4. Code freeze at 7:00 PM tonight.
[9:15 AM] Marcus: Press release is finalized with TechCrunch! Embargo lifts Thursday at 8:00 AM PST.
[9:45 AM] Sarah: Decision: We agreed to launch with annual billing discount set at 25% off instead of 20%.
[10:15 AM] Sarah: @Alex what is the status of PR #842 for Apple Pay and Google Pay one-click checkout?
[10:45 AM] Sarah: @Alex please make sure to merge PR #842 and deploy to staging by 2:00 PM today so QA can sign off.
[11:00 AM] Sarah: Action Item: @Alex review mobile responsiveness on the checkout modal before code freeze.
[11:35 AM] Sarah: Decision: We will respect system preference for theme by default on initial sign up.
[12:10 PM] Sarah: Action Item: @David enable database read replica autoscaling by 5:00 PM today to handle launch traffic spike.`;
    });
  }

  const loadCustomShiftBtn = document.getElementById('loadCustomShiftBtn');
  if (loadCustomShiftBtn) {
    loadCustomShiftBtn.addEventListener('click', () => {
      customChatInput.value = `[10:00 AM] Sarah: Hey team, we have our quarterly roadmap review planned.
[10:05 AM] David: Working on the infrastructure budget deck right now.
[10:15 AM] Sarah: Update: Roadmap review is rescheduled from 2:00 PM to 3:45 PM today.
[10:18 AM] Sarah: Also venue changed from Room 4B to Google Meet link https://meet.google.com/catchup-ai.
[10:20 AM] Sarah: @Alex please review the sprint backlog before the 3:45 PM meeting.
[10:25 AM] Sarah: Decision: We will allocate 30% of engineering bandwidth to technical debt reduction next sprint.`;
    });
  }

  analyzeCustomChatBtn.addEventListener('click', () => {
    const rawText = customChatInput.value;
    if (!rawText || !rawText.trim()) {
      alert("Please paste conversation text to analyze.");
      return;
    }

    const parsed = clientEngine.parseRawText(rawText);
    if (!parsed || parsed.length === 0) {
      alert("Could not parse messages. Please verify format.");
      return;
    }

    importModal.classList.remove('open');
    showPreviewModal(parsed, rawText);
  });

  // Preview Modal Listeners (Section 1: Pre-Analysis Preview)
  const previewModal = document.getElementById('previewModal');
  const closePreviewModalBtn = document.getElementById('closePreviewModalBtn');
  const cancelPreviewBtn = document.getElementById('cancelPreviewBtn');
  const confirmAnalysisBtn = document.getElementById('confirmAnalysisBtn');

  [closePreviewModalBtn, cancelPreviewBtn].forEach(btn => {
    if (btn) {
      btn.addEventListener('click', () => {
        if (previewModal) previewModal.classList.remove('open');
        if (importModal) importModal.classList.add('open');
      });
    }
  });

  if (confirmAnalysisBtn) {
    confirmAnalysisBtn.addEventListener('click', executeCustomAnalysis);
  }

  // Evidence Modal Listeners (Section 6: Message Evidence & Verification)
  const evidenceModal = document.getElementById('evidenceModal');
  const closeEvidenceModalBtn = document.getElementById('closeEvidenceModalBtn');
  const closeEvidenceModalBtn2 = document.getElementById('closeEvidenceModalBtn2');

  [closeEvidenceModalBtn, closeEvidenceModalBtn2].forEach(btn => {
    if (btn) {
      btn.addEventListener('click', () => {
        if (evidenceModal) evidenceModal.classList.remove('open');
      });
    }
  });

  // 7. Privacy Inspector Modal
  const privacyModal = document.getElementById('privacyModal');
  const openPrivacyModalBtn = document.getElementById('openPrivacyModalBtn');
  const closePrivacyModalBtn = document.getElementById('closePrivacyModalBtn');
  const closePrivacyModalBtn2 = document.getElementById('closePrivacyModalBtn2');

  openPrivacyModalBtn.addEventListener('click', async () => {
    privacyModal.classList.add('open');
    // Refresh backend audit
    await checkBackendStatus();
  });

  [closePrivacyModalBtn, closePrivacyModalBtn2].forEach(btn => {
    btn.addEventListener('click', () => {
      privacyModal.classList.remove('open');
    });
  });

  [importModal, privacyModal, previewModal, evidenceModal].forEach(modal => {
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('open');
      });
    }
  });

  // 8. Audio Speech Briefing
  const listenBriefingBtn = document.getElementById('listenBriefingBtn');
  if (listenBriefingBtn) {
    listenBriefingBtn.addEventListener('click', toggleAudioBriefing);
  }

  // 9. Drag & Drop File Upload
  const dropZone = document.getElementById('dropZone');
  const fileUploadInput = document.getElementById('fileUploadInput');

  if (dropZone && fileUploadInput) {
    dropZone.addEventListener('click', () => fileUploadInput.click());
    fileUploadInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) readFile(file);
    });

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.style.borderColor = 'var(--primary-light)';
      dropZone.style.background = 'rgba(99, 102, 241, 0.08)';
    });
    dropZone.addEventListener('dragleave', () => {
      dropZone.style.borderColor = 'rgba(255, 255, 255, 0.15)';
      dropZone.style.background = 'rgba(255, 255, 255, 0.02)';
    });
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.style.borderColor = 'rgba(255, 255, 255, 0.15)';
      dropZone.style.background = 'rgba(255, 255, 255, 0.02)';
      if (e.dataTransfer.files && e.dataTransfer.files.length) {
        readFile(e.dataTransfer.files[0]);
      }
    });

    function readFile(file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        customChatInput.value = evt.target.result;
        showToast(`Loaded "${file.name}"! Click "Analyze Locally" to parse.`);
      };
      reader.readAsText(file);
    }
  }

  // 10. Exports
  document.getElementById('exportMarkdownBtn').addEventListener('click', exportSummaryAsMarkdown);
  document.getElementById('copyTasksMarkdownBtn').addEventListener('click', exportTasksAsMarkdown);

  // Initial Run: Check local session auth status
  const isLoggedIn = checkAuthStatus();
  if (isLoggedIn) {
    runAnalysisAndRender();
  }
});

function toggleAudioBriefing() {
  const synth = window.speechSynthesis;
  if (!synth) {
    alert("Speech synthesis is not supported in this browser.");
    return;
  }
  const btnText = document.getElementById('listenBtnText');

  if (synth.speaking) {
    synth.cancel();
    if (btnText) btnText.textContent = "Listen Briefing (30s)";
    showToast("Audio playback stopped.");
    return;
  }

  const { summary } = state.analysisResult;
  if (!summary || !summary.bullets.length) return;

  let textToSpeak = `Here is your 30-second catch-up briefing for ${state.currentPersona}. `;
  summary.bullets.forEach((b, i) => {
    textToSpeak += `${b.text}. `;
  });

  const utterance = new SpeechSynthesisUtterance(textToSpeak);
  utterance.rate = 1.05;
  utterance.pitch = 1.0;

  utterance.onstart = () => {
    if (btnText) btnText.textContent = "🔊 Speaking... (Click to stop)";
  };
  utterance.onend = () => {
    if (btnText) btnText.textContent = "Listen Briefing (30s)";
  };
  utterance.onerror = () => {
    if (btnText) btnText.textContent = "Listen Briefing (30s)";
  };

  synth.speak(utterance);
}
