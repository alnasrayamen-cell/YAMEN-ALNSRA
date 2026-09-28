/* =========================================================
   YAMEN ALNSRA
   Store App
   ========================================================= */
/* =========================
   PRODUCTS
========================= */
const products = [
    {
        id: 1,
        name: "هودي YAMEN",
        price: 120,
        image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&q=80"
    },
    {
        id: 2,
        name: "تيشيرت كلاسيك",
        price: 70,
        image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80"
    },
    {
        id: 3,
        name: "جاكيت شتوي",
        price: 180,
        image: "https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=800&q=80"
    },
    {
        id: 4,
        name: "بنطال كاجوال",
        price: 95,
        image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80"
    },
    {
        id: 5,
        name: "حذاء رياضي",
        price: 220,
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80"
    },
    {
        id: 6,
        name: "شنطة يومية",
        price: 110,
        image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80"
    }
];
/* =========================
   CART
========================= */
let cart = JSON.parse(localStorage.getItem("yamenCart")) || [];
/* =========================
   DOM
========================= */
const productGrid = document.getElementById("productGrid");
const cartOverlay = document.getElementById("cartOverlay");
const checkoutOverlay = document.getElementById("checkoutOverlay");
const successOverlay = document.getElementById("successOverlay");
const cartItems = document.getElementById("cartItems");
const cartCount = document.getElementById("cartCount");
const cartTotalItems = document.getElementById("cartTotalItems");
const cartTotal = document.getElementById("cartTotal");
const checkoutItems = document.getElementById("checkoutItems");
const checkoutTotal = document.getElementById("checkoutTotal");
const customerArea = document.getElementById("customerArea");
const customerCity = document.getElementById("customerCity");
/* =========================
   CITIES
========================= */
const cities = {
    "west-bank": [
        "جنين",
        "نابلس",
        "طولكرم",
        "قلقيلية",
        "رام الله والبيرة",
        "سلفيت",
        "أريحا والأغوار",
        "القدس",
        "بيت لحم",
        "الخليل"
    ],
    "gaza": [
        "غزة",
        "شمال غزة",
        "دير البلح",
        "خان يونس",
        "رفح"
    ],
    "inside-israel": [
        "الناصرة",
        "أم الفحم",
        "حيفا",
        "عكا",
        "شفا عمرو",
        "سخنين",
        "طمرة",
        "كفر كنا",
        "كفر ياسيف",
        "عرابة",
        "رهط"
    ]
};
/* =========================
   FORMAT PRICE
========================= */
function formatPrice(price) {
    return Number(price).toLocaleString("ar-EG") + " ₪";
}
/* =========================
   DISPLAY PRODUCTS
========================= */
function renderProducts() {
    if (!productGrid) return;
    productGrid.innerHTML = "";
    products.forEach(product => {
        const card = document.createElement("div");
        card.className = "product-card";
        card.innerHTML = `
            <div class="product-image">
                <img
                    src="${product.image}"
                    alt="${product.name}"
                    loading="lazy"
                >
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <p class="product-price">
                    ${formatPrice(product.price)}
                </p>
                <button
                    class="add-to-cart"
                    onclick="addToCart(${product.id})"
                >
                    أضف إلى السلة
                </button>
            </div>
        `;
        productGrid.appendChild(card);
    });
}
/* =========================
   ADD TO CART
========================= */
function addToCart(productId) {
    const product = products.find(
        product => product.id === productId
    );
    if (!product) return;
    const existing = cart.find(
        item => item.id === productId
    );
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: 1
        });
    }
    saveCart();
    renderCart();
    openCart();
}
/* =========================
   REMOVE ITEM
========================= */
function removeFromCart(productId) {
    cart = cart.filter(
        item => item.id !== productId
    );
    saveCart();
    renderCart();
}
/* =========================
   CHANGE QUANTITY
========================= */
function changeQuantity(productId, amount) {
    const item = cart.find(
        item => item.id === productId
    );
    if (!item) return;
    item.quantity += amount;
    if (item.quantity <= 0) {
        removeFromCart(productId);
        return;
    }
    saveCart();
    renderCart();
}
/* =========================
   CART TOTAL
========================= */
function getCartTotal() {
    return cart.reduce(
        (total, item) =>
            total + (item.price * item.quantity),
        0
    );
}
/* =========================
   CART ITEMS COUNT
========================= */
function getCartItemsCount() {
    return cart.reduce(
        (total, item) =>
            total + item.quantity,
        0
    );
}
/* =========================
   SAVE CART
========================= */
function saveCart() {
    localStorage.setItem(
        "yamenCart",
        JSON.stringify(cart)
    );
}
/* =========================
   RENDER CART
========================= */
function renderCart() {
    if (!cartItems) return;
    cartItems.innerHTML = "";
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                <div style="font-size:50px;">
                    🛒
                </div>
                <h3>
                    السلة فارغة
                </h3>
                <p>
                    أضف بعض المنتجات للبدء.
                </p>
            </div>
        `;
    } else {
        cart.forEach(item => {
            const element =
                document.createElement("div");
            element.className = "cart-item";
            element.innerHTML = `
                <img
                    src="${item.image}"
                    alt="${item.name}"
                >
                <div class="cart-item-info">
                    <h4>
                        ${item.name}
                    </h4>
                    <p>
                        ${formatPrice(item.price)}
                    </p>
                    <div class="quantity-controls">
                        <button
                            onclick="changeQuantity(${item.id}, -1)"
                        >
                            −
                        </button>
                        <span>
                            ${item.quantity}
                        </span>
                        <button
                            onclick="changeQuantity(${item.id}, 1)"
                        >
                            +
                        </button>
                    </div>
                </div>
                <button
                    class="remove-item"
                    onclick="removeFromCart(${item.id})"
                >
                    🗑️
                </button>
            `;
            cartItems.appendChild(element);
        });
    }
    if (cartCount) {
        cartCount.textContent =
            getCartItemsCount();
    }
    if (cartTotalItems) {
        cartTotalItems.textContent =
            getCartItemsCount();
    }
    if (cartTotal) {
        cartTotal.textContent =
            formatPrice(getCartTotal());
    }
    renderCheckout();
}
/* =========================
   OPEN CART
========================= */
function openCart() {
    if (!cartOverlay) return;
    cartOverlay.classList.add("active");
    document.body.style.overflow = "hidden";
}
/* =========================
   CLOSE CART
========================= */
function closeCart(event) {
    if (
        event &&
        event.target !== cartOverlay
    ) {
        return;
    }
    if (!cartOverlay) return;
    cartOverlay.classList.remove("active");
    document.body.style.overflow = "";
}
/* =========================
   OPEN CHECKOUT
========================= */
function openCheckout() {
    if (cart.length === 0) {
        alert("السلة فارغة. أضف منتجًا أولًا.");
        return;
    }
    renderCheckout();
    if (cartOverlay) {
        cartOverlay.classList.remove("active");
    }
    if (checkoutOverlay) {
        checkoutOverlay.classList.add("active");
        document.body.style.overflow = "hidden";
    }
}
/* =========================
   CLOSE CHECKOUT
========================= */
function closeCheckout() {
    if (!checkoutOverlay) return;
    checkoutOverlay.classList.remove("active");
    document.body.style.overflow = "";
}
/* =========================
   RENDER CHECKOUT
========================= */
function renderCheckout() {
    if (!checkoutItems) return;
    checkoutItems.innerHTML = "";
    cart.forEach(item => {
        const element =
            document.createElement("div");
        element.className = "checkout-item";
        element.innerHTML = `
            <span>
                ${item.name}
                × ${item.quantity}
            </span>
            <strong>
                ${formatPrice(
                    item.price * item.quantity
                )}
            </strong>
        `;
        checkoutItems.appendChild(element);
    });
    if (checkoutTotal) {
        checkoutTotal.textContent =
            formatPrice(getCartTotal());
    }
}
/* =========================
   UPDATE CITIES
========================= */
function updateCities() {
    if (!customerArea || !customerCity) return;
    const area =
        customerArea.value;
    customerCity.innerHTML = "";
    if (!area || !cities[area]) {
        customerCity.disabled = true;
        customerCity.innerHTML = `
            <option value="">
                اختر المنطقة أولًا
            </option>
        `;
        return;
    }
    customerCity.disabled = false;
    const defaultOption =
        document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent =
        "اختر المدينة / البلدة";
    defaultOption.disabled = true;
    defaultOption.selected = true;
    customerCity.appendChild(
        defaultOption
    );
    cities[area].forEach(city => {
        const option =
            document.createElement("option");
        option.value = city;
        option.textContent = city;
        customerCity.appendChild(option);
    });
}
/* =========================
   VALIDATE PHONE
========================= */
function validatePhone(phone) {
    const clean =
        phone.replace(/[\s()-]/g, "");
    const patterns = [
        /^05\d{8}$/,
        /^\+9705\d{8}$/,
        /^\+9725\d{8}$/
    ];
    return patterns.some(
        pattern => pattern.test(clean)
    );
}
/* =========================
   GENERATE ORDER NUMBER
========================= */
function generateOrderNumber() {
    const now =
        new Date();
    const date =
        now.getFullYear().toString() +
        String(
            now.getMonth() + 1
        ).padStart(2, "0") +
        String(
            now.getDate()
        ).padStart(2, "0");
    const random =
        Math.floor(
            1000 + Math.random() * 9000
        );
    return `YA-${date}-${random}`;
}
/* =========================
   SUBMIT ORDER
========================= */
function submitOrder(event) {
    event.preventDefault();
    if (cart.length === 0) {
        alert(
            "السلة فارغة."
        );
        return;
    }
    const form =
        document.getElementById(
            "checkoutForm"
        );
    if (!form) return;
    const name =
        document.getElementById(
            "customerName"
        ).value.trim();
    const phone =
        document.getElementById(
            "customerPhone"
        ).value.trim();
    const area =
        document.getElementById(
            "customerArea"
        ).value;
    const city =
        document.getElementById(
            "customerCity"
        ).value;
    const address =
        document.getElementById(
            "customerAddress"
        ).value.trim();
    const landmark =
        document.getElementById(
            "customerLandmark"
        ).value.trim();
    const notes =
        document.getElementById(
            "customerNotes"
        ).value.trim();
    if (!name) {
        alert(
            "يرجى إدخال الاسم الكامل."
        );
        return;
    }
    if (!validatePhone(phone)) {
        alert(
            "يرجى إدخال رقم هاتف فلسطيني صحيح."
        );
        return;
    }
    if (!area) {
        alert(
            "يرجى اختيار المنطقة."
        );
        return;
    }
    if (!city) {
        alert(
            "يرجى اختيار المدينة أو البلدة."
        );
        return;
    }
    if (!address) {
        alert(
            "يرجى إدخال العنوان بالتفصيل."
        );
        return;
    }
    const orderNumber =
        generateOrderNumber();
    const order = {
        id: orderNumber,
        customer: {
            name: name,
            phone: phone,
            area: area,
            city: city,
            address: address,
            landmark: landmark,
            notes: notes
        },
        items: cart.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            total:
                item.price *
                item.quantity
        })),
        total: getCartTotal(),
        status: "new",
        createdAt:
            new Date().toISOString()
    };
    /*
       TEMPORARY STORAGE
       هذا مؤقت فقط إلى أن نربطه
       بقاعدة البيانات ولوحة الأدمن.
    */
    const orders =
        JSON.parse(
            localStorage.getItem(
                "yamenOrders"
            )
        ) || [];
    orders.push(order);
    localStorage.setItem(
        "yamenOrders",
        JSON.stringify(orders)
    );
    /*
       CLEAR CART
    */
    cart = [];
    saveCart();
    renderCart();
    form.reset();
    if (customerCity) {
        customerCity.disabled = true;
        customerCity.innerHTML = `
            <option value="">
                اختر المنطقة أولًا
            </option>
        `;
    }
    closeCheckout();
    /*
       SHOW SUCCESS
    */
    const orderNumberElement =
        document.getElementById(
            "orderNumber"
        );
    if (orderNumberElement) {
        orderNumberElement.textContent =
            orderNumber;
    }
    if (successOverlay) {
        successOverlay.classList.add(
            "active"
        );
        document.body.style.overflow =
            "hidden";
    }
    console.log(
        "New order:",
        order
    );
}
/* =========================
   CLOSE SUCCESS
========================= */
function closeSuccess() {
    if (!successOverlay) return;
    successOverlay.classList.remove(
        "active"
    );
    document.body.style.overflow = "";
}
/* =========================
   INITIALIZE
========================= */
document.addEventListener(
    "DOMContentLoaded",
    function () {
        renderProducts();
        renderCart();
        if (customerArea) {
            customerArea.addEventListener(
                "change",
                updateCities
            );
        }
    }
);
/* =========================
   ESC KEY
========================= */
document.addEventListener(
    "keydown",
    function (event) {
        if (event.key !== "Escape") {
            return;
        }
        closeCart();
        closeCheckout();
        closeSuccess();
    }
);
