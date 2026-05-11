const products = [
  { id: 1, name: 'Elite Arrows Jersey', category: 'jerseys', price: 20.00, color: '#1e1b4b', image: 'Copilot_20260511_133032.png' },
];

const featuredIds = [1];

function getCart() {
  try {
    return JSON.parse(localStorage.getItem('eliteArrowsCart')) || [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem('eliteArrowsCart', JSON.stringify(cart));
  updateBadge();
}

function updateBadge() {
  const badge = document.getElementById('cartBadge');
  if (badge) {
    const cart = getCart();
    const count = cart.reduce((sum, item) => sum + item.qty, 0);
    badge.textContent = count;
  }
}

function addToCart(productId) {
  let cart = getCart();
  const existing = cart.find(item => item.id === productId);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id: productId, qty: 1 });
  }
  saveCart(cart);
  const product = products.find(p => p.id === productId);
  showToast(`${product.name} added to cart!`, 'success');
}

function removeFromCart(productId) {
  let cart = getCart().filter(item => item.id !== productId);
  saveCart(cart);
  renderCart();
}

function updateQty(productId, delta) {
  let cart = getCart();
  const item = cart.find(i => i.id === productId);
  if (item) {
    item.qty = Math.max(1, item.qty + delta);
    if (item.qty === 0) {
      cart = cart.filter(i => i.id !== productId);
    }
  }
  saveCart(cart);
  renderCart();
}

function showToast(message, type) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.className = 'toast ' + (type || '');
  toast.innerHTML = `<span class="toast-icon">${type === 'success' ? '✓' : 'ℹ'}</span> ${message}`;
  toast.classList.add('show');
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => toast.classList.remove('show'), 2500);
}

function createProductCard(product) {
  const div = document.createElement('div');
  div.className = 'product-card animate-fade-in';
  div.dataset.category = product.category;
  const imageHtml = product.image
    ? `<img src="${product.image}" alt="${product.name}" style="width: 100%; height: 100%; object-fit: cover;">`
    : product.emoji;
  div.innerHTML = `
    <div class="product-image" style="background: linear-gradient(135deg, ${product.color} 0%, #1e1b4b 100%); font-size: 3rem; display: flex; align-items: center; justify-content: center; overflow: hidden;">
      ${imageHtml}
    </div>
    <div class="product-body">
      <div class="product-category">${product.category}</div>
      <div class="product-name">${product.name}</div>
      <div class="product-price">£${product.price.toFixed(2)}</div>
      <div class="product-footer">
        <button class="btn btn-primary btn-sm" onclick="addToCart(${product.id})">
          Add to Cart
        </button>
      </div>
    </div>
  `;
  return div;
}

function renderCart() {
  const cart = getCart();
  const emptyEl = document.getElementById('emptyCart');
  const listEl = document.getElementById('cartItemsList');
  const summaryEl = document.getElementById('orderSummary');

  if (cart.length === 0) {
    if (emptyEl) emptyEl.style.display = 'block';
    if (listEl) listEl.style.display = 'none';
    if (summaryEl) summaryEl.style.display = 'none';
    updateBadge();
    return;
  }

  if (emptyEl) emptyEl.style.display = 'none';
  if (listEl) listEl.style.display = 'block';
  if (summaryEl) summaryEl.style.display = 'block';

  listEl.innerHTML = cart.map(item => {
    const product = products.find(p => p.id === item.id);
    if (!product) return '';
    const subtotal = (product.price * item.qty).toFixed(2);
    const imageHtml = product.image
      ? `<img src="${product.image}" alt="${product.name}" style="width: 100%; height: 100%; object-fit: cover;">`
      : product.emoji;
    return `
      <div class="cart-item animate-fade-in">
        <div class="cart-item-image" style="background: linear-gradient(135deg, ${product.color} 0%, #1e1b4b 100%); font-size: 2rem; display: flex; align-items: center; justify-content: center; overflow: hidden;">
          ${imageHtml}
        </div>
        <div class="cart-item-info">
          <div class="cart-item-name">${product.name}</div>
          <div class="cart-item-price">£${subtotal}</div>
          <div class="cart-item-actions">
            <button class="qty-btn" onclick="updateQty(${product.id}, -1)">−</button>
            <span class="qty-value">${item.qty}</span>
            <button class="qty-btn" onclick="updateQty(${product.id}, 1)">+</button>
            <button class="remove-btn" onclick="removeFromCart(${product.id})">Remove</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  const subtotal = cart.reduce((sum, item) => {
    const p = products.find(prod => prod.id === item.id);
    return sum + (p ? p.price * item.qty : 0);
  }, 0);

  const shipping = subtotal >= 50 ? 0 : 5.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  const fmt = n => '£' + n.toFixed(2);
  document.getElementById('subtotal').textContent = fmt(subtotal);
  document.getElementById('shipping').textContent = shipping === 0 ? 'FREE' : fmt(shipping);
  document.getElementById('tax').textContent = fmt(tax);
  document.getElementById('total').textContent = fmt(total);

  updateBadge();
}

function renderProducts(gridId, productList) {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  grid.innerHTML = '';
  productList.forEach(product => {
    grid.appendChild(createProductCard(product));
  });
}

function setupFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  if (!filterBtns.length) return;
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      const filtered = filter === 'all'
        ? products
        : products.filter(p => p.category === filter);
      renderProducts('productsGrid', filtered);
    });
  });
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
  updateBadge();
  setupMobileMenu();

  const featuredGrid = document.getElementById('featuredGrid');
  if (featuredGrid) {
    const featured = products.filter(p => featuredIds.includes(p.id));
    renderProducts('featuredGrid', featured);
  }

  if (document.getElementById('productsGrid')) {
    renderProducts('productsGrid', products);
    setupFilters();
  }

  if (document.getElementById('cartItems')) {
    renderCart();
  }
});
