// ---- Player Applications ----
function getApplications() {
  try {
    return JSON.parse(localStorage.getItem('eliteArrowsApplications')) || [];
  } catch {
    return [];
  }
}

function saveApplications(apps) {
  localStorage.setItem('eliteArrowsApplications', JSON.stringify(apps));
}

// ---- Role Applications ----
function getRoleApplications() {
  try {
    return JSON.parse(localStorage.getItem('eliteArrowsRoleApplications')) || [];
  } catch {
    return [];
  }
}

function saveRoleApplications(apps) {
  localStorage.setItem('eliteArrowsRoleApplications', JSON.stringify(apps));
}

function showToast(message, type) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.className = 'toast ' + (type || '');
  toast.innerHTML = `<span class="toast-icon">${type === 'success' ? '✓' : 'ℹ'}</span> ${message}`;
  toast.classList.add('show');
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => toast.classList.remove('show'), 3000);
}

function setupMobileMenu() {
  const menuBtn = document.getElementById('menuBtn');
  const overlay = document.getElementById('mobileOverlay');
  const nav = document.getElementById('mobileNav');
  if (!menuBtn || !overlay || !nav) return;

  function close() {
    overlay.classList.remove('open');
    nav.style.display = '';
  }

  menuBtn.addEventListener('click', () => {
    const isOpen = overlay.classList.contains('open');
    if (isOpen) {
      close();
    } else {
      overlay.classList.add('open');
      nav.style.display = 'flex';
    }
  });

  overlay.addEventListener('click', close);
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
}

document.addEventListener('DOMContentLoaded', () => {
  setupMobileMenu();

  // Player Application Form
  const form = document.getElementById('applicationForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const application = {
        id: 'EA-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase(),
        fullName: document.getElementById('fullName').value.trim(),
        email: document.getElementById('email').value.trim(),
        age: parseInt(document.getElementById('age').value),
        location: document.getElementById('location').value.trim(),
        dartcounter: document.getElementById('dartcounter').value.trim(),
        whatsapp: document.getElementById('whatsapp').value.trim(),
        experience: document.getElementById('experience').value,
        avgScore: parseFloat(document.getElementById('avgScore').value) || 0,
        whyJoin: document.getElementById('whyJoin').value.trim(),
        availability: document.getElementById('availability').value,
        referral: document.getElementById('referral').value.trim(),
        type: 'player',
        status: 'pending',
        submittedAt: new Date().toISOString(),
      };

      const apps = getApplications();
      apps.push(application);
      saveApplications(apps);

      showToast('Application submitted successfully!', 'success');
      form.reset();
      renderApplications(document.getElementById('applicationsContainer'));
    });
  }

  // Role Application Form
  const roleForm = document.getElementById('roleForm');
  if (roleForm) {
    roleForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const application = {
        id: 'EA-ROLE-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase(),
        fullName: document.getElementById('roleFullName').value.trim(),
        email: document.getElementById('roleEmail').value.trim(),
        position: document.getElementById('rolePosition').value,
        experience: document.getElementById('roleExperience').value.trim(),
        availability: document.getElementById('roleAvailability').value,
        type: 'role',
        status: 'pending',
        submittedAt: new Date().toISOString(),
      };

      const apps = getRoleApplications();
      apps.push(application);
      saveRoleApplications(apps);

      showToast('Role application submitted successfully!', 'success');
      roleForm.reset();
      renderRoleApplications(document.getElementById('roleApplicationsContainer'));
    });
  }

  // Render player applications
  const appsContainer = document.getElementById('applicationsContainer');
  if (appsContainer) {
    renderApplications(appsContainer);
  }

  // Render role applications
  const roleContainer = document.getElementById('roleApplicationsContainer');
  if (roleContainer) {
    renderRoleApplications(roleContainer);
  }

  // Suggestions
  const sugForm = document.getElementById('suggestionForm');
  if (sugForm) {
    sugForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const suggestion = {
        id: 'EA-SUG-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase(),
        submittedBy: document.getElementById('sugName').value.trim(),
        title: document.getElementById('sugTitle').value.trim(),
        description: document.getElementById('sugDescription').value.trim(),
        category: document.getElementById('sugCategory').value,
        votes: 0,
        voters: [],
        status: 'new',
        submittedAt: new Date().toISOString(),
      };

      const suggestions = getSuggestions();
      suggestions.push(suggestion);
      saveSuggestions(suggestions);

      showToast('Suggestion submitted successfully!', 'success');
      sugForm.reset();
      renderSuggestions(document.getElementById('suggestionsContainer'));
    });
  }

  const sugContainer = document.getElementById('suggestionsContainer');
  if (sugContainer) {
    renderSuggestions(sugContainer);
  }
});

function renderApplications(container) {
  const apps = getApplications();

  if (apps.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <h3>No applications yet</h3>
        <p>Submit your player application above to get started.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = apps.reverse().map(app => {
    const statusClass = app.status === 'approved' || app.status === 'onboarding_complete' ? 'status-approved' : app.status === 'rejected' ? 'status-rejected' : 'status-pending';
    const statusLabel = app.status === 'onboarding_complete' ? 'Onboarding Complete' : app.status.charAt(0).toUpperCase() + app.status.slice(1);

    return `
      <div class="app-card">
        <div class="app-card-header">
          <div>
            <div class="app-name">${escapeHtml(app.fullName)}</div>
            <div class="app-id">${app.id}</div>
          </div>
          <span class="app-status ${statusClass}">${statusLabel}</span>
        </div>
        <div class="app-card-body">
          <div class="app-detail"><span class="detail-label">Email:</span> ${escapeHtml(app.email)}</div>
          <div class="app-detail"><span class="detail-label">Age:</span> ${app.age}</div>
          <div class="app-detail"><span class="detail-label">Location:</span> ${escapeHtml(app.location)}</div>
          <div class="app-detail"><span class="detail-label">DartCounter:</span> ${escapeHtml(app.dartcounter)}</div>
          <div class="app-detail"><span class="detail-label">WhatsApp:</span> ${escapeHtml(app.whatsapp)}</div>
          <div class="app-detail"><span class="detail-label">Experience:</span> ${escapeHtml(app.experience)}</div>
          <div class="app-detail"><span class="detail-label">Avg Score:</span> ${app.avgScore || 'N/A'}</div>
          <div class="app-detail"><span class="detail-label">Availability:</span> ${escapeHtml(app.availability)}</div>
          <div class="app-detail"><span class="detail-label">Referral:</span> ${escapeHtml(app.referral) || 'N/A'}</div>
          <div class="app-detail app-why-join"><span class="detail-label">Why Join:</span> ${escapeHtml(app.whyJoin)}</div>
          <div class="app-detail"><span class="detail-label">Submitted:</span> ${new Date(app.submittedAt).toLocaleString()}</div>
        </div>
      </div>
    `;
  }).join('');
}

function renderRoleApplications(container) {
  const apps = getRoleApplications();

  if (apps.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">💼</div>
        <h3>No role applications yet</h3>
        <p>Submit a role application above to get started.</p>
      </div>
    `;
    return;
  }

  const positionLabels = {
    streamer: 'Streamer / Content Creator',
    moderator: 'Moderator / Admin',
    social: 'Social Media Manager',
    sponsorship: 'Sponsorship Coordinator',
    tournament: 'Tournament Organiser',
    event: 'Event Coordinator',
    recruiter: 'Recruiter',
    other: 'Other',
  };

  container.innerHTML = apps.reverse().map(app => {
    const statusClass = app.status === 'approved' ? 'status-approved' : app.status === 'rejected' ? 'status-rejected' : 'status-pending';
    const statusLabel = app.status.charAt(0).toUpperCase() + app.status.slice(1);

    return `
      <div class="app-card">
        <div class="app-card-header">
          <div>
            <div class="app-name">${escapeHtml(app.fullName)}</div>
            <div class="app-id">${app.id}</div>
          </div>
          <span class="app-status ${statusClass}">${statusLabel}</span>
        </div>
        <div class="app-card-body">
          <div class="app-detail"><span class="detail-label">Email:</span> ${escapeHtml(app.email)}</div>
          <div class="app-detail"><span class="detail-label">Position:</span> ${escapeHtml(positionLabels[app.position] || app.position)}</div>
          <div class="app-detail"><span class="detail-label">Availability:</span> ${escapeHtml(app.availability)}</div>
          <div class="app-detail app-why-join"><span class="detail-label">Experience:</span> ${escapeHtml(app.experience)}</div>
          <div class="app-detail"><span class="detail-label">Submitted:</span> ${new Date(app.submittedAt).toLocaleString()}</div>
        </div>
      </div>
    `;
  }).join('');
}

// ---- Suggestions ----
function getSuggestions() {
  try {
    return JSON.parse(localStorage.getItem('eliteArrowsSuggestions')) || [];
  } catch {
    return [];
  }
}

function saveSuggestions(suggestions) {
  localStorage.setItem('eliteArrowsSuggestions', JSON.stringify(suggestions));
}

function renderSuggestions(container) {
  const suggestions = getSuggestions();

  if (suggestions.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">💡</div>
        <h3>No suggestions yet</h3>
        <p>Submit your idea above to get started.</p>
      </div>
    `;
    return;
  }

  const categoryLabels = {
    league: 'League Format & Rules',
    tournament: 'Tournaments & Events',
    community: 'Community & Communication',
    platform: 'Website & Platform',
    other: 'Other',
  };

  const statusLabels = {
    new: 'New',
    considering: 'Being Considered',
    approved: 'Under Approval',
    planned: 'Planned',
    completed: 'Completed',
    declined: 'Declined',
  };

  const statusClasses = {
    new: 'status-pending',
    considering: 'status-approved',
    approved: 'status-approved',
    planned: 'status-approved',
    completed: 'status-approved',
    declined: 'status-rejected',
  };

  const voterId = localStorage.getItem('sugVoterId') || 'voter-' + Math.random().toString(36).substr(2, 8);
  localStorage.setItem('sugVoterId', voterId);

  container.innerHTML = suggestions.reverse().map(s => {
    const statusClass = statusClasses[s.status] || 'status-pending';
    const statusLabel = statusLabels[s.status] || 'New';
    const hasVoted = s.voters && s.voters.includes(voterId);

    return `
      <div class="app-card">
        <div class="app-card-header">
          <div>
            <div class="app-name">${escapeHtml(s.title)}</div>
            <div class="app-id">${s.id} &middot; by ${escapeHtml(s.submittedBy)}</div>
          </div>
          <span class="app-status ${statusClass}">${statusLabel}</span>
        </div>
        <div class="app-card-body">
          <div class="app-detail"><span class="detail-label">Category:</span> ${escapeHtml(categoryLabels[s.category] || s.category)}</div>
          <div class="app-detail"><span class="detail-label">Submitted:</span> ${new Date(s.submittedAt).toLocaleString()}</div>
          <div class="app-detail app-why-join">${escapeHtml(s.description)}</div>
          <div style="display: flex; align-items: center; gap: 12px; margin-top: 16px;">
            <button class="btn btn-sm ${hasVoted ? 'btn-secondary' : 'btn-primary'}" onclick="voteSuggestion('${s.id}')" ${hasVoted ? 'disabled' : ''}>
              ${hasVoted ? '✓ Voted' : '▲ Vote'}
            </button>
            <span style="color: var(--text-secondary); font-size: 0.9rem; font-weight: 600;">${s.votes || 0} vote${s.votes !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function voteSuggestion(id) {
  const suggestions = getSuggestions();
  const s = suggestions.find(x => x.id === id);
  if (!s) return;

  const voterId = localStorage.getItem('sugVoterId');
  if (!voterId || (s.voters && s.voters.includes(voterId))) return;

  s.votes = (s.votes || 0) + 1;
  s.voters = s.voters || [];
  s.voters.push(voterId);
  saveSuggestions(suggestions);

  const container = document.getElementById('suggestionsContainer');
  if (container) renderSuggestions(container);
  showToast('Vote recorded!', 'success');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
