import { db, collection, doc, setDoc, getDocs, query, orderBy, onSnapshot, updateDoc, addDoc } from "./firebase-config.js";

// ---- Utility Functions ----
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
    nav.classList.remove('open');
  }

  menuBtn.addEventListener('click', () => {
    const isOpen = overlay.classList.contains('open');
    if (isOpen) {
      close();
    } else {
      overlay.classList.add('open');
      nav.classList.add('open');
    }
  });

  overlay.addEventListener('click', close);
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ---- Data Fetching & Syncing ----

async function migrateLocalData() {
  const oldPlayerApps = JSON.parse(localStorage.getItem('eliteArrowsApplications') || '[]');
  const oldRoleApps = JSON.parse(localStorage.getItem('eliteArrowsRoleApplications') || '[]');
  const oldSuggestions = JSON.parse(localStorage.getItem('eliteArrowsSuggestions') || '[]');

  if (oldPlayerApps.length > 0) {
    for (const app of oldPlayerApps) {
      if (!app.id) continue;
      try {
        await setDoc(doc(db, 'merchPlayerApplications', app.id), app, { merge: true });
        saveMyId('myPlayerAppIds', app.id);
      } catch (e) { console.error("Migration error (player):", e); }
    }
    localStorage.removeItem('eliteArrowsApplications');
  }

  if (oldRoleApps.length > 0) {
    for (const app of oldRoleApps) {
      if (!app.id) continue;
      try {
        await setDoc(doc(db, 'merchRoleApplications', app.id), app, { merge: true });
        saveMyId('myRoleAppIds', app.id);
      } catch (e) { console.error("Migration error (role):", e); }
    }
    localStorage.removeItem('eliteArrowsRoleApplications');
  }

  if (oldSuggestions.length > 0) {
    for (const sug of oldSuggestions) {
      if (!sug.id) continue;
      try {
        await setDoc(doc(db, 'merchSuggestions', sug.id), sug, { merge: true });
      } catch (e) { console.error("Migration error (suggestion):", e); }
    }
    localStorage.removeItem('eliteArrowsSuggestions');
  }

  if (oldPlayerApps.length > 0 || oldRoleApps.length > 0 || oldSuggestions.length > 0) {
    console.log("Local data migrated to cloud successfully.");
  }
}

function getMyIds(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
}

function saveMyId(key, id) {
  const ids = getMyIds(key);
  if (!ids.includes(id)) {
    ids.push(id);
    localStorage.setItem(key, JSON.stringify(ids));
  }
}

async function fetchApplications() {
  try {
    const myIds = getMyIds('myPlayerAppIds');
    if (myIds.length === 0) return [];

    const q = query(collection(db, 'merchPlayerApplications'), orderBy('submittedAt', 'desc'));
    const snapshot = await getDocs(q);
    // Filter by my IDs to maintain privacy on the public page
    return snapshot.docs
      .map(doc => ({ firestoreId: doc.id, ...doc.data() }))
      .filter(app => myIds.includes(app.id));
  } catch (error) {
    console.error("Error fetching applications:", error);
    return [];
  }
}

async function fetchRoleApplications() {
  try {
    const myIds = getMyIds('myRoleAppIds');
    if (myIds.length === 0) return [];

    const q = query(collection(db, 'merchRoleApplications'), orderBy('submittedAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(doc => ({ firestoreId: doc.id, ...doc.data() }))
      .filter(app => myIds.includes(app.id));
  } catch (error) {
    console.error("Error fetching role applications:", error);
    return [];
  }
}

async function fetchSuggestions() {
  try {
    const q = query(collection(db, 'merchSuggestions'), orderBy('submittedAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    return [];
  }
}

// ---- Rendering Functions ----

function renderApplications(container, apps) {
  if (!container) return;
  if (!apps || apps.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <h3>No applications yet</h3>
        <p>Submit your player application above to get started.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = apps.map(app => {
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

function renderRoleApplications(container, apps) {
  if (!container) return;
  if (!apps || apps.length === 0) {
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

  container.innerHTML = apps.map(app => {
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

function renderSuggestions(container, suggestions) {
  if (!container) return;
  if (!suggestions || suggestions.length === 0) {
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

  container.innerHTML = suggestions.map(s => {
    const statusClass = statusClasses[s.status] || 'status-pending';
    const statusLabel = statusLabels[s.status] || 'New';
    const hasVoted = s.voters && s.voters.includes(voterId);

    return `
      <div class="app-card" data-id="${s.id}">
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
            <button class="btn btn-sm vote-btn ${hasVoted ? 'btn-secondary' : 'btn-primary'}" data-id="${s.id}" ${hasVoted ? 'disabled' : ''}>
              ${hasVoted ? '✓ Voted' : '▲ Vote'}
            </button>
            <span style="color: var(--text-secondary); font-size: 0.9rem; font-weight: 600;">${s.votes || 0} vote${s.votes !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Add event listeners to vote buttons
  container.querySelectorAll('.vote-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      voteSuggestion(e.target.dataset.id);
    });
  });
}

async function voteSuggestion(id) {
  const voterId = localStorage.getItem('sugVoterId');
  if (!voterId) return;

  try {
    const sugRef = doc(db, 'merchSuggestions', id);
    // Fetch latest to check if already voted (double check)
    const snapshot = await getDocs(query(collection(db, 'merchSuggestions'), where('id', '==', id)));
    if (snapshot.empty) return;

    const s = snapshot.docs[0].data();
    if (s.voters && s.voters.includes(voterId)) return;

    await updateDoc(doc(db, 'merchSuggestions', snapshot.docs[0].id), {
      votes: (s.votes || 0) + 1,
      voters: [...(s.voters || []), voterId]
    });

    showToast('Vote recorded!', 'success');
    // Live update will happen via onSnapshot if we use it, otherwise re-fetch
    const updatedSuggestions = await fetchSuggestions();
    renderSuggestions(document.getElementById('suggestionsContainer'), updatedSuggestions);
  } catch (error) {
    console.error("Error voting:", error);
    showToast('Error recording vote', 'error');
  }
}

// ---- Initialization ----

document.addEventListener('DOMContentLoaded', async () => {
  setupMobileMenu();
  await migrateLocalData();

  // Player Application Form
  const form = document.getElementById('applicationForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
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

      // Store in localStorage for "My Applications" view
      saveMyId('myPlayerAppIds', application.id);

      try {
        await setDoc(doc(db, 'merchPlayerApplications', application.id), application);
        showToast('Application submitted successfully!', 'success');
        form.reset();
        const apps = await fetchApplications();
        renderApplications(document.getElementById('applicationsContainer'), apps);
      } catch (error) {
        console.error("Error submitting application:", error);
        showToast('Error submitting application', 'error');
      }
    });
  }

  // Role Application Form
  const roleForm = document.getElementById('roleForm');
  if (roleForm) {
    roleForm.addEventListener('submit', async (e) => {
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

      // Store in localStorage for "My Applications" view
      saveMyId('myRoleAppIds', application.id);

      try {
        await setDoc(doc(db, 'merchRoleApplications', application.id), application);
        showToast('Role application submitted successfully!', 'success');
        roleForm.reset();
        const apps = await fetchRoleApplications();
        renderRoleApplications(document.getElementById('roleApplicationsContainer'), apps);
      } catch (error) {
        console.error("Error submitting role application:", error);
        showToast('Error submitting application', 'error');
      }
    });
  }

  // Suggestions Form
  const sugForm = document.getElementById('suggestionForm');
  if (sugForm) {
    sugForm.addEventListener('submit', async (e) => {
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

      try {
        await setDoc(doc(db, 'merchSuggestions', suggestion.id), suggestion);
        showToast('Suggestion submitted successfully!', 'success');
        sugForm.reset();
        const suggestions = await fetchSuggestions();
        renderSuggestions(document.getElementById('suggestionsContainer'), suggestions);
      } catch (error) {
        console.error("Error submitting suggestion:", error);
        showToast('Error submitting suggestion', 'error');
      }
    });
  }

  // Initial Data Load
  const appsContainer = document.getElementById('applicationsContainer');
  if (appsContainer) {
    const apps = await fetchApplications();
    renderApplications(appsContainer, apps);
  }

  const roleContainer = document.getElementById('roleApplicationsContainer');
  if (roleContainer) {
    const apps = await fetchRoleApplications();
    renderRoleApplications(roleContainer, apps);
  }

  const sugContainer = document.getElementById('suggestionsContainer');
  if (sugContainer) {
    const suggestions = await fetchSuggestions();
    renderSuggestions(sugContainer, suggestions);
  }
});
