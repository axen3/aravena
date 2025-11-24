// ================ Simple Cart System ================
function addToCart(product, size, color, qty = 1) {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existing = cart.find(i => 
        i.id === product.id && 
        i.size === size && 
        i.color === color
    );

    if (existing) {
        existing.qty += qty;
    } else {
        cart.push({ 
            id: product.id, 
            name: product.name, 
            price: product.price, 
            image: product.image, 
            size, 
            color, 
            qty 
        });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCounter();
}

function updateCartCounter() {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const total = cart.reduce((sum, i) => sum + i.qty, 0);
    const counter = document.getElementById("cart-counter");
    if (counter) counter.textContent = total;
}

// ================ Home Page ================
window.loadHome = async function (selectedCategory = null) {
    const container = document.getElementById("products-grid");
    const res = await fetch("/data/products.json");
    const products = await res.json();

    // Filter products if a category is selected
    const filteredProducts = selectedCategory 
        ? products.filter(p => p.category.toLowerCase() === selectedCategory.toLowerCase())
        : products;

    // Update page title
    if (selectedCategory) {
        document.querySelector("h2") ? document.querySelector("h2").textContent = selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1) : null;
    } else {
        document.querySelector("h2") ? document.querySelector("h2").textContent = "All Products" : null;
    }

    container.innerHTML = filteredProducts.map(p => {
        const hasDiscount = p.originalPrice && p.originalPrice > p.price;
        const discount = hasDiscount ? Math.round((1 - p.price / p.originalPrice) * 100) : 0;

        return `
            <div class="product-card">
                ${hasDiscount ? `<div class="sale-badge">-${discount}%</div>` : ''}
                <a href="/product/${p.id}" data-link> 
                    <div class="product-image-wrapper">
                        <img src="${p.image}" alt="${p.name}" loading="lazy">
                    </div>
                    <div class="card-content">
                        <h3>${p.name}</h3>
                        <p class="category-badge">${p.category}</p>
                        <div class="price-row">
                            <span class="price">MAD ${(p.price / 100).toFixed(2)}</span>
                            ${hasDiscount ? `<span class="original-price">MAD ${(p.originalPrice / 100).toFixed(2)}</span>` : ''}
                        </div>
                    </div>
                </a>
            </div>
        `;
    }).join("");

    // Add category filter buttons above grid (only on home/category pages)
    const header = document.querySelector(".hero-section");
    if (header && !document.getElementById("category-filters")) {
        const categories = ["all", "clothing", "electronics", "wearables", "shoes", "misc"];
        const filterHTML = `<div id="category-filters" class="category-filters">
            ${categories.map(cat => {
                // Determine the clean URL path for the button
                const path = cat === "all" ? "/home" : `/category/${cat}`; 
                
                return `
                    <a href="${path}" data-link class="category-btn ${(!selectedCategory && cat === "all") || selectedCategory === cat ? "active" : ""}">
                        ${cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </a>
                `;
            }).join("")}
        </div>`;
        header.insertAdjacentHTML("afterend", filterHTML);
    }
        // Categories filters scroll
    const targetElement = document.getElementById("products-start");
    
    if (selectedCategory && targetElement) {
        
        // Ensure the header height is accounted for if it's sticky
        const siteHeader = document.getElementById("header"); // Assuming your sticky header is #header
        const headerHeight = siteHeader ? siteHeader.offsetHeight : 0;

        // Calculate the top position of the target element relative to the document
        const targetTop = targetElement.getBoundingClientRect().top + window.pageYOffset;

        // Calculate the final scroll position: Target Top - Header Height (for sticky header offset)
        const scrollToY = targetTop - headerHeight - 20; // -20 for a small padding/buffer
        window.scrollTo({
            top: scrollToY,
            behavior: "smooth"
        });
    }

};

// ================ Product Page ================
window.loadProduct = async function (id) {
    const res = await fetch("/data/products.json");
    const products = await res.json();
    const product = products.find(p => p.id == id);

    if (!product) {
        document.getElementById("app").innerHTML = "<h2 style='text-align:center;padding:4rem;'>Product not found 😢</h2>";
        return;
    }

    // ... (rest of the product display logic remains the same) ...

    document.getElementById("product-title").textContent = product.name;
    document.getElementById("product-category").textContent = product.category;
    document.getElementById("product-description").textContent = product.shortDescription;

    // Stock Status + Disable buttons if out of stock
    const stockEl = document.getElementById("product-stock");
    const stockTextEl = stockEl.querySelector(".stock-text");
    const stockIconEl = stockEl.querySelector(".stock-icon");

    const addToCartBtn = document.getElementById("add-to-cart");
    const buyNowBtn = document.getElementById("buy-now");

    if (product.inStock) {
        stockTextEl.textContent = "In Stock";
        stockIconEl.className = "fas fa-check-circle stock-icon";
        stockEl.classList.remove("out-of-stock");

        // Enable buttons
        addToCartBtn.disabled = false;
        buyNowBtn.disabled = false;
        addToCartBtn.style.opacity = "1";
        buyNowBtn.style.opacity = "1";
        addToCartBtn.style.cursor = "pointer";
        buyNowBtn.style.cursor = "pointer";
    } else {
        stockTextEl.textContent = "Out of Stock";
        stockIconEl.className = "fas fa-times-circle stock-icon";
        stockEl.classList.add("out-of-stock");

        // Disable buttons
        addToCartBtn.disabled = true;
        buyNowBtn.disabled = true;
        addToCartBtn.style.opacity = "0.5";
        buyNowBtn.style.opacity = "0.5";
        addToCartBtn.style.cursor = "not-allowed";
        buyNowBtn.style.cursor = "not-allowed";
    }
    const priceEl = document.getElementById("product-price");
    priceEl.textContent = `MAD ${(product.price / 100).toFixed(2)}`;

    const originalPriceEl = document.getElementById("original-price");
    const discountBadgeEl = document.getElementById("discount-badge");

    if (product.originalPrice && product.originalPrice > product.price) {
        originalPriceEl.textContent = `MAD ${(product.originalPrice / 100).toFixed(2)}`;
        originalPriceEl.style.display = "inline";
        const discount = Math.round((1 - product.price / product.originalPrice) * 100);
        discountBadgeEl.textContent = `-${discount}%`;
        discountBadgeEl.style.display = "inline-block";
    } else {
        originalPriceEl.style.display = "none";
        discountBadgeEl.style.display = "none";
    }

    const allImages = [product.image, ...(product.images || [])];
    const imagesDiv = document.getElementById("product-images");

    imagesDiv.innerHTML = `
        <div class="gallery-main">
            <img id="main-gallery-image" src="${allImages[0]}" alt="${product.name}">
        </div>
        ${allImages.length > 1 ? `
            <div class="gallery-thumbs">
                ${allImages.map((src, i) => `
                    <img src="${src}" alt="thumb" class="${i === 0 ? 'active' : ''}" onclick="
                        document.getElementById('main-gallery-image').src = this.src;
                        this.parentElement.querySelectorAll('img').forEach(t => t.classList.remove('active'));
                        this.classList.add('active');
                    ">
                `).join("")}
            </div>
        ` : ''}
    `;

    const sizeSelect = document.getElementById("selectedSize");
    if (product.sizes && product.sizes.length > 0) {
        sizeSelect.innerHTML = product.sizes.map(s => `<option value="${s}">${s}</option>`).join("");
        sizeSelect.closest(".option-group").style.display = "block";
    } else {
        sizeSelect.closest(".option-group").style.display = "none";
    }

    const colorDiv = document.getElementById("color-options");
    if (product.colors && product.colors.length > 0) {
        colorDiv.innerHTML = product.colors.map((c, i) => `
            <div class="color-swatch ${i === 0 ? 'active' : ''}" style="background:${c.hex}" data-color="${c.name}" title="${c.name}"></div>
        `).join("");

        colorDiv.querySelectorAll(".color-swatch").forEach(swatch => {
            swatch.onclick = () => {
                colorDiv.querySelectorAll(".color-swatch").forEach(s => s.classList.remove("active"));
                swatch.classList.add("active");
            };
        });
        colorDiv.closest(".option-group").style.display = "block";
    } else {
        colorDiv.closest(".option-group").style.display = "none";
    }

    const qtyInput = document.getElementById("selectedUnits");
    const minusBtn = document.getElementById("qty-minus");
    const plusBtn = document.getElementById("qty-plus");

    const updateQtyButtons = () => {
        const val = parseInt(qtyInput.value);
        minusBtn.disabled = val <= 1;
        plusBtn.disabled = val >= 10;
    };

    minusBtn.onclick = () => {
        if (parseInt(qtyInput.value) > 1) {
            qtyInput.value = parseInt(qtyInput.value) - 1;
            updateQtyButtons();
        }
    };

    plusBtn.onclick = () => {
        if (parseInt(qtyInput.value) < 10) {
            qtyInput.value = parseInt(qtyInput.value) + 1;
            updateQtyButtons();
        }
    };

    qtyInput.value = 1;
    updateQtyButtons();

    const descDiv = document.getElementById("description-blocks");
    descDiv.innerHTML = (product.descriptionBlocks || []).map(block => {
        if (block.type === "h1") return `<h2>${block.content}</h2>`;
        if (block.type === "paragraph") return `<p>${block.content}</p>`;
        if (block.type === "ul") return `<ul>${block.items.map(i => `<li>${i}</li>`).join("")}</ul>`;
        if (block.type === "image") return `<img src="${block.src}" alt="${block.alt}" loading="lazy">`;
        return "";
    }).join("");

    // Add to Cart
    document.getElementById("add-to-cart").onclick = () => {
        const size = product.sizes?.length ? document.getElementById("selectedSize").value : null;
        const color = product.colors?.length ? document.querySelector(".color-swatch.active")?.dataset.color : null;
        const qty = parseInt(qtyInput.value) || 1;

        addToCart(product, size, color, qty);
    };

    // Buy Now – silent + instant checkout
    document.getElementById("buy-now").onclick = () => {
        const size = product.sizes?.length ? document.getElementById("selectedSize").value : null;
        const color = product.colors?.length ? document.querySelector(".color-swatch.active")?.dataset.color : null;
        const qty = parseInt(qtyInput.value) || 1;

        addToCart(product, size, color, qty);
        
        // HASH REMOVED: Navigate using the new navigateTo function from app.js
        window.navigateTo('/checkout'); 
    };

    updateTitle(product.name);
};

// ================ Static Pages ================
window.loadPage = async function (page) {
    const res = await fetch("/data/pages.json");
    const pages = await res.json();
    const content = pages[page] || { title: "Page Not Found", content: "<p>Sorry, this page does not exist.</p>" };

    document.getElementById("page-title").textContent = content.title;
    document.getElementById("page-content").innerHTML = content.content;
    updateTitle(content.title);
};

// ================ Checkout Page – ALWAYS AVAILABLE & FIXED ================
window.loadCheckout = function () {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");

    if (cart.length === 0) {
        document.getElementById("app").innerHTML = `
            <div style="text-align:center; padding:8rem 2rem;">
                <i class="fas fa-shopping-cart" style="font-size:6rem; color:#cbd5e1; margin-bottom:1.5rem;"></i>
                <h2 style="font-size:2.2rem; margin-bottom:1rem; color:var(--primary);">Your cart is empty</h2>
                <p style="font-size:1.2rem; color:#666; margin-bottom:2rem;">
                    Looks like you haven't added anything yet.<br>
                    Let's find something you love!
                </p>
                <a href="/home" data-link class="cta-button" style="display:inline-block; padding:1rem 2.5rem; font-size:1.2rem;">
                    Start Shopping
                </a>
            </div>`;
        return;
    }

    const itemsHTML = cart.map((item, index) => `
        <div class="cart-item">
            <img src="${item.image}" alt="${item.name}">
            <div class="cart-item-details">
                <h4>${item.name}</h4>
                <p>${item.size ? 'Size: ' + item.size + ' • ' : ''}${item.color ? 'Color: ' + item.color + ' • ' : ''}Qty: ${item.qty}</p>
                <p>MAD ${(item.price / 100 * item.qty).toFixed(2)}</p>
            </div>
            <button class="remove-item-btn" data-index="${index}">
                <i class="fas fa-trash-alt"></i>
            </button>
        </div>
    `).join("");

    const cartItemsEl = document.getElementById("cart-items");
    if (cartItemsEl) cartItemsEl.innerHTML = itemsHTML;

    const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0) / 100;
    const totalEl = document.getElementById("grand-total");
    if (totalEl) totalEl.textContent = total.toFixed(2);

    document.querySelectorAll(".remove-item-btn").forEach(btn => {
        btn.onclick = () => {
            const index = parseInt(btn.dataset.index);
            cart.splice(index, 1);
            localStorage.setItem("cart", JSON.stringify(cart));
            updateCartCounter();
            loadCheckout();
        };
    });

    // Populate Moroccan cities dropdown (remains unchanged)
    const moroccoCities = [
        "Agadir", "Ahfir", "Aïn Bni Mathar", "Aïn Defali", "Aïn El Aouda", "Aït Benhaddou", "Aït Iaaza",
        "Al Hoceïma", "Arbaoua", "Asilah", "Bab Berred", "Béni Mellal", "Ben Slimane", "Berkane", "Berrechid",
        "Bhalil", "Boujdour", "Boulemane", "Boumia", "Bouznika", "Casablanca", "Chefchaouen", "Chichaoua",
        "Dakhla", "Dar Gueddari", "Dar Kebdani", "Demnate", "Driouch", "El Aioun Sidi Mellouk", "El Guerdane",
        "El Hajeb", "El Jadida", "Erfoud", "Errachidia", "Essaouira", "Fès", "Figuig", "Fnideq", "Fquih Ben Salah",
        "Guelmim", "Goulmima", "Guercif", "Had Kourt", "Ifrane", "Imilchil", "Imouzzer Kandar", "Inezgane",
        "Issaouen (Ketama)", "Jerada", "Kénitra", "Khémisset", "Khouribga", "Khénifra", "Ksar El Kébir",
        "Laâyoune", "Larache", "Marrakech", "Martil", "M'diq", "Mohammédia", "Midelt", "Moulay Idriss Zerhoun",
        "Nador", "Ouarzazate", "Oualidia", "Oujda", "Oulad Teïma", "Rabat", "Safi", "Saïdia", "Salé",
        "Témara", "Tanger", "Tarfaya", "Taza", "Tétouan", "Tiznit", "Taroudant"
    ];

    const citySelect = document.getElementById("city");
    if (citySelect && citySelect.options.length === 1) {  // only run once
        moroccoCities.sort().forEach(city => {
            const option = document.createElement("option");
            option.value = city;
            option.textContent = city;
            citySelect.appendChild(option);
        });
    }

    const form = document.getElementById("cod-form");
    if (form) {
        form.onsubmit = async e => {
            e.preventDefault();
            const btn = form.querySelector(".place-order-btn");
            btn.disabled = true;
            btn.textContent = "Placing Order...";

            const orderData = {
                // orderDate: new Date().
                orderId: "WALLY-" + Date.now().toString().slice(-6), // nice short ID
                name: document.getElementById("name").value.trim(),
                phone: document.getElementById("phone").value.trim(),
                address: document.getElementById("address").value.trim(),
                city: document.getElementById("city").value.trim(),
                notes: document.getElementById("notes").value.trim() || "No notes",
                items: cart.map(i => `${i.name} (${i.qty}x)${i.size ? " - Size: " + i.size : ""}${i.color ? " - Color: " + i.color : ""}`).join(" • "),
                total: total.toFixed(2),
                status: "Pending"                                 // ← Status last + default
            };

            const webhookURL = "https://hook.eu1.make.com/daglayfja85x5ovvk2zr66qlb0br7pqy"; // ← Replace with your real URL

            try {
                await fetch(webhookURL, {
                    method: "POST",
                    body: JSON.stringify(orderData),
                    headers: { "Content-Type": "application/json" }
                });
                localStorage.removeItem("cart");
                updateCartCounter();
                
                // HASH REMOVED: Navigate using the new navigateTo function from app.js
                window.navigateTo('/thankyou'); 
            } catch (err) {
                alert("Order failed. Please try again or contact us.");
                btn.disabled = false;
                btn.textContent = "Place Order";
            }
        };
    }
};
// fixed id scroll utility
window.scrollToElement = function(targetId) {
    const targetElement = document.getElementById(targetId);

    if (targetElement) {
        // Assuming your sticky header is #header
        const siteHeader = document.getElementById("header");
        const headerHeight = siteHeader ? siteHeader.offsetHeight : 0;

        // Calculate the top position of the target element relative to the document
        const targetTop = targetElement.getBoundingClientRect().top + window.pageYOffset;

        // Calculate the final scroll position: Target Top - Header Height - Padding
        const scrollToY = targetTop - headerHeight - 20; // 20px buffer for padding

        window.scrollTo({
            top: scrollToY,
            behavior: "smooth"
        });
    }
};
// ================ CONTACT FORM UTILITIES AND VALIDATION ================

// Global variable to store the CAPTCHA answer
let correctCaptchaAnswer; 

/**
 * Generates a simple math CAPTCHA.
 */
function generateCaptcha() {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 5) + 1;
    const operator = (Math.random() > 0.5) ? '+' : '-';
    
    let question;
    let answer;

    if (operator === '+') {
        question = `${num1} + ${num2}`;
        answer = num1 + num2;
    } else {
        const largeNum = Math.max(num1, num2);
        const smallNum = Math.min(num1, num2);
        question = `${largeNum} - ${smallNum}`;
        answer = largeNum - smallNum;
    }
    
    // Update the question text and store the answer
    const questionEl = document.getElementById('captcha-question');
    if (questionEl) {
        questionEl.textContent = `What is ${question}?`;
    }
    correctCaptchaAnswer = answer.toString();
}

/**
 * Validates form fields and CAPTCHA.
 * @returns {boolean} True if all validation passes.
 */
function validateFields() {
    let isValid = true;

    // Helper to validate and display errors
    const checkField = (id, check, message) => {
        const inputEl = document.getElementById(id);
        const errorEl = document.getElementById(id.replace('-input', '-error'));
        
        if (check()) {
            errorEl.textContent = message;
            inputEl.classList.add('invalid');
            isValid = false;
        } else {
            errorEl.textContent = '';
            inputEl.classList.remove('invalid');
        }
    };

    // --- 1. Basic Field Validation ---
    const nameVal = document.getElementById('name-input').value.trim();
    const emailVal = document.getElementById('email-input').value.trim();
    const messageVal = document.getElementById('message-input').value.trim();
    
    checkField('name-input', () => nameVal.length < 2, 'Name must be at least 2 characters.');
    checkField('email-input', () => emailVal === '' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal), 'Please enter a valid email address.');
    checkField('message-input', () => messageVal.length < 10, 'Message must be at least 10 characters.');

    // --- 2. CAPTCHA Validation ---
    const captchaInput = document.getElementById('captcha-input');
    const captchaError = document.getElementById('captcha-error');
    const captchaVal = captchaInput.value.trim();
    
    if (captchaVal !== correctCaptchaAnswer) {
        captchaError.textContent = 'Incorrect answer. Please try again.';
        captchaInput.classList.add('invalid');
        generateCaptcha(); // Generate new CAPTCHA on failure
        isValid = false;
    } else {
        captchaError.textContent = '';
        captchaInput.classList.remove('invalid');
    }

    return isValid;
}

/**
 * Handles the click event for the submit button, running validation and fetch.
 */
async function handleContactFormSubmit() {
    // 1. Run client-side validation
    if (!validateFields()) {
        return;
    }

    const form = document.getElementById('contact-form');
    const submitBtn = document.getElementById('submit-button');
    const formData = new FormData(form);
    
    // Disable button and show loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

    // 2. Submit data via FETCH (required when overriding default form action)
    try {
        const response = await fetch(form.action, {
            method: form.method,
            body: formData,
            headers: {
                'Accept': 'application/json'
            }
        });

        // 3. Handle successful submission
        if (response.ok) {
            const formWrapper = document.querySelector('.contact-form-wrapper');
    // 2. Get the success message element (which is currently hidden in the HTML)
    const successMessage = document.getElementById('contact-success');
    
    if (formWrapper && successMessage) {
        // *** CRITICAL FIX: Replace the form content with the success message ***
        formWrapper.innerHTML = successMessage.outerHTML;

        // Ensure the replaced element is visible (since the original success div had display:none)
        const newSuccessMessage = document.getElementById('contact-success');
        if (newSuccessMessage) {
            newSuccessMessage.style.display = 'block';
            newSuccessMessage.style.opacity = '0'; // Optional: for fade-in effect
            setTimeout(() => { 
                newSuccessMessage.style.transition = 'opacity 0.5s ease';
                newSuccessMessage.style.opacity = '1';
                if (window.scrollToElement) {
                    window.scrollToElement('contact-success'); 
                }
            }, 10);
        }
            } else {
                alert('Success! Your message was sent.');
            }
        } else {
            alert('Form submission failed! Please try again or use WhatsApp.');
            // Re-enable button on failure
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Message';
        }

    } catch (error) {
        console.error('Submission error:', error);
        alert('An unexpected error occurred. Please try again.');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Message';
    }
}


// ================ PAGE INITIALIZER FUNCTIONS ================

/**
 * Initializes the contact form page with CAPTCHA and event listeners.
 */
window.loadContact = function() {
    const contactForm = document.getElementById('contact-form');
    const submitButton = document.getElementById('submit-button');
    
    if (contactForm && submitButton) {
        // 1. Generate the initial CAPTCHA question
        generateCaptcha();

        // 2. Attach the new submission handler to the button click
        submitButton.addEventListener('click', handleContactFormSubmit);
    }
    
    // Ensures the success message is initially hidden when the page loads
    const successMessage = document.getElementById('contact-success');
    if (successMessage) {
        successMessage.style.display = 'none';
    }
};
// --- HASHCHANGE LISTENER MODIFIED FOR CLEAN PATH ---
// We need to check the pathname now instead of the hash.
/*
window.addEventListener("popstate", () => {
    // Check if the current path is /home or starts with /category/
    const path = location.pathname;
    if (path === "/home" || path.startsWith("/category/") || path === "/") {
        const filters = document.getElementById("category-filters");
        if (filters) {
            // Get header height (works even if header size changes)
            const header = document.querySelector(".site-header");
            const headerHeight = header ? header.offsetHeight : 80;

            // Calculate exact position so filters touch the top of viewport
            const filtersTop = filters.getBoundingClientRect().top + window.pageYOffset;
            const targetScroll = filtersTop - headerHeight;

            // Smooth scroll to that exact position
            window.scrollTo({
                top: targetScroll,
                behavior: "smooth"
            });
        }
    }
});*/