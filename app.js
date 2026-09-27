// ===============================
// متجر إلكتروني - app.js
// ===============================

const defaultProducts = [
    {
        id: 1,
        name: "ساعة أنيقة",
        price: 150,
        category: "إكسسوارات",
        image: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80",
        description: "ساعة أنيقة ومناسبة للاستخدام اليومي."
    },
    {
        id: 2,
        name: "حذاء رياضي",
        price: 220,
        category: "أحذية",
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80",
        description: "حذاء رياضي مريح وأنيق."
    },
    {
        id: 3,
        name: "حقيبة عصرية",
        price: 180,
        category: "حقائب",
        image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80",
        description: "حقيبة عملية بتصميم عصري."
    },
    {
        id: 4,
        name: "سماعات لاسلكية",
        price: 120,
        category: "إلكترونيات",
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
        description: "سماعات لاسلكية بجودة صوت ممتازة."
    }
];


// ===============================
// المنتجات
// ===============================

function getProducts() {

    const saved = localStorage.getItem("storeProducts");

    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (error) {
            console.log("خطأ في قراءة المنتجات");
        }
    }

    localStorage.setItem(
        "storeProducts",
        JSON.stringify(defaultProducts)
    );

    return defaultProducts;
}


// ===============================
// السلة
// ===============================

function getCart() {

    const saved = localStorage.getItem("storeCart");

    if (!saved) {
        return [];
    }

    try {
        return JSON.parse(saved);
    } catch (error) {
        return [];
    }
}


function saveCart(cart) {

    localStorage.setItem(
        "storeCart",
        JSON.stringify(cart)
    );
}


// ===============================
// عرض المنتجات
// ===============================

function renderProducts(products = getProducts()) {

    const grid = document.getElementById("productGrid");

    if (!grid) {
        return;
    }

    if (products.length === 0) {

        grid.innerHTML = `
            <div class="panel">
                لا توجد منتجات حالياً.
            </div>
        `;

        return;
    }


    grid.innerHTML = products.map(product => {

        return `
            <article class="card">

                <img
                    src="${escapeHTML(product.image)}"
                    alt="${escapeHTML(product.name)}"
                    onerror="this.src='https://via.placeholder.com/600x400?text=Product'"
                >

                <div class="card-body">

                    <h3>
                        ${escapeHTML(product.name)}
                    </h3>

                    <p>
                        ${escapeHTML(product.description || "")}
                    </p>

                    <div class="price">
                        ${Number(product.price).toFixed(2)} ₪
                    </div>

                    <button
                        class="btn"
                        onclick="addToCart(${product.id})"
                    >
                        🛒 أضف للسلة
                    </button>

                </div>

            </article>
        `;

    }).join("");
}


// ===============================
// التصنيفات
// ===============================

function renderCategories() {

    const grid = document.getElementById("categoryGrid");

    if (!grid) {
        return;
    }


    const products = getProducts();

    const categories = [
        ...new Set(
            products
                .map(product => product.category)
                .filter(Boolean)
        )
    ];


    if (categories.length === 0) {

        grid.innerHTML = `
            <div class="category">
                لا توجد تصنيفات.
            </div>
        `;

        return;
    }


    grid.innerHTML = categories.map(category => {

        const count = products.filter(
            product => product.category === category
        ).length;

        return `
            <div
                class="category"
                onclick="filterCategory('${escapeAttribute(category)}')"
                style="cursor:pointer"
            >

                <h3>
                    📦 ${escapeHTML(category)}
                </h3>

                <p>
                    ${count} منتج
                </p>

            </div>
        `;

    }).join("");
}


// ===============================
// فلترة التصنيف
// ===============================

function filterCategory(category) {

    const products = getProducts();

    const filtered = products.filter(
        product => product.category === category
    );

    renderProducts(filtered);

    const productsSection =
        document.getElementById("products");

    if (productsSection) {

        productsSection.scrollIntoView({
            behavior: "smooth"
        });

    }
}


// ===============================
// إضافة للسلة
// ===============================

function addToCart(productId) {

    const products = getProducts();

    const product = products.find(
        item => Number(item.id) === Number(productId)
    );

    if (!product) {
        return;
    }


    const cart = getCart();

    const existing = cart.find(
        item => Number(item.id) === Number(productId)
    );


    if (existing) {

        existing.quantity += 1;

    } else {

        cart.push({
            id: product.id,
            name: product.name,
            price: Number(product.price),
            image: product.image,
            quantity: 1
        });

    }


    saveCart(cart);

    renderCart();

    updateCartCount();

    alert("تمت إضافة المنتج إلى السلة 🛒");
}


// ===============================
// عرض السلة
// ===============================

function renderCart() {

    const container =
        document.getElementById("cartItems");

    const totalElement =
        document.getElementById("cartTotal");


    if (!container) {
        return;
    }


    const cart = getCart();


    if (cart.length === 0) {

        container.innerHTML = `
            <div class="panel">
                🛒 السلة فارغة حالياً.
            </div>
        `;

        if (totalElement) {
            totalElement.textContent = "0 ₪";
        }

        return;
    }


    let total = 0;


    container.innerHTML = cart.map(item => {

        const itemTotal =
            Number(item.price) * Number(item.quantity);

        total += itemTotal;


        return `
            <div class="cart-item">

                <div>

                    <strong>
                        ${escapeHTML(item.name)}
                    </strong>

                    <div>
                        ${Number(item.price).toFixed(2)} ₪
                        ×
                        ${item.quantity}
                    </div>

                </div>


                <div>

                    <button
                        onclick="changeQuantity(${item.id}, -1)"
                    >
                        −
                    </button>

                    <strong style="margin:0 10px">
                        ${item.quantity}
                    </strong>

                    <button
                        onclick="changeQuantity(${item.id}, 1)"
                    >
                        +
                    </button>

                    <button
                        onclick="removeFromCart(${item.id})"
                        style="margin-right:10px"
                    >
                        🗑️
                    </button>

                </div>

            </div>
        `;

    }).join("");


    if (totalElement) {

        totalElement.textContent =
            total.toFixed(2) + " ₪";

    }
}


// ===============================
// تعديل الكمية
// ===============================

function changeQuantity(productId, amount) {

    const cart = getCart();

    const item = cart.find(
        product => Number(product.id) === Number(productId)
    );


    if (!item) {
        return;
    }


    item.quantity += amount;


    if (item.quantity <= 0) {

        const index = cart.indexOf(item);

        cart.splice(index, 1);

    }


    saveCart(cart);

    renderCart();

    updateCartCount();
}


// ===============================
// حذف من السلة
// ===============================

function removeFromCart(productId) {

    let cart = getCart();

    cart = cart.filter(
        item => Number(item.id) !== Number(productId)
    );

    saveCart(cart);

    renderCart();

    updateCartCount();
}


// ===============================
// عدد المنتجات في السلة
// ===============================

function updateCartCount() {

    const countElement =
        document.getElementById("cartCount");


    if (!countElement) {
        return;
    }


    const cart = getCart();


    const count = cart.reduce(
        (total, item) =>
            total + Number(item.quantity),
        0
    );


    countElement.textContent = count;
}


// ===============================
// البحث
// ===============================

function setupSearch() {

    const search =
        document.getElementById("search");


    if (!search) {
        return;
    }


    search.addEventListener("input", function () {

        const value =
            this.value.trim().toLowerCase();


        const products = getProducts();


        const filtered = products.filter(product => {

            return (
                product.name.toLowerCase().includes(value) ||
                String(product.category || "")
                    .toLowerCase()
                    .includes(value) ||
                String(product.description || "")
                    .toLowerCase()
                    .includes(value)
            );

        });


        renderProducts(filtered);

    });
}


// ===============================
// إعداد الصفحة الرئيسية
// ===============================

function loadHero() {

    const title =
        localStorage.getItem("heroTitle");

    const text =
        localStorage.getItem("heroText");

    const image =
        localStorage.getItem("heroImage");


    const titleElement =
        document.getElementById("heroTitle");

    const textElement =
        document.getElementById("heroText");

    const imageElement =
        document.getElementById("heroImage");


    if (title && titleElement) {
        titleElement.textContent = title;
    }


    if (text && textElement) {
        textElement.textContent = text;
    }


    if (image && imageElement) {
        imageElement.src = image;
    }
}


// ===============================
// تسجيل زيارة
// ===============================

function registerVisit() {

    let visits =
        Number(
            localStorage.getItem("storeVisits") || 0
        );


    visits += 1;


    localStorage.setItem(
        "storeVisits",
        visits
    );
}


// ===============================
// إتمام الطلب
// ===============================

function checkout() {

    const cart = getCart();


    if (cart.length === 0) {

        alert("السلة فارغة 🛒");

        return;
    }


    let total = 0;


    cart.forEach(item => {

        total +=
            Number(item.price) *
            Number(item.quantity);

    });


    const orders =
        JSON.parse(
            localStorage.getItem("storeOrders") || "[]"
        );


    orders.push({

        id: Date.now(),

        date: new Date().toISOString(),

        items: cart,

        total: total

    });


    localStorage.setItem(
        "storeOrders",
        JSON.stringify(orders)
    );


    localStorage.removeItem("storeCart");


    renderCart();

    updateCartCount();


    alert(
        "تم تسجيل طلبك بنجاح ✅\nالإجمالي: " +
        total.toFixed(2) +
        " ₪"
    );
}


// ===============================
// حماية النصوص
// ===============================

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function escapeAttribute(value) {

    return String(value)
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'");
}


// ===============================
// تشغيل المتجر
// ===============================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        renderProducts();

        renderCategories();

        renderCart();

        updateCartCount();

        setupSearch();

        loadHero();

        registerVisit();

    }
);
