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

function getApplicationCount() {
  return getApplications().length;
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
    nav.classList.remove('open');
  }

  menuBtn.addEventListener('click', () => {
    overlay.classList.toggle('open');
    nav.classList.toggle('open');
  });

  overlay.addEventListener('click', close);
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
}

document.addEventListener('DOMContentLoaded', () => {
  setupMobileMenu();

  const form = document.getElementById('applicationForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const fullName = document.getElementById('fullName').value.trim();
      const email = document.getElementById('email').value.trim();
      const age = parseInt(document.getElementById('age').value);
      const location = document.getElementById('location').value.trim();
      const experience = document.getElementById('experience').value;
      const avgScore = parseFloat(document.getElementById('avgScore').value) || 0;
      const whyJoin = document.getElementById('whyJoin').value.trim();
      const availability = document.getElementById('availability').value;
      const referral = document.getElementById('referral').value.trim();

      const application = {
        id: 'EA-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase(),
        fullName,
        email,
        age,
        location,
        experience,
        avgScore,
        whyJoin,
        availability,
        referral,
        status: 'pending',
        submittedAt: new Date().toISOString(),
      };

      const apps = getApplications();
      apps.push(application);
      saveApplications(apps);

      showToast('Application submitted successfully! We\'ll be in touch.', 'success');
      form.reset();

      setTimeout(() => {
        window.location.href = 'applications.html';
      }, 1200);
    });
  }

  // Applications page
  const appsContainer = document.getElementById('applicationsContainer');
  if (appsContainer) {
    renderApplications(appsContainer);
  }

  const pendingCount = document.getElementById('pendingCount');
  if (pendingCount) {
    const apps = getApplications();
    const pending = apps.filter(a => a.status === 'pending').length;
    pendingCount.textContent = pending;
  }
});

function renderApplications(container) {
  const apps = getApplications();

  if (apps.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <h3>No applications yet</h3>
        <p>Submit your application on the home page to get started.</p>
        <a href="/" class="btn btn-primary">Apply Now</a>
      </div>
    `;
    return;
  }

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
          <div class="app-detail"><span class="detail-label">Age:</span> ${app.age}</div>
          <div class="app-detail"><span class="detail-label">Location:</span> ${escapeHtml(app.location)}</div>
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

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
