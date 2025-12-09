function initMessages(data) {
    const messages = data.topBarText || [];
    const banner = document.getElementById('top-banner');
    const messageHeight = 36;
    let index = 0;
    let intervalId;

    // Clear banner
    banner.innerHTML = '';

    // Create ticker container
    const ticker = document.createElement('div');
    ticker.className = 'ticker';
    banner.appendChild(ticker);

    // Add messages
    messages.forEach(msg => {
        const div = document.createElement('div');
        div.className = 'message';
        div.innerHTML = msg;
        ticker.appendChild(div);
    });

    // Clone first message for seamless loop
    if (messages.length > 0) {
        ticker.appendChild(ticker.firstElementChild.cloneNode(true));
    }

    function slideNext() {
        index++;
        ticker.style.transition = 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)';
        ticker.style.transform = `translateY(-${messageHeight * index}px)`;

        if (index >= messages.length) {
            setTimeout(() => {
                ticker.style.transition = 'none';
                index = 0;
                ticker.style.transform = `translateY(0)`;
            }, 500);
        }
    }

    intervalId = setInterval(slideNext, 3000);
}
// languages
let translations = {};

async function loadTranslations() {
    const response = await fetch("data/langs.json");
    translations = await response.json();   // step 1: load JSON

    applyLanguage();  // step 2: update all text AFTER JSON is ready
}

function applyLanguage() {
    const lang = document.documentElement.lang;  // "en" or "ar"
    const dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.dir = dir;

    document.querySelectorAll("[data-key]").forEach(el => {
        const key = el.getAttribute("data-key");
        el.textContent = translations[lang][key] || key;
    });
}
// countdown
let time = 3 * 60 * 60; // 3 hours in seconds
const timer = document.getElementById("timer");

setInterval(() => {
  let hrs = Math.floor(time / 3600);
  let mins = Math.floor((time % 3600) / 60);
  let secs = time % 60;

  timer.innerText = 
    `${hrs < 10 ? "0" + hrs : hrs}:` +
    `${mins < 10 ? "0" + mins : mins}:` +
    `${secs < 10 ? "0" + secs : secs}`;

  if (time > 0) time--;
}, 1000);
// Fake live viewers
setInterval(() => {
  document.getElementById("viewers").innerText =
    Math.floor(25 + Math.random() * 15);
}, 3000);

// Fake decreasing stock (stops at 3)
let stock = 6;
setInterval(() => {
  if (stock > 3) {
    stock--;
    document.getElementById("stock").innerText = stock;
  }
}, 15000);
const MOROCCAN_CITIES = [
        "Agadir",
        "Ahfir",
        "Aïn Bni Mathar",
        "Aïn Defali",
        "Aïn El Aouda",
        "Aït Benhaddou",
        "Aït Iaaza",
        "Al Hoceïma",
        "Arbaoua",
        "Asilah",
        "Bab Berred",
        "Béni Mellal",
        "Ben Slimane",
        "Berkane",
        "Berrechid",
        "Bhalil",
        "Boujdour",
        "Boulemane",
        "Boumia",
        "Bouznika",
        "Casablanca",
        "Chefchaouen",
        "Chichaoua",
        "Dakhla",
        "Dar Gueddari",
        "Dar Kebdani",
        "Demnate",
        "Driouch",
        "El Aioun Sidi Mellouk",
        "El Guerdane",
        "El Hajeb",
        "El Jadida",
        "Erfoud",
        "Errachidia",
        "Essaouira",
        "Fès",
        "Figuig",
        "Fnideq",
        "Fquih Ben Salah",
        "Guelmim",
        "Goulmima",
        "Guercif",
        "Had Kourt",
        "Ifrane",
        "Imilchil",
        "Imouzzer Kandar",
        "Inezgane",
        "Issaouen (Ketama)",
        "Jerada",
        "Kénitra",
        "Khémisset",
        "Khouribga",
        "Khénifra",
        "Ksar El Kébir",
        "Laâyoune",
        "Larache",
        "Marrakech",
        "Martil",
        "M'diq",
        "Mohammédia",
        "Midelt",
        "Moulay Idriss Zerhoun",
        "Nador",
        "Ouarzazate",
        "Oualidia",
        "Oujda",
        "Oulad Teïma",
        "Rabat",
        "Safi",
        "Saïdia",
        "Salé",
        "Témara",
        "Tanger",
        "Tarfaya",
        "Taza",
        "Tétouan",
        "Tiznit",
        "Taroudant"
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
    whatsappNumber: '',
    whatsappMsg: ''
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
    `${state.whatsappMsg}\n📦 *${state.productName}*\n🎨 Color: *${state.color}*\n📏 Size: *${state.size}*\n🔢 Qty: *${result.quantity}*\n💰 Total: *${result.total} ${state.currency}*`;
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
  //initMessages(data);
    state.productName = data.productName;
    state.unitPrice = parseFloat(data.price);
    state.originalPrice = data.originalPrice ? parseFloat(data.originalPrice) : state.unitPrice;
    state.currency = data.currency;
    state.whatsappNumber = data.whatsappNumber || '+21206';
    state.whatsappMsg = data.whatsappMsg || '';

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

/* ============================================================
   UNIVERSAL PLACEHOLDER FOR ALL IMAGES ON THE PAGE
   ============================================================ */
function applyImagePlaceholders() {
    const images = document.querySelectorAll('img');

    images.forEach(img => {
        if (img.dataset.placeholderApplied) return;

        img.dataset.placeholderApplied = "true";
        img.classList.add("placeholder");

        img.addEventListener("load", () => {
            img.classList.remove("placeholder");
            img.classList.add("loaded");
        });

        img.addEventListener("error", () => {
            img.classList.add("placeholder");
        });
    });
}

// Apply on load
applyImagePlaceholders();

// Apply to any new images added later
const observer = new MutationObserver(applyImagePlaceholders);
observer.observe(document.body, { childList: true, subtree: true });



/* ============================================================
   GALLERY WITH FADE + PLACEHOLDER + THUMB UPDATES
   ============================================================ */
const mainImg = document.getElementById('main-img');
const thumbsContainer = document.getElementById('thumbs-container');

if (data.gallery?.length) {
    thumbsContainer.innerHTML = "";

    // Initial main image
    mainImg.src = data.gallery[0];

    data.gallery.forEach((src, i) => {
        const thumb = document.createElement("img");
        thumb.src = src;
        thumb.className = "thumb";
        if (i === 0) thumb.classList.add("active");

        // Preload for smooth switching
        new Image().src = src;

        thumb.addEventListener("click", () => {
            if (mainImg.src === thumb.src) return;

            // Fade out old image
            mainImg.classList.add("fade-out");

            // Swap to new img when faded
            setTimeout(() => {
                mainImg.src = src;

                // Fade-in new image
                mainImg.classList.remove("fade-out");
                mainImg.classList.add("fade-in");

                setTimeout(() => mainImg.classList.remove("fade-in"), 250);
            }, 200);

            // Update active thumb
            Array.from(thumbsContainer.children)
                .forEach(t => t.classList.remove("active"));
            thumb.classList.add("active");
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
        document.getElementById('selected-color-name').textContent = `${firstColor.name}`;

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
                document.getElementById('selected-color-name').textContent = `${name}`;

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
    citySelect.innerHTML = '<option value="" disabled selected data-key="select_city">Select your city</option>';
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
    .then(data => {
      initMessages(data);
      initProduct(data);
      loadTranslations();
    })
    .catch(error => {
        console.error('Error loading product data:', error);
        document.getElementById('product-name').textContent = 'Error loading product';
        document.getElementById('current-price').textContent = 'Please use a web server';
    });
// ======== Form Validation =============
function debounce(fn, delay = 500) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn.apply(null, args), delay);
    };
}
function validateField(fieldId, message, scroll = false) {
    const inputElement = document.getElementById(fieldId);
    const errorElement = document.getElementById(`error-${fieldId}`);

    if (message) {
        errorElement.textContent = message;
        inputElement.classList.remove('success');
        inputElement.classList.add('error');

        // Only scroll when asked (used on submit only)
        if (scroll) {
            inputElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    } else {
        errorElement.textContent = '';
        inputElement.classList.remove('error');
        inputElement.classList.add('success');
    }
}
function validateFullname() {
    const input = document.getElementById('fullname');
    const value = input.value.trim();
    const regex = /^[a-zA-Z\s]{4,}$/;

    if (!value) {
        validateField('fullname', 'Full Name is required.');
        return false;
    }
    if (!regex.test(value)) {
        validateField('fullname', 'Name can only contain letters and spaces.');
        return false;
    }

    validateField('fullname', '');
    return true;
}
function validatePhone() {
    const input = document.getElementById('phone');
    const value = input.value.trim();
    const regex = /^0\d{9}$/;

    if (!regex.test(value)) {
        validateField('phone', 'Phone must be 10 digits and start with 0 (e.g., 06XXXXXXXX).');
        return false;
    }

    validateField('phone', '');
    return true;
}
function validateCity() {
    const value = document.getElementById('city').value;

    if (!value) {
        validateField('city', 'Please select your city.');
        return false;
    }

    validateField('city', '');
    return true;
}
function validateAddress() {
    const input = document.getElementById('address');
    const value = input.value.trim();

    if (value.length < 10) {
        validateField('address', 'Please enter a detailed delivery address (min 10 characters).');
        return false;
    }

    validateField('address', '');
    return true;
}
function validateForm() {
    let firstError = false;

    function run(fn, id) {
        const valid = fn();
        if (!valid && !firstError) {
            validateField(id, document.getElementById(`error-${id}`).textContent, true);
            firstError = true;
        }
        return valid;
    }

    const a = run(validateFullname, 'fullname');
    const b = run(validatePhone, 'phone');
    const c = run(validateCity, 'city');
    const d = run(validateAddress, 'address');

    return a && b && c && d;
}
document.getElementById('fullname')
    .addEventListener('blur', debounce(validateFullname, 50));

document.getElementById('phone')
    .addEventListener('blur', debounce(validatePhone, 500));

document.getElementById('address')
    .addEventListener('blur', debounce(validateAddress, 500));

document.getElementById('city')
    .addEventListener('change', validateCity);
// handle form submission
document.getElementById('cod-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    updateUI(); // Update final summary before validation/submission

    // --- Validation Check ---
    if (!validateForm()) {
        // If validation fails, stop the submission
        return;
    }

    const submitBtn = document.querySelector('.submit-btn');
    const originalHTML = submitBtn.innerHTML;

    // 🔄 Change icon to spinner
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
    submitBtn.disabled = true;

    // --- Validation Passed ---

    const formData = new FormData();
    formData.append('fullname', document.getElementById('fullname').value.trim());
    formData.append('phone', document.getElementById('phone').value.trim());
    formData.append('city', document.getElementById('city').value);
    formData.append('address', document.getElementById('address').value.trim());
    formData.append('itemOptions', `${state.size} • ${state.color} • Qty: ${state.quantity}`);
    formData.append('totalPrice', document.getElementById('summary-total').textContent);

    const webAppUrl = 'https://script.google.com/macros/s/AKfycbwprpx9UDjPUmUs8NdPWql6Y-hchnAc4RBmp5H9XNHPhKsRtV1LCqaiCtaJ8H8EV1pmdw/exec'; // replace with your Web App URL

    try {
        const response = await fetch(webAppUrl, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        if (result.status === 'success') {
            const orderId = result.data[1]; // "ORD-32ccdb36b8c2"

            const params = new URLSearchParams({
                product_name: state.productName,
                product_price: document.getElementById('summary-total').textContent.replace(state.currency, '').trim(),
                currency: state.currency,
                final_size: state.size,
                final_color: state.color,
                phone: document.getElementById('phone').value.trim(),
                quantity: state.quantity,
                order_id: orderId
            });
document.getElementById('cod-form').reset();
            window.location.href = `thankyou.html?${params.toString()}`;
        } else {
            console.log(result);
           
        }

    } catch (err) {
        console.error(err);
       
    }
});
