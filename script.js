// Initial Products Data with Stock
const initialProducts = [
  {
    id: 1,
    name: 'Elite Arrows Jersey',
    category: 'jerseys',
    price: 20.00,
    color: '#1e1b4b',
    image: 'Copilot_20260511_133032.png',
    stock: {
      'Medium': 10,
      'Large': 5,
      'XL': 0
    }
  },
];

// Initialize Data in LocalStorage if not exists
function initData() {
  if (!localStorage.getItem('eliteArrowsProducts')) {
    localStorage.setItem('eliteArrowsProducts', JSON.stringify(initialProducts));
  }
  if (!localStorage.getItem('eliteArrowsOrders')) {
    localStorage.setItem('eliteArrowsOrders', JSON.stringify([]));
  }
}

initData();

const products = JSON.parse(localStorage.getItem('eliteArrowsProducts'));
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

// Add to cart with a unique key based on id, size, and customization
function addToCart(productId) {
  let cart = getCart();
  const product = products.find(p => p.id === productId);

  // Default to first available size or Medium
  const defaultSize = Object.keys(product.stock).find(s => product.stock[s] > 0) || 'Medium';

  const cartKey = `${productId}-${defaultSize}`;
  const existing = cart.find(item => item.cartKey === cartKey);

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      cartKey,
      id: productId,
      qty: 1,
      size: defaultSize,
      customName: '',
      sponsor1: '',
      sponsor2: ''
    });
  }
  saveCart(cart);
  showToast(`${product.name} added to cart!`, 'success');
  if (window.location.pathname.includes('cart.html')) renderCart();
}

function removeFromCart(cartKey) {
  let cart = getCart().filter(item => item.cartKey !== cartKey);
  saveCart(cart);
  renderCart();
}

function updateCartItem(cartKey, field, value) {
  let cart = getCart();
  const item = cart.find(i => i.cartKey === cartKey);
  if (item) {
    item[field] = value;
    // If size changes, update cartKey to keep unique
    if (field === 'size') {
      item.cartKey = `${item.id}-${value}`;
    }
  }
  saveCart(cart);
  renderCart();
}

function updateQty(cartKey, delta) {
  let cart = getCart();
  const item = cart.find(i => i.cartKey === cartKey);
  if (item) {
    item.qty = Math.max(1, item.qty + delta);
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
    : '👕';
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
      : '👕';

    const sizes = Object.keys(product.stock);
    const sizeOptions = sizes.map(s => {
      const isStocked = product.stock[s] > 0;
      return `<option value="${s}" ${item.size === s ? 'selected' : ''} ${!isStocked ? 'disabled' : ''}>${s} ${isStocked ? '' : '(Out of Stock)'}</option>`;
    }).join('');

    return `
      <div class="cart-item animate-fade-in" style="flex-direction: column; align-items: stretch; gap: 15px;">
        <div style="display: flex; gap: 20px;">
          <div class="cart-item-image" style="background: linear-gradient(135deg, ${product.color} 0%, #1e1b4b 100%); font-size: 2rem; display: flex; align-items: center; justify-content: center; overflow: hidden;">
            ${imageHtml}
          </div>
          <div class="cart-item-info">
            <div class="cart-item-name">${product.name}</div>
            <div class="cart-item-price">£${subtotal}</div>
            <div class="cart-item-actions">
              <button class="qty-btn" onclick="updateQty('${item.cartKey}', -1)">−</button>
              <span class="qty-value">${item.qty}</span>
              <button class="qty-btn" onclick="updateQty('${item.cartKey}', 1)">+</button>
              <button class="remove-btn" onclick="removeFromCart('${item.cartKey}')">Remove</button>
            </div>
          </div>
        </div>

        <div class="customization-fields glass" style="padding: 15px; border-radius: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div class="field-group">
            <label style="display: block; font-size: 0.75rem; margin-bottom: 5px; color: var(--accent-cyan);">SIZE</label>
            <select class="form-input" onchange="updateCartItem('${item.cartKey}', 'size', this.value)" style="width: 100%; padding: 8px; border-radius: 8px; background: #ffffff11; border: 1px solid var(--border); color: white;">
              ${sizeOptions}
            </select>
          </div>
          <div class="field-group">
            <label style="display: block; font-size: 0.75rem; margin-bottom: 5px; color: var(--accent-cyan);">YOUR NAME (ON BACK)</label>
            <input type="text" value="${item.customName}" placeholder="Enter name" onchange="updateCartItem('${item.cartKey}', 'customName', this.value)" style="width: 100%; padding: 8px; border-radius: 8px; background: #ffffff11; border: 1px solid var(--border); color: white;">
          </div>
          <div class="field-group">
            <label style="display: block; font-size: 0.75rem; margin-bottom: 5px; color: var(--accent-cyan);">SPONSOR LOGO 1</label>
            <input type="text" value="${item.sponsor1}" placeholder="Logo 1 text" onchange="updateCartItem('${item.cartKey}', 'sponsor1', this.value)" style="width: 100%; padding: 8px; border-radius: 8px; background: #ffffff11; border: 1px solid var(--border); color: white;">
          </div>
          <div class="field-group">
            <label style="display: block; font-size: 0.75rem; margin-bottom: 5px; color: var(--accent-cyan);">SPONSOR LOGO 2</label>
            <input type="text" value="${item.sponsor2}" placeholder="Logo 2 text" onchange="updateCartItem('${item.cartKey}', 'sponsor2', this.value)" style="width: 100%; padding: 8px; border-radius: 8px; background: #ffffff11; border: 1px solid var(--border); color: white;">
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

function processCheckout() {
  const name = document.getElementById('custName').value;
  const address = document.getElementById('custAddress').value;
  const cart = getCart();

  if (!name || !address) {
    showToast('Please fill in your name and address', 'error');
    return;
  }

  // Check if all items have required fields
  const incomplete = cart.some(item => !item.customName || !item.sponsor1 || !item.sponsor2);
  if (incomplete) {
    showToast('Please complete all customization fields', 'error');
    return;
  }

  const orderNumber = 'EA-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  const newOrder = {
    orderNumber,
    customer: { name, address },
    items: cart,
    total: document.getElementById('total').textContent,
    date: new Date().toLocaleString()
  };

  const orders = JSON.parse(localStorage.getItem('eliteArrowsOrders') || '[]');
  orders.push(newOrder);
  localStorage.setItem('eliteArrowsOrders', JSON.stringify(orders));

  // Update stock levels
  const currentProducts = JSON.parse(localStorage.getItem('eliteArrowsProducts'));
  cart.forEach(item => {
    const p = currentProducts.find(prod => prod.id === item.id);
    if (p && p.stock[item.size] !== undefined) {
      p.stock[item.size] = Math.max(0, p.stock[item.size] - item.qty);
    }
  });
  localStorage.setItem('eliteArrowsProducts', JSON.stringify(currentProducts));

  saveCart([]);
  showToast(`Order ${orderNumber} placed successfully!`, 'success');

  setTimeout(() => {
    alert(`Thank you for your order!\nOrder Number: ${orderNumber}`);
    window.location.href = '/';
  }, 1000);
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
