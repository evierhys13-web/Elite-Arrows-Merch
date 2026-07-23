import { db, auth, collection, doc, setDoc, getDocs, query, where, orderBy, onSnapshot, updateDoc, addDoc, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "./firebase-config.js";

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

// ---- Auth Logic ----

let currentUser = null;

function updateAuthUI(user) {
  currentUser = user;
  const sidebarAuth = document.getElementById('sidebarAuth');
  const navLogin = document.getElementById('navLoginContainer');
  const mobileNavLogin = document.getElementById('mobileNavLoginContainer');
  const displayEmail = document.getElementById('displayEmail');
  const roleDisplayEmail = document.getElementById('roleDisplayEmail');
  const heroActions = document.getElementById('heroActions');

  const loginHtml = `
    <button class="nav-item" style="background: none; border: none; width: 100%; cursor: pointer;" id="openLoginBtn">
      <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
      Login to Member Account
    </button>
  `;

  const logoutHtml = `
    <button class="nav-item" style="background: none; border: none; width: 100%; cursor: pointer; color: var(--error);" id="logoutBtn">
      <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
      Logout
    </button>
  `;

  if (navLogin) {
    navLogin.innerHTML = user ? logoutHtml : loginHtml;
    const btn = user ? document.getElementById('logoutBtn') : document.getElementById('openLoginBtn');
    if (btn) {
      btn.onclick = () => {
        if (user) signOut(auth);
        else document.getElementById('authModal').classList.add('show');
      };
    }
  }

  if (mobileNavLogin) {
    mobileNavLogin.innerHTML = user ? `
      <div class="auth-user-card" style="margin-bottom: 8px;">
        <div class="auth-status-dot"></div>
        <div class="auth-user-info"><span class="auth-user-email">${user.email}</span></div>
      </div>
      <button class="btn btn-secondary btn-sm" style="width: 100%;" id="mobileLogoutBtn">Logout</button>
    ` : `
      <button class="btn btn-primary btn-sm" style="width: 100%;" id="mobileLoginBtn">Login to Member Account</button>
    `;
    const mBtn = user ? document.getElementById('mobileLogoutBtn') : document.getElementById('mobileLoginBtn');
    if (mBtn) {
      mBtn.onclick = () => {
        if (user) signOut(auth);
        else {
          document.getElementById('authModal').classList.add('show');
          const overlay = document.getElementById('mobileOverlay');
          const nav = document.getElementById('mobileNav');
          if (overlay && nav) {
            overlay.classList.remove('open');
            nav.classList.remove('open');
          }
        }
      };
    }
  }

  if (sidebarAuth) {
    if (user) {
      sidebarAuth.innerHTML = `
        <div class="auth-user-card">
          <div class="auth-status-dot"></div>
          <div class="auth-user-info">
            <span class="auth-user-email" style="font-weight: 600;">Member Active</span>
            <span class="auth-user-email">${user.email}</span>
          </div>
        </div>
      `;
    } else {
      sidebarAuth.innerHTML = `
        <p style="font-size: 0.75rem; color: var(--text-muted); text-align: center; margin-bottom: 8px;">Log in to manage applications</p>
        <button class="btn btn-primary btn-sm" style="width: 100%;" id="sidebarLoginBtn">Login</button>
      `;
      const sLogin = document.getElementById('sidebarLoginBtn');
      if (sLogin) sLogin.onclick = () => document.getElementById('authModal').classList.add('show');
    }
  }

  if (heroActions) {
    if (user) {
      heroActions.innerHTML = `
        <button class="btn btn-primary" id="checkStatusBtn">Check Application Status</button>
        <a href="https://chat.whatsapp.com/GNaYyJDxzMADbA1ARI1kne" target="_blank" rel="noopener noreferrer" class="btn btn-green">WhatsApp Community</a>
      `;
      document.getElementById('checkStatusBtn').onclick = checkForStatusUpdates;
    } else {
      heroActions.innerHTML = `
        <button class="btn btn-primary" id="heroLoginBtn">Login to Check Status</button>
        <a href="https://chat.whatsapp.com/GNaYyJDxzMADbA1ARI1kne" target="_blank" rel="noopener noreferrer" class="btn btn-green">WhatsApp Community</a>
      `;
      const hLogin = document.getElementById('heroLoginBtn');
      if (hLogin) hLogin.onclick = () => document.getElementById('authModal').classList.add('show');
    }
  }

  if (displayEmail) displayEmail.value = user ? user.email : '';
  if (roleDisplayEmail) roleDisplayEmail.value = user ? user.email : '';

  if (user) {
    checkForStatusUpdates();
    refreshMyData();
  }
}

async function handleLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const pass = document.getElementById('loginPassword').value;
  const btn = document.getElementById('doLogin');

  if (!email || !pass) {
    showToast('Please enter email and password', 'error');
    return;
  }

  try {
    btn.disabled = true;
    btn.textContent = 'Logging in...';
    await signInWithEmailAndPassword(auth, email, pass);
    document.getElementById('authModal').classList.remove('show');
    showToast('Logged in successfully!', 'success');
  } catch (error) {
    console.error("Login error:", error);
    showToast('Login failed: ' + error.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Login';
  }
}

onAuthStateChanged(auth, (user) => {
  updateAuthUI(user);
});

// ---- Site Notification Modal ----

function injectStatusModal() {
  if (document.getElementById('statusUpdateModal')) return;

  const modalHtml = `
    <div id="statusUpdateModal" class="modal-overlay">
      <div class="modal-card animate-slide-up">
        <div id="modalIcon" class="modal-icon"></div>
        <h2 id="modalTitle" class="modal-title"></h2>
        <div id="modalText" class="modal-text"></div>
        <button class="btn btn-primary modal-btn" id="closeStatusModal">Continue to Site</button>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);

  document.getElementById('closeStatusModal').onclick = () => {
    document.getElementById('statusUpdateModal').classList.remove('show');
  };
}

async function checkForStatusUpdates() {
  if (!currentUser) return;

  injectStatusModal();

  const categories = [
    { collection: 'merchPlayerApplications', type: 'Player' },
    { collection: 'merchRoleApplications', type: 'Role' }
  ];

  for (const cat of categories) {
    try {
      const q = query(collection(db, cat.collection), where('email', '==', currentUser.email));
      const snapshot = await getDocs(q);

      snapshot.forEach(doc => {
        const app = doc.data();
        const lastSeen = localStorage.getItem(`lastSeenStatus_${app.id}`);

        if (app.status !== 'pending' && app.status !== lastSeen) {
          showStatusNotification(app, cat.type);
          localStorage.setItem(`lastSeenStatus_${app.id}`, app.status);
        }
      });
    } catch (e) {
      console.error("Error checking status:", e);
    }
  }
}

function showStatusNotification(app, type) {
  const modal = document.getElementById('statusUpdateModal');
  const icon = document.getElementById('modalIcon');
  const title = document.getElementById('modalTitle');
  const text = document.getElementById('modalText');

  const isApproved = app.status === 'approved' || app.status === 'onboarding_complete';
  const isRejected = app.status === 'rejected';

  if (isApproved) {
    icon.className = 'modal-icon success';
    icon.innerHTML = '🎉';
    title.textContent = 'Application Approved!';
    text.innerHTML = `Congratulations ${escapeHtml(app.fullName)}!<br><br>Your application for <strong>${type}</strong> has been approved. We'll be contacting you shortly to arrange a quick 5-10 minute interview.`;
  } else if (isRejected) {
    icon.className = 'modal-icon error';
    icon.innerHTML = '✉️';
    title.textContent = 'Application Update';
    text.innerHTML = `Hello ${escapeHtml(app.fullName)},<br><br>Thank you for applying for a <strong>${type}</strong> position. Unfortunately, we aren't moving forward with your application at this time. We wish you the best of luck!`;
  } else {
    return;
  }

  modal.classList.add('show');
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
      } catch (e) { /* Likely permission error before rules deploy */ }
    }
    localStorage.removeItem('eliteArrowsApplications');
  }

  if (oldRoleApps.length > 0) {
    for (const app of oldRoleApps) {
      if (!app.id) continue;
      try {
        await setDoc(doc(db, 'merchRoleApplications', app.id), app, { merge: true });
        saveMyId('myRoleAppIds', app.id);
      } catch (e) { /* Likely permission error before rules deploy */ }
    }
    localStorage.removeItem('eliteArrowsRoleApplications');
  }

  if (oldSuggestions.length > 0) {
    for (const sug of oldSuggestions) {
      if (!sug.id) continue;
      try {
        await setDoc(doc(db, 'merchSuggestions', sug.id), sug, { merge: true });
      } catch (e) { /* Likely permission error before rules deploy */ }
    }
    localStorage.removeItem('eliteArrowsSuggestions');
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
    const userEmail = currentUser ? currentUser.email : null;

    if (myIds.length === 0 && !userEmail) return [];

    const q = query(collection(db, 'merchPlayerApplications'), orderBy('submittedAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs
      .map(doc => ({ firestoreId: doc.id, ...doc.data() }))
      .filter(app => myIds.includes(app.id) || (userEmail && app.email === userEmail));
  } catch (error) {
    console.error("Error fetching applications:", error);
    return [];
  }
}

async function fetchRoleApplications() {
  try {
    const myIds = getMyIds('myRoleAppIds');
    const userEmail = currentUser ? currentUser.email : null;

    if (myIds.length === 0 && !userEmail) return [];

    const q = query(collection(db, 'merchRoleApplications'), orderBy('submittedAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(doc => ({ firestoreId: doc.id, ...doc.data() }))
      .filter(app => myIds.includes(app.id) || (userEmail && app.email === userEmail));
  } catch (error) {
    console.error("Error fetching role applications:", error);
    return [];
  }
}

async function refreshMyData() {
  const playerContainer = document.getElementById('applicationsContainer');
  const roleContainer = document.getElementById('roleApplicationsContainer');

  if (playerContainer) {
    const apps = await fetchApplications();
    renderApplications(playerContainer, apps);
  }
  if (roleContainer) {
    const apps = await fetchRoleApplications();
    renderRoleApplications(roleContainer, apps);
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

  container.querySelectorAll('.vote-btn').forEach(btn => {
    btn.onclick = (e) => voteSuggestion(e.target.dataset.id);
  });
}

async function voteSuggestion(id) {
  const voterId = localStorage.getItem('sugVoterId');
  if (!voterId) return;

  try {
    const snapshot = await getDocs(query(collection(db, 'merchSuggestions'), where('id', '==', id)));
    if (snapshot.empty) return;

    const s = snapshot.docs[0].data();
    if (s.voters && s.voters.includes(voterId)) return;

    await updateDoc(doc(db, 'merchSuggestions', snapshot.docs[0].id), {
      votes: (s.votes || 0) + 1,
      voters: [...(s.voters || []), voterId]
    });

    showToast('Vote recorded!', 'success');
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

  // Explicitly call updateAuthUI(null) to ensure login button shows up immediately
  updateAuthUI(null);

  const closeAuthBtn = document.getElementById('closeAuthModal');
  if (closeAuthBtn) {
    closeAuthBtn.onclick = () => document.getElementById('authModal').classList.remove('show');
  }

  const loginBtn = document.getElementById('doLogin');
  if (loginBtn) {
    loginBtn.onclick = handleLogin;
  }

  // Player Application Form
  const form = document.getElementById('applicationForm');
  if (form) {
    form.onsubmit = async (e) => {
      e.preventDefault();

      if (!currentUser) {
        showToast('Please login to submit an application', 'error');
        document.getElementById('authModal').classList.add('show');
        return;
      }

      const application = {
        id: 'EA-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase(),
        fullName: document.getElementById('fullName').value.trim(),
        email: currentUser.email,
        userId: currentUser.uid,
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

      try {
        const docRef = await addDoc(collection(db, 'merchPlayerApplications'), application);
        saveMyId('myPlayerAppIds', docRef.id);
        showToast('Application submitted successfully!', 'success');
        form.reset();
        refreshMyData();
      } catch (error) {
        console.error("Error submitting application:", error);
        showToast('Error: ' + error.message, 'error');
      }
    };
  }

  // Role Application Form
  const roleForm = document.getElementById('roleForm');
  if (roleForm) {
    roleForm.onsubmit = async (e) => {
      e.preventDefault();

      if (!currentUser) {
        showToast('Please login to submit an application', 'error');
        document.getElementById('authModal').classList.add('show');
        return;
      }

      const application = {
        id: 'EA-ROLE-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase(),
        fullName: document.getElementById('roleFullName').value.trim(),
        email: currentUser.email,
        userId: currentUser.uid,
        position: document.getElementById('rolePosition').value,
        experience: document.getElementById('roleExperience').value.trim(),
        availability: document.getElementById('roleAvailability').value,
        type: 'role',
        status: 'pending',
        submittedAt: new Date().toISOString(),
      };

      try {
        const docRef = await addDoc(collection(db, 'merchRoleApplications'), application);
        saveMyId('myRoleAppIds', docRef.id);
        showToast('Role application submitted successfully!', 'success');
        roleForm.reset();
        refreshMyData();
      } catch (error) {
        console.error("Error submitting role application:", error);
        showToast('Error: ' + error.message, 'error');
      }
    };
  }

  // Suggestions Form
  const sugForm = document.getElementById('suggestionForm');
  if (sugForm) {
    sugForm.onsubmit = async (e) => {
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
        await addDoc(collection(db, 'merchSuggestions'), suggestion);
        showToast('Suggestion submitted successfully!', 'success');
        sugForm.reset();
        const suggestions = await fetchSuggestions();
        renderSuggestions(document.getElementById('suggestionsContainer'), suggestions);
      } catch (error) {
        showToast('Error: ' + error.message, 'error');
      }
    };
  }

  // Initial Data Load
  refreshMyData();
  const sugContainer = document.getElementById('suggestionsContainer');
  if (sugContainer) {
    const suggestions = await fetchSuggestions();
    renderSuggestions(sugContainer, suggestions);
  }
});
