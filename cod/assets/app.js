const messages = [
  "🚚 FREE SHIPPING ON ALL ORDERS TODAY ONLY!",
  "🔥 Limited Stock! Order Now!",
  "💳 Pay with Credit Card or COD"
];

const banner = document.getElementById('top-banner');
const ticker = document.createElement('div');
ticker.className = 'ticker';
banner.appendChild(ticker);

// Add messages
messages.forEach(msg => {
    const div = document.createElement('div');
    div.className = 'message';
    div.textContent = msg;
    ticker.appendChild(div);
});

// Clone first message for seamless loop
ticker.appendChild(ticker.firstElementChild.cloneNode(true));

const messageHeight = 24; // same as CSS height
let index = 0;

function slideNext() {
    index++;
    ticker.style.transition = 'transform 0.5s ease-in-out';
    ticker.style.transform = `translateY(-${messageHeight * index}px)`;

    if (index >= messages.length) {
        setTimeout(() => {
            ticker.style.transition = 'none';
            ticker.style.transform = `translateY(0)`;
            index = 0;
        }, 500); // match transition duration
    }
}

// Start interval
setInterval(slideNext, 3000); // every 3 seconds

const MOROCCAN_CITIES = [
    "Casablanca", "Rabat", "Marrakech", "Fes", "Tangier", "Agadir",
    "Meknes", "Oujda", "Kenitra", "Tetouan", "Safi", "Mohammedia",
    "Laayoune", "Khouribga", "Beni Mellal", "El Jadida", "Taza", "Nador"
];

const state = {
    productName: '',
    unitPrice: 0,
    originalPrice: 0,
    currency: '',
    promotions: [],
    size: '',
    color: '',
    quantity: 1,
    selectedPromoId: 'single',
    selectedPromoPrice: 0,
    selectedPromoQty: 1,
    whatsappNumber: ''
};

function calculateTotal() {
    if (state.selectedPromoId === 'single') {
        return {
            total: (state.unitPrice * state.quantity).toFixed(2),
            quantity: state.quantity
        };
    } else {
        return {
            total: state.selectedPromoPrice.toFixed(2),
            quantity: state.selectedPromoQty
        };
    }
}

function updateUI() {
    const result = calculateTotal();

    // Price: value before currency
    document.getElementById('current-price').textContent =
        `${result.total} ${state.currency}`;

    if (state.originalPrice > state.unitPrice) {
        const discount = Math.round((1 - state.unitPrice / state.originalPrice) * 100);
        document.getElementById('original-price').textContent =
            `${state.originalPrice.toFixed(2)} ${state.currency}`;
        document.getElementById('discount-badge').textContent = `-${discount}%`;
        document.getElementById('discount-badge').style.display = 'inline-block';
    }

    document.getElementById('summary-product').textContent = state.productName;
    document.getElementById('summary-size').textContent = state.size || 'N/A';
    document.getElementById('summary-color').textContent = state.color || 'N/A';
    document.getElementById('summary-qty').textContent = result.quantity;
    document.getElementById('summary-total').textContent =
        `${result.total} ${state.currency}`;

    document.getElementById('form-product-name').value = state.productName;
    document.getElementById('form-product-price').value = state.unitPrice.toFixed(2);
    document.getElementById('form-size').value = state.size;
    document.getElementById('form-color').value = state.color;
    document.getElementById('form-quantity').value = result.quantity;
    document.getElementById('form-total-amount').value = `${result.total} ${state.currency}`;

    const waMsg =
        `Hello! I want to order ${state.productName} (Size: ${state.size}, Color: ${state.color}, Qty: ${result.quantity}). Total: ${result.total} ${state.currency}`;
    document.getElementById('whatsapp-link').href =
        `https://wa.me/${state.whatsappNumber}?text=${encodeURIComponent(waMsg)}`;
}

function selectPromo(id, price, qty) {
    state.selectedPromoId = id;
    state.selectedPromoPrice = price;
    state.selectedPromoQty = qty;

    document.querySelectorAll('.promo-card').forEach(b => b.classList.remove('selected'));
    document.querySelector(`[data-id="${id}"]`).classList.add('selected');

    const qtySection = document.getElementById('quantity-section');

    if (state.promotions.length === 0) {
        // No bundle promotions → always show quantity picker
        qtySection.style.display = 'flex';
        document.getElementById('quantity').value = state.quantity;
    } else {
        // Promotions exist → single = picker, bundle = hide picker
        if (id === 'single') {
            qtySection.style.display = 'flex';
            document.getElementById('quantity').value = state.quantity;
        } else {
            qtySection.style.display = 'none';
            state.quantity = qty;
        }
    }

    updateUI();
}

function initProduct(data) {
    state.productName = data.productName;
    state.unitPrice = parseFloat(data.price);
    state.originalPrice = data.originalPrice ? parseFloat(data.originalPrice) : state.unitPrice;
    state.currency = data.currency;
    state.whatsappNumber = data.whatsappNumber || '212661000000';

    state.promotions = Array.isArray(data.promotions)
        ? data.promotions.map((p, i) => ({
            ...p,
            id: `promo_${i}`,
            price: parseFloat(p.price)
        }))
        : [];

    state.selectedPromoPrice = state.unitPrice;
    state.selectedPromoQty = 1;

    document.getElementById('top-banner').textContent =
        data.topBarText || '🚚 FREE SHIPPING ON ALL ORDERS TODAY ONLY!';
    document.getElementById('product-name').textContent = data.productName;

    // Gallery
    const mainImg = document.getElementById('main-img');
    const thumbsContainer = document.getElementById('thumbs-container');
    thumbsContainer.innerHTML = '';
    if (data.gallery && data.gallery.length > 0) {
        mainImg.src = data.gallery[0];
        data.gallery.forEach((src, i) => {
            const thumb = document.createElement('img');
            thumb.src = src;
            thumb.classList.add('thumb');
            if (i === 0) thumb.classList.add('active');
            thumb.addEventListener('click', () => {
                mainImg.src = src;
                document.querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
                thumb.classList.add('active');
            });
            thumbsContainer.appendChild(thumb);
        });
    }

    // Sizes
    if (data.sizes && data.sizes.length > 0) {
        document.getElementById('size-group').style.display = 'block';
        state.size = data.sizes[0];
        const container = document.getElementById('size-buttons');
        container.innerHTML = '';
        data.sizes.forEach((size, i) => {
            const btn = document.createElement('div');
            btn.textContent = size;
            btn.classList.add('option-btn');
            if (i === 0) btn.classList.add('selected');
            btn.addEventListener('click', () => {
                container.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                state.size = size;
                updateUI();
            });
            container.appendChild(btn);
        });
    }

    // Colors
    if (data.colors && data.colors.length > 0) {
        document.getElementById('color-group').style.display = 'block';
        state.color = data.colors[0];
        const container = document.getElementById('color-buttons');
        container.innerHTML = '';
        data.colors.forEach((color, i) => {
            const btn = document.createElement('div');
            btn.textContent = color;
            btn.classList.add('option-btn');
            if (i === 0) btn.classList.add('selected');
            btn.addEventListener('click', () => {
                container.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                state.color = color;
                updateUI();
            });
            container.appendChild(btn);
        });
    }

    // Promotions
    const promoContainer = document.getElementById('promo-buttons');
    promoContainer.innerHTML = '';

    // Always add single unit
    const singleBtn = document.createElement('div');
    singleBtn.classList.add('promo-card');
    singleBtn.setAttribute('data-id', 'single');
    singleBtn.innerHTML = `
        <div class="promo-label">Single Unit</div>
        <div class="promo-price">${state.unitPrice.toFixed(2)} ${state.currency}</div>
        <div class="promo-desc">Per item</div>
    `;
    singleBtn.addEventListener('click', () => selectPromo('single', state.unitPrice, 1));
    promoContainer.appendChild(singleBtn);

    if (state.promotions.length > 0) {
        // Show bundle options
        state.promotions.forEach(promo => {
            const unitCost = (promo.price / promo.quantity).toFixed(2);
            const btn = document.createElement('div');
            btn.classList.add('promo-card');
            btn.setAttribute('data-id', promo.id);
            btn.innerHTML = `
                <div class="promo-label">${promo.quantity}x Bundle</div>
                <div class="promo-price">${promo.price.toFixed(2)} ${state.currency}</div>
                <div class="promo-desc">${unitCost} ${state.currency}/item</div>
            `;
            btn.addEventListener('click', () => selectPromo(promo.id, promo.price, promo.quantity));
            promoContainer.appendChild(btn);
        });

        // Default select first promo
        const firstPromoId = promoContainer.querySelector('.promo-card').getAttribute('data-id');
        selectPromo(firstPromoId,
            firstPromoId === 'single' ? state.unitPrice : state.promotions[0].price,
            firstPromoId === 'single' ? 1 : state.promotions[0].quantity
        );

        document.getElementById('promo-group').style.display = 'block';
    } else {
        // No promotions → hide promo section, show quantity picker
        document.getElementById('promo-group').style.display = 'none';
        document.getElementById('quantity-section').style.display = 'flex';
    }

    // Cities
    const citySelect = document.getElementById('city-select');
    citySelect.innerHTML = '<option value="" disabled selected>Select your city</option>';
    MOROCCAN_CITIES.forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        option.textContent = city;
        citySelect.appendChild(option);
    });

    // Content images
    const contentContainer = document.getElementById('content-images');
    contentContainer.innerHTML = '';
    if (data.contentImages && data.contentImages.length > 0) {
        data.contentImages.forEach(src => {
            const img = document.createElement('img');
            img.src = src;
            contentContainer.appendChild(img);
        });
    }

    updateUI();
}

// Quantity controls
document.getElementById('qty-minus').addEventListener('click', () => {
    if (state.selectedPromoId === 'single' && state.quantity > 1) {
        state.quantity--;
        document.getElementById('quantity').value = state.quantity;
        updateUI();
    }
});

document.getElementById('qty-plus').addEventListener('click', () => {
    if (state.selectedPromoId === 'single') {
        state.quantity++;
        document.getElementById('quantity').value = state.quantity;
        updateUI();
    }
});

// Scroll to order form
document.getElementById('buy-now-btn').addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelector('.order-section').scrollIntoView({ behavior: 'smooth' });
});

document.getElementById('cod-form').addEventListener('submit', (e) => {
    updateUI();
});

// Load JSON
fetch('data/data.json')
    .then(response => {
        if (!response.ok) throw new Error('Failed to load data');
        return response.json();
    })
    .then(data => initProduct(data))
    .catch(error => {
        console.error('Error loading product data:', error);
        document.getElementById('product-name').textContent = 'Error loading product';
        document.getElementById('current-price').textContent = 'Please use a web server';
    });