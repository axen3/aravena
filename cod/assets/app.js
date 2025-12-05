const messages = [
  "🚚 FREE SHIPPING ON ALL ORDERS TODAY ONLY!",
  "🔥 Limited Stock! Order Now!",
  "💳 Pay with Credit Card or COD"
];

const banner = document.getElementById('top-banner');

// 1. Clear any existing HTML (like ticker-wrapper) to ensure clean structure
banner.innerHTML = '';

const ticker = document.createElement('div');
ticker.className = 'ticker';
banner.appendChild(ticker);

// Add messages
messages.forEach(msg => {
    const div = document.createElement('div');
    div.className = 'message';
    div.innerHTML = msg; // Use innerHTML to allow icons if needed
    ticker.appendChild(div);
});

// Clone first message for seamless loop
ticker.appendChild(ticker.firstElementChild.cloneNode(true));

// 2. THIS MUST MATCH CSS HEIGHT EXACTLY (36px)
const messageHeight = 36; 
let index = 0;

function slideNext() {
    index++;
    ticker.style.transition = 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)';
    ticker.style.transform = `translateY(-${messageHeight * index}px)`;

    // Reset loop
    if (index >= messages.length) {
        setTimeout(() => {
            ticker.style.transition = 'none'; // Remove animation for instant jump
            index = 0;
            ticker.style.transform = `translateY(0)`;
        }, 500); // Wait for animation to finish
    }
}

// Start interval
setInterval(slideNext, 3000);

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

    // document.getElementById('top-banner').textContent = data.topBarText || '🚚 FREE SHIPPING ON ALL ORDERS TODAY ONLY!'; // REMOVED: Conflicted with the sliding banner
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
        
        // Helper to extract key/value from the specific JSON format: {"Red": "#FF0000"}
        const getFirstColorData = (colorObj) => {
            const name = Object.keys(colorObj)[0];
            return { name: name, hex: colorObj[name] };
        };

        // Set initial state
        const firstColor = getFirstColorData(data.colors[0]);
        state.color = firstColor.name;
        document.getElementById('selected-color-name').textContent = `: ${firstColor.name}`;

        const container = document.getElementById('color-buttons');
        container.innerHTML = '';

        data.colors.forEach((colorObj, i) => {
            const { name, hex } = getFirstColorData(colorObj);
            
            const btn = document.createElement('div');
            btn.classList.add('color-btn'); // Use the new CSS class
            btn.style.backgroundColor = hex; // Apply Hex code
            btn.title = name; // Tooltip on hover
            
            if (i === 0) btn.classList.add('selected');

            btn.addEventListener('click', () => {
                container.querySelectorAll('.color-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                
                // Update State
                state.color = name;
                
                // Update the text label next to "Color"
                document.getElementById('selected-color-name').textContent = `: ${name}`;
                
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
    const citySelect = document.getElementById('city');
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
    // Keep this line for UI updates, but the main submission logic is below
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


// =========================================================================
// NEW VALIDATION AND FORM SUBMISSION LOGIC
// =========================================================================

/**
 * Displays or clears an error message for a given field.
 * @param {string} fieldId - The ID of the input field (e.g., 'fullname').
 * @param {string} message - The error message to display. Clears if empty.
 */
function validateField(fieldId, message) {
    const inputElement = document.getElementById(fieldId);
    const errorElement = document.getElementById(`error-${fieldId}`);
    
    if (message) {
        errorElement.textContent = message;
        inputElement.classList.add('error');
        // Scroll to the first error
        if (!document.querySelector('.order-section .error-message:not(:empty)')) {
             inputElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    } else {
        errorElement.textContent = '';
        inputElement.classList.remove('error');
    }
}

/**
 * Validates all form fields based on specified rules.
 * @returns {boolean} True if the form is valid, otherwise false.
 */
function validateForm() {
    let isValid = true;
    
    // 1. Full Name Validation (No numbers/special chars, remove leading/trailing space)
    const fullnameInput = document.getElementById('fullname');
    let fullnameValue = fullnameInput.value.trim(); // Trim leading/trailing spaces
    fullnameInput.value = fullnameValue; // Update the input value with the trimmed version

    // Regex: /^[a-zA-Z\s]{3,}$/ - minimum 3 characters, only letters and spaces allowed.
    const fullnameRegex = /^[a-zA-Z\s]{3,}$/;
    
    if (!fullnameValue) {
        validateField('fullname', 'Full Name is required.');
        isValid = false;
    } else if (!fullnameRegex.test(fullnameValue)) {
        validateField('fullname', 'Name can only contain letters and spaces.');
        isValid = false;
    } else {
        validateField('fullname', '');
    }

    // 2. Phone Number Validation (10 digits, starts with 0)
    const phoneValue = document.getElementById('phone').value.trim();
    // Regex: /^0\d{9}$/ - starts with 0, followed by exactly 9 digits, total 10 digits.
    const phoneRegex = /^0\d{9}$/; 
    
    if (!phoneRegex.test(phoneValue)) {
        validateField('phone', 'Phone must be 10 digits and start with 0 (e.g., 06XXXXXXXX).');
        isValid = false;
    } else {
        validateField('phone', '');
    }
    
    // 3. City Selection Validation (Must select a city)
    const cityValue = document.getElementById('city').value;
    
    if (!cityValue) {
        validateField('city', 'Please select your city.');
        isValid = false;
    } else {
        validateField('city', '');
    }
    
    // 4. Delivery Address Validation (Must be filled, min 10 chars for detail)
    const addressValue = document.getElementById('address').value.trim();
    
    if (addressValue.length < 10) {
        validateField('address', 'Please enter a detailed delivery address (min 10 characters).');
        isValid = false;
    } else {
        validateField('address', '');
    }

    return isValid;
}


// handle form submission
document.getElementById('cod-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    updateUI(); // Update final summary before validation/submission

    // --- Validation Check ---
    if (!validateForm()) {
        // If validation fails, stop the submission
        return; 
    }
    // --- Validation Passed ---

    const formData = new FormData();
    formData.append('fullname', document.getElementById('fullname').value.trim());
    formData.append('phone', document.getElementById('phone').value.trim());
    formData.append('city', document.getElementById('city').value);
    formData.append('address', document.getElementById('address').value.trim());
    formData.append('itemOptions', `Size: ${state.size}, Color: ${state.color}, Qty: ${state.quantity}`);
    formData.append('totalPrice', document.getElementById('summary-total').textContent);

    const webAppUrl = 'YOUR_WEB_APP_URL_HERE'; // replace with your Web App URL

    try {
        const response = await fetch(webAppUrl, {
            method: 'POST',
            body: formData
        });

        const result = await response.text();
        if(result === 'success'){
            alert('Order placed successfully!');
            window.location.href = 'thankyou.html';
        } else {
            alert('Error submitting order: ' + result);
        }

    } catch (err) {
        console.error(err);
        alert('Failed to submit order');
    }
});