/* =========================================================
   LITTLE STARS — STORE APPLICATION
   Version 1.0
========================================================= */

"use strict";

/* =========================================================
   STORE DATA
========================================================= */

const products = [
    {
        id: "product-001",
        name: "طقم أطفال كاجوال أنيق",
        category: "boys",
        categoryName: "أولاد",
        price: 89,
        oldPrice: null,
        rating: 5,
        reviews: 12,
        image:
            "https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=800&q=85",
        colors: ["beige", "blue", "gray"],
        sizes: ["2Y", "4Y", "6Y", "8Y", "10Y"],
        stock: 20,
        label: "جديد"
    },

    {
        id: "product-002",
        name: "فستان أطفال ناعم",
        category: "girls",
        categoryName: "بنات",
        price: 99,
        oldPrice: null,
        rating: 5,
        reviews: 18,
        image:
            "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?auto=format&fit=crop&w=800&q=85",
        colors: ["pink", "white", "purple"],
        sizes: ["2Y", "4Y", "6Y", "8Y", "10Y"],
        stock: 15,
        label: "جديد"
    },

    {
        id: "product-003",
        name: "طقم مواليد قطني",
        category: "baby",
        categoryName: "مواليد",
        price: 59,
        oldPrice: 75,
        rating: 5,
        reviews: 25,
        image:
            "https://images.unsplash.com/photo-1596870230751-ebdfce98ec42?auto=format&fit=crop&w=800&q=85",
        colors: ["white", "beige"],
        sizes: ["0-3M", "3-6M", "6-12M"],
        stock: 25,
        label: "خصم"
    },

    {
        id: "product-004",
        name: "طقم بنات يومي",
        category: "girls",
        categoryName: "بنات",
        price: 79,
        oldPrice: null,
        rating: 5,
        reviews: 31,
        image:
            "https://images.unsplash.com/photo-1484665754804-74b0914c467b?auto=format&fit=crop&w=800&q=85",
        colors: ["pink", "blue", "white"],
        sizes: ["2Y", "4Y", "6Y", "8Y", "10Y"],
        stock: 18,
        label: "الأكثر مبيعًا"
    }
];


/* =========================================================
   APPLICATION STATE
========================================================= */

let cart = loadCart();

let favorites = loadFavorites();

let currentModalProduct = null;

let currentQuantity = 1;

let selectedSize = null;


/* =========================================================
   DOM ELEMENTS
========================================================= */

const cartButton =
    document.getElementById("cartButton");

const cartDrawer =
    document.getElementById("cartDrawer");

const cartOverlay =
    document.getElementById("cartOverlay");

const closeCartButton =
    document.getElementById("closeCart");

const cartItemsContainer =
    document.getElementById("cartItems");

const cartCount =
    document.getElementById("cartCount");

const cartTotal =
    document.getElementById("cartTotal");

const productsGrid =
    document.getElementById("productsGrid");

const searchInput =
    document.getElementById("searchInput");

const searchButton =
    document.getElementById("searchButton");

const mobileMenu =
    document.getElementById("mobileMenu");

const mobileMenuButton =
    document.getElementById("mobileMenuButton");

const closeMobileMenu =
    document.getElementById("closeMobileMenu");

const productModal =
    document.getElementById("productModal");

const closeProductModal =
    document.getElementById("closeProductModal");

const modalProductImage =
    document.getElementById("modalProductImage");

const modalProductCategory =
    document.getElementById("modalProductCategory");

const modalProductTitle =
    document.getElementById("modalProductTitle");

const modalProductRating =
    document.getElementById("modalProductRating");

const modalProductPrice =
    document.getElementById("modalProductPrice");

const productQuantity =
    document.getElementById("productQuantity");

const decreaseQuantity =
    document.getElementById("decreaseQuantity");

const increaseQuantity =
    document.getElementById("increaseQuantity");

const modalAddToCart =
    document.getElementById("modalAddToCart");

const toast =
    document.getElementById("toast");

const toastMessage =
    document.getElementById("toastMessage");

const newsletterForm =
    document.getElementById("newsletterForm");


/* =========================================================
   LOCAL STORAGE
========================================================= */

function loadCart() {

    try {

        const saved =
            localStorage.getItem("littleStarsCart");

        return saved
            ? JSON.parse(saved)
            : [];

    } catch (error) {

        console.error(
            "Could not load cart:",
            error
        );

        return [];

    }
}


function saveCart() {

    localStorage.setItem(
        "littleStarsCart",
        JSON.stringify(cart)
    );

}


function loadFavorites() {

    try {

        const saved =
            localStorage.getItem(
                "littleStarsFavorites"
            );

        return saved
            ? JSON.parse(saved)
            : [];

    } catch (error) {

        return [];

    }

}


function saveFavorites() {

    localStorage.setItem(
        "littleStarsFavorites",
        JSON.stringify(favorites)
    );

}


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        renderProducts(products);

        updateCartUI();

        setupEventListeners();

        setupSizeButtons();

        updateFavoriteButtons();

    }
);


/* =========================================================
   EVENT LISTENERS
========================================================= */

function setupEventListeners() {


    /* -------------------------
       CART
    ------------------------- */

    if (cartButton) {

        cartButton.addEventListener(
            "click",
            openCart
        );

    }


    if (closeCartButton) {

        closeCartButton.addEventListener(
            "click",
            closeCart
        );

    }


    if (cartOverlay) {

        cartOverlay.addEventListener(
            "click",
            closeCart
        );

    }


    /* -------------------------
       MOBILE MENU
    ------------------------- */

    if (mobileMenuButton) {

        mobileMenuButton.addEventListener(
            "click",
            openMobileMenu
        );

    }


    if (closeMobileMenu) {

        closeMobileMenu.addEventListener(
            "click",
            closeMobileMenuPanel
        );

    }


    document
        .querySelectorAll(
            ".mobile-menu-links a"
        )
        .forEach(link => {

            link.addEventListener(
                "click",
                closeMobileMenuPanel
            );

        });


    /* -------------------------
       SEARCH
    ------------------------- */

    if (searchInput) {

        searchInput.addEventListener(
            "input",
            () => {

                performSearch(
                    searchInput.value
                );

            }
        );

        searchInput.addEventListener(
            "keydown",
            event => {

                if (event.key === "Enter") {

                    event.preventDefault();

                    performSearch(
                        searchInput.value
                    );

                }

            }
        );

    }


    if (searchButton) {

        searchButton.addEventListener(
            "click",
            () => {

                performSearch(
                    searchInput.value
                );

            }
        );

    }


    /* -------------------------
       PRODUCT MODAL
    ------------------------- */

    if (closeProductModal) {

        closeProductModal.addEventListener(
            "click",
            closeProductModalWindow
        );

    }


    if (productModal) {

        productModal.addEventListener(
            "click",
            event => {

                if (
                    event.target === productModal
                ) {

                    closeProductModalWindow();

                }

            }
        );

    }


    /* -------------------------
       QUANTITY
    ------------------------- */

    if (decreaseQuantity) {

        decreaseQuantity.addEventListener(
            "click",
            () => {

                if (currentQuantity > 1) {

                    currentQuantity--;

                    updateModalQuantity();

                }

            }
        );

    }


    if (increaseQuantity) {

        increaseQuantity.addEventListener(
            "click",
            () => {

                if (
                    currentModalProduct &&
                    currentQuantity <
                        currentModalProduct.stock
                ) {

                    currentQuantity++;

                    updateModalQuantity();

                }

            }
        );

    }


    /* -------------------------
       MODAL ADD TO CART
    ------------------------- */

    if (modalAddToCart) {

        modalAddToCart.addEventListener(
            "click",
            () => {

                if (!currentModalProduct) {

                    return;

                }

                addToCart(
                    currentModalProduct.id,
                    currentQuantity,
                    selectedSize
                );

                closeProductModalWindow();

            }
        );

    }


    /* -------------------------
       NEWSLETTER
    ------------------------- */

    if (newsletterForm) {

        newsletterForm.addEventListener(
            "submit",
            event => {

                event.preventDefault();

                const email =
                    document.getElementById(
                        "newsletterEmail"
                    ).value.trim();

                if (!email) {

                    showToast(
                        "يرجى إدخال البريد الإلكتروني",
                        "!"
                    );

                    return;

                }

                localStorage.setItem(
                    "littleStarsNewsletter",
                    email
                );

                newsletterForm.reset();

                showToast(
                    "تم الاشتراك بنجاح ❤️"
                );

            }
        );

    }


    /* -------------------------
       ESCAPE KEY
    ------------------------- */

    document.addEventListener(
        "keydown",
        event => {

            if (event.key !== "Escape") {

                return;

            }

            closeCart();

            closeProductModalWindow();

            closeMobileMenuPanel();

        }
    );

}


/* =========================================================
   RENDER PRODUCTS
========================================================= */

function renderProducts(
    productList
) {

    if (!productsGrid) {

        return;

    }


    if (!productList.length) {

        productsGrid.innerHTML = `

            <div class="no-products">

                <div>
                    🔎
                </div>

                <h3>
                    لم نجد منتجات مطابقة
                </h3>

                <p>
                    جرّب البحث بكلمة أخرى.
                </p>

            </div>

        `;

        return;

    }


    productsGrid.innerHTML =
        productList
            .map(
                product =>
                    createProductHTML(
                        product
                    )
            )
            .join("");


    attachProductEvents();

    updateFavoriteButtons();

}


/* =========================================================
   PRODUCT HTML
========================================================= */

function createProductHTML(
    product
) {

    const oldPriceHTML =
        product.oldPrice
            ? `
                <del>
                    ₪${product.oldPrice}
                </del>
            `
            : "";


    const colorsHTML =
        product.colors
            .map(
                color => `
                    <span
                        class="color-dot ${color}"
                        title="${color}">
                    </span>
                `
            )
            .join("");


    return `

        <article
            class="product-card"
            data-product-id="${product.id}">

            <div class="product-image-wrapper">

                <span class="product-label ${
                    product.label === "خصم"
                        ? "sale"
                        : product.label ===
                          "الأكثر مبيعًا"
                        ? "bestseller"
                        : "new"
                }">

                    ${product.label}

                </span>


                <button
                    class="favorite-button"
                    type="button"
                    data-favorite="${product.id}"
                    aria-label="إضافة للمفضلة">

                    ♡

                </button>


                <img
                    src="${product.image}"
                    alt="${product.name}"
                    loading="lazy">


                <button
                    class="quick-view-button"
                    type="button"
                    data-quick-view="${product.id}">

                    عرض سريع

                </button>

            </div>


            <div class="product-info">

                <span class="product-category">
                    ${product.categoryName}
                </span>


                <h3>
                    ${product.name}
                </h3>


                <div class="product-rating">

                    ${createStars(product.rating)}

                    <span>
                        (${product.reviews})
                    </span>

                </div>


                <div class="product-price">

                    <strong>
                        ₪${product.price}
                    </strong>

                    ${oldPriceHTML}

                </div>


                <div class="product-options">

                    ${colorsHTML}

                </div>


                <button
                    class="add-to-cart-button"
                    type="button"
                    data-add-cart="${product.id}">

                    🛒 أضف للسلة

                </button>

            </div>

        </article>

    `;

}


/* =========================================================
   STARS
========================================================= */

function createStars(
    rating
) {

    return "★".repeat(
        Math.max(
            0,
            Math.min(
                5,
                rating
            )
        )
    );

}


/* =========================================================
   PRODUCT EVENTS
========================================================= */

function attachProductEvents() {


    document
        .querySelectorAll(
            "[data-add-cart]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const productId =
                        button.dataset.addCart;

                    addToCart(
                        productId,
                        1,
                        null
                    );

                }
            );

        });


    document
        .querySelectorAll(
            "[data-quick-view]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const product =
                        findProduct(
                            button.dataset.quickView
                        );

                    if (product) {

                        openProductModal(
                            product
                        );

                    }

                }
            );

        });


    document
        .querySelectorAll(
            "[data-favorite]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    toggleFavorite(
                        button.dataset.favorite
                    );

                }
            );

        });

}


/* =========================================================
   FIND PRODUCT
========================================================= */

function findProduct(
    productId
) {

    return products.find(
        product =>
            product.id === productId
    );

}


/* =========================================================
   CART
========================================================= */

function addToCart(
    productId,
    quantity = 1,
    size = null
) {

    const product =
        findProduct(productId);


    if (!product) {

        showToast(
            "المنتج غير موجود",
            "!"
        );

        return;

    }


    if (product.stock <= 0) {

        showToast(
            "هذا المنتج غير متوفر حاليًا",
            "!"
        );

        return;

    }


    const existingItem =
        cart.find(
            item =>
                item.productId === productId &&
                item.size === size
        );


    if (existingItem) {

        const newQuantity =
            existingItem.quantity +
            quantity;


        if (
            newQuantity >
            product.stock
        ) {

            showToast(
                `المتوفر فقط ${product.stock} قطع`,
                "!"
            );

            return;

        }


        existingItem.quantity =
            newQuantity;

    } else {

        cart.push({

            productId,

            quantity,

            size

        });

    }


    saveCart();

    updateCartUI();

    showToast(
        "تمت إضافة المنتج إلى السلة 🛒"
    );

}


/* =========================================================
   UPDATE CART UI
========================================================= */

function updateCartUI() {

    const totalItems =
        cart.reduce(
            (
                total,
                item
            ) =>
                total +
                item.quantity,
            0
        );


    if (cartCount) {

        cartCount.textContent =
            totalItems;

    }


    renderCartItems();

}


/* =========================================================
   RENDER CART
========================================================= */

function renderCartItems() {

    if (!cartItemsContainer) {

        return;

    }


    if (!cart.length) {

        cartItemsContainer.innerHTML = `

            <div class="empty-cart">

                <div>
                    🛒
                </div>

                <h3>
                    السلة فارغة
                </h3>

                <p>
                    أضف منتجاتك المفضلة إلى السلة.
                </p>

            </div>

        `;

        if (cartTotal) {

            cartTotal.textContent =
                "₪0";

        }

        return;

    }


    cartItemsContainer.innerHTML =
        cart
            .map(
                item =>
                    createCartItemHTML(
                        item
                    )
            )
            .join("");


    attachCartEvents();

    updateCartTotal();

}


/* =========================================================
   CART ITEM HTML
========================================================= */

function createCartItemHTML(
    item
) {

    const product =
        findProduct(
            item.productId
        );


    if (!product) {

        return "";

    }


    return `

        <div
            class="cart-item"
            data-cart-item="${product.id}">

            <img
                src="${product.image}"
                alt="${product.name}">


            <div class="cart-item-info">

                <h4>
                    ${product.name}
                </h4>

                <small>
                    ${product.categoryName}
                    ${
                        item.size
                            ? ` • ${item.size}`
                            : ""
                    }
                </small>


                <strong>
                    ₪${product.price}
                </strong>


                <div class="cart-item-controls">

                    <button
                        type="button"
                        data-cart-minus="${product.id}"
                        data-cart-size="${
                            item.size || ""
                        }">

                        −

                    </button>


                    <span>
                        ${item.quantity}
                    </span>


                    <button
                        type="button"
                        data-cart-plus="${product.id}"
                        data-cart-size="${
                            item.size || ""
                        }">

                        +

                    </button>

                </div>

            </div>


            <button
                class="cart-remove"
                type="button"
                data-cart-remove="${product.id}"
                data-cart-size="${
                    item.size || ""
                }">

                🗑️

            </button>

        </div>

    `;

}


/* =========================================================
   CART EVENTS
========================================================= */

function attachCartEvents() {


    document
        .querySelectorAll(
            "[data-cart-minus]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    changeCartQuantity(
                        button.dataset.cartMinus,
                        button.dataset.cartSize,
                        -1
                    );

                }
            );

        });


    document
        .querySelectorAll(
            "[data-cart-plus]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    changeCartQuantity(
                        button.dataset.cartPlus,
                        button.dataset.cartSize,
                        1
                    );

                }
            );

        });


    document
        .querySelectorAll(
            "[data-cart-remove]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    removeFromCart(
                        button.dataset.cartRemove,
                        button.dataset.cartSize
                    );

                }
            );

        });

}


/* =========================================================
   CHANGE CART QUANTITY
========================================================= */

function changeCartQuantity(
    productId,
    size,
    change
) {

    const item =
        cart.find(
            cartItem =>
                cartItem.productId ===
                    productId &&
                String(
                    cartItem.size || ""
                ) ===
                    String(
                        size || ""
                    )
        );


    const product =
        findProduct(productId);


    if (!item || !product) {

        return;

    }


    const newQuantity =
        item.quantity +
        change;


    if (newQuantity <= 0) {

        removeFromCart(
            productId,
            size
        );

        return;

    }


    if (
        newQuantity >
        product.stock
    ) {

        showToast(
            `المتوفر فقط ${product.stock} قطع`,
            "!"
        );

        return;

    }


    item.quantity =
        newQuantity;


    saveCart();

    updateCartUI();

}


/* =========================================================
   REMOVE CART ITEM
========================================================= */

function removeFromCart(
    productId,
    size
) {

    cart =
        cart.filter(
            item =>
                !(
                    item.productId ===
                        productId &&
                    String(
                        item.size || ""
                    ) ===
                        String(
                            size || ""
                        )
                )
        );


    saveCart();

    updateCartUI();

    showToast(
        "تم حذف المنتج من السلة"
    );

}


/* =========================================================
   CART TOTAL
========================================================= */

function calculateCartTotal() {

    return cart.reduce(
        (
            total,
            item
        ) => {

            const product =
                findProduct(
                    item.productId
                );

            if (!product) {

                return total;

            }

            return (
                total +
                product.price *
                    item.quantity
            );

        },
        0
    );

}


function updateCartTotal() {

    if (!cartTotal) {

        return;

    }


    const total =
        calculateCartTotal();


    cartTotal.textContent =
        `₪${total.toFixed(0)}`;

}


/* =========================================================
   OPEN / CLOSE CART
========================================================= */

function openCart() {

    if (cartDrawer) {

        cartDrawer.classList.add(
            "open"
        );

    }


    if (cartOverlay) {

        cartOverlay.classList.add(
            "open"
        );

    }


    document.body.style.overflow =
        "hidden";

}


function closeCart() {

    if (cartDrawer) {

        cartDrawer.classList.remove(
            "open"
        );

    }


    if (cartOverlay) {

        cartOverlay.classList.remove(
            "open"
        );

    }


    document.body.style.overflow =
        "";

}


/* =========================================================
   MOBILE MENU
========================================================= */

function openMobileMenu() {

    if (mobileMenu) {

        mobileMenu.classList.add(
            "open"
        );

    }


    document.body.style.overflow =
        "hidden";

}


function closeMobileMenuPanel() {

    if (mobileMenu) {

        mobileMenu.classList.remove(
            "open"
        );

    }


    document.body.style.overflow =
        "";

}


/* =========================================================
   SEARCH
========================================================= */

function performSearch(
    query
) {

    const cleanQuery =
        query
            .trim()
            .toLowerCase();


    if (!cleanQuery) {

        renderProducts(products);

        return;

    }


    const filtered =
        products.filter(
            product => {

                const searchableText =
                    [
                        product.name,
                        product.categoryName,
                        product.category
                    ]
                        .join(" ")
                        .toLowerCase();


                return searchableText.includes(
                    cleanQuery
                );

            }
        );


    renderProducts(filtered);


    const productsSection =
        document.getElementById(
            "products"
        );


    if (productsSection) {

        productsSection.scrollIntoView({
            behavior: "smooth"
        });

    }

}


/* =========================================================
   FAVORITES
========================================================= */

function toggleFavorite(
    productId
) {

    const index =
        favorites.indexOf(
            productId
        );


    if (index === -1) {

        favorites.push(
            productId
        );

        showToast(
            "تمت إضافة المنتج للمفضلة ❤️"
        );

    } else {

        favorites.splice(
            index,
            1
        );

        showToast(
            "تم حذف المنتج من المفضلة"
        );

    }


    saveFavorites();

    updateFavoriteButtons();

}


function updateFavoriteButtons() {

    document
        .querySelectorAll(
            "[data-favorite]"
        )
        .forEach(button => {

            const productId =
                button.dataset.favorite;


            if (
                favorites.includes(
                    productId
                )
            ) {

                button.textContent =
                    "♥️";

                button.style.color =
                    "#ff5d73";

            } else {

                button.textContent =
                    "♡";

                button.style.color =
                    "";

            }

        });

}


/* =========================================================
   PRODUCT MODAL
========================================================= */

function openProductModal(
    product
) {

    currentModalProduct =
        product;

    currentQuantity = 1;

    selectedSize =
        product.sizes &&
        product.sizes.length
            ? product.sizes[0]
            : null;


    if (modalProductImage) {

        modalProductImage.src =
            product.image;

        modalProductImage.alt =
            product.name;

    }


    if (modalProductCategory) {

        modalProductCategory.textContent =
            product.categoryName;

    }


    if (modalProductTitle) {

        modalProductTitle.textContent =
            product.name;

    }


    if (modalProductRating) {

        modalProductRating.innerHTML =
            `
                ${createStars(product.rating)}

                <span>
                    (${product.reviews})
                </span>
            `;

    }


    if (modalProductPrice) {

        modalProductPrice.innerHTML =
            `
                <strong>
                    ₪${product.price}
                </strong>

                ${
                    product.oldPrice
                        ? `
                            <del>
                                ₪${product.oldPrice}
                            </del>
                        `
                        : ""
                }
            `;

    }


    updateModalQuantity();

    updateSizeButtons();


    if (productModal) {

        productModal.classList.add(
            "open"
        );

    }


    document.body.style.overflow =
        "hidden";

}


function closeProductModalWindow() {

    if (productModal) {

        productModal.classList.remove(
            "open"
        );

    }


    currentModalProduct =
        null;

    document.body.style.overflow =
        "";

}


/* =========================================================
   MODAL QUANTITY
========================================================= */

function updateModalQuantity() {

    if (productQuantity) {

        productQuantity.textContent =
            currentQuantity;

    }

}


/* =========================================================
   SIZE BUTTONS
========================================================= */

function setupSizeButtons() {

    document
        .querySelectorAll(
            ".size-options button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(
                            ".size-options button"
                        )
                        .forEach(
                            otherButton => {

                                otherButton.classList.remove(
                                    "selected"
                                );

                            }
                        );


                    button.classList.add(
                        "selected"
                    );


                    selectedSize =
                        button.textContent.trim();

                }
            );

        });

}


function updateSizeButtons() {

    const buttons =
        document.querySelectorAll(
            ".size-options button"
        );


    if (!currentModalProduct) {

        return;

    }


    buttons.forEach(
        (button, index) => {

            const size =
                currentModalProduct
                    .sizes[index];


            if (size) {

                button.textContent =
                    size;

                button.style.display =
                    "";

            } else {

                button.style.display =
                    "none";

            }


            button.classList.toggle(
                "selected",
                size === selectedSize
            );

        }
    );

}


/* =========================================================
   TOAST
========================================================= */

let toastTimer = null;


function showToast(
    message,
    icon = "✓"
) {

    if (!toast) {

        return;

    }


    const toastIcon =
        document.getElementById(
            "toastIcon"
        );


    if (toastMessage) {

        toastMessage.textContent =
            message;

    }


    if (toastIcon) {

        toastIcon.textContent =
            icon;

    }


    toast.classList.add(
        "show"
    );


    clearTimeout(
        toastTimer
    );


    toastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            3000
        );

}


/* =========================================================
   CHECKOUT BUTTON
========================================================= */

const checkoutButton =
    document.getElementById(
        "checkoutButton"
    );


if (checkoutButton) {

    checkoutButton.addEventListener(
        "click",
        () => {

            if (!cart.length) {

                showToast(
                    "السلة فارغة",
                    "!"
                );

                return;

            }


            /*
             * Checkout will be connected
             * to the real order system
             * in the Supabase stage.
             */

            showToast(
                "سيتم فتح صفحة إتمام الطلب قريبًا 🛍️"
            );

        }
    );

}


/* =========================================================
   ACCOUNT BUTTON
========================================================= */

if (accountButton) {

    accountButton.addEventListener(
        "click",
        () => {

            showToast(
                "قسم حساب العميل سيتم تفعيله مع نظام الطلبات."
            );

        }
    );

}


/* =========================================================
   CATEGORY FILTERING
========================================================= */

document
    .querySelectorAll(
        ".navigation-container a"
    )
    .forEach(link => {

        link.addEventListener(
            "click",
            event => {

                const href =
                    link.getAttribute(
                        "href"
                    );


                if (
                    !href ||
                    !href.startsWith("#")
                ) {

                    return;

                }


                const category =
                    href.substring(1);


                if (
                    [
                        "boys",
                        "girls",
                        "baby"
                    ].includes(
                        category
                    )
                ) {

                    event.preventDefault();


                    const filtered =
                        products.filter(
                            product =>
                                product.category ===
                                category
                        );


                    renderProducts(
                        filtered
                    );


                    const section =
                        document.getElementById(
                            "products"
                        );


                    if (section) {

                        section.scrollIntoView({
                            behavior: "smooth"
                        });

                    }

                }

            }
        );

    });


/* =========================================================
   WINDOW STORAGE SYNC
========================================================= */

window.addEventListener(
    "storage",
    event => {

        if (
            event.key ===
            "littleStarsCart"
        ) {

            cart =
                loadCart();

            updateCartUI();

        }


        if (
            event.key ===
            "littleStarsFavorites"
        ) {

            favorites =
                loadFavorites();

            updateFavoriteButtons();

        }

    }
);


/* =========================================================
   EXPOSE STORE FUNCTIONS
   Useful later for admin / Supabase
========================================================= */

window.LittleStarsStore = {

    products,

    getCart() {

        return cart;

    },

    getFavorites() {

        return favorites;

    },

    getCartTotal() {

        return calculateCartTotal();

    },

    addToCart,

    removeFromCart,

    openProductModal,

    showToast

};


/* =========================================================
   END
========================================================= */
