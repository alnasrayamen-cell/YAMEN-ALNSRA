/* =========================================================
   KOSHI WEAR — APP.JS
   ========================================================= */

const SUPABASE_URL = "https://eflcolwdhddfncbuvjua.supabase.co";
const SUPABASE_KEY = "sb_publishable_J8K4FI12ExE5stcHVHviRQ_Uk__w4ko";

const supabaseClient = window.supabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;


/* =========================================================
   STATE
   ========================================================= */

let products = [];
let filteredProducts = [];

let cart = JSON.parse(localStorage.getItem("koshi_cart") || "[]");
let favorites = JSON.parse(localStorage.getItem("koshi_favorites") || "[]");

let currentCategory = "";
let currentSearch = "";
let currentSort = "default";

let selectedProduct = null;
let selectedColor = "";
let selectedSize = "";
let selectedQuantity = 1;

let saleTimerSeconds = 12 * 60 * 60;


/* =========================================================
   DOM
   ========================================================= */

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const productsGrid = $("#productsGrid");
const flashProductsGrid = $("#flashProductsGrid");
const newProductsGrid = $("#newProductsGrid");
const bestProductsGrid = $("#bestProductsGrid");

const productsEmpty = $("#productsEmpty");
const resultsCount = $("#resultsCount");

const searchInput = $("#searchInput");
const clearSearch = $("#clearSearch");

const cartDrawer = $("#cartDrawer");
const cartOverlay = $("#cartOverlay");
const cartItems = $("#cartItems");
const cartEmpty = $("#cartEmpty");

const cartCount = $("#cartCount");
const mobileCartCount = $("#mobileCartCount");

const favoritesCount = $("#favoritesCount");
const mobileFavoritesCount = $("#mobileFavoritesCount");

const productModal = $("#productModal");
const productModalBody = $("#productModalBody");

const checkoutModal = $("#checkoutModal");
const checkoutForm = $("#checkoutForm");

const toast = $("#toast");
const toastMessage = $("#toastMessage");


/* =========================================================
   INIT
   ========================================================= */

document.addEventListener("DOMContentLoaded", initializeStore);

async function initializeStore() {

  setupEvents();

  updateCartUI();
  updateFavoritesUI();

  startCountdown();

  if (!supabaseClient) {
    showToast("تعذر الاتصال بقاعدة البيانات");
    return;
  }

  await loadProducts();

  await trackVisitor();
}


/* =========================================================
   EVENTS
   ========================================================= */

function setupEvents() {

  document.addEventListener("click", handleGlobalClick);

  searchInput?.addEventListener("input", handleSearch);

  clearSearch?.addEventListener("click", () => {
    searchInput.value = "";
    currentSearch = "";
    clearSearch.classList.remove("show");
    applyFilters();
  });


  $("#sortSelect")?.addEventListener("change", (event) => {

    currentSort = event.target.value;

    applyFilters();

  });


  $("#filterButton")?.addEventListener("click", () => {

    $("#advancedFilters")?.classList.toggle("open");

  });


  $("#categoryFilter")?.addEventListener("change", () => {

    currentCategory = $("#categoryFilter").value;

    applyFilters();

  });


  $("#ageFilter")?.addEventListener("change", applyFilters);
  $("#colorFilter")?.addEventListener("change", applyFilters);
  $("#minPrice")?.addEventListener("input", applyFilters);
  $("#maxPrice")?.addEventListener("input", applyFilters);


  $("#clearFilters")?.addEventListener("click", clearFilters);


  $("#closeCart")?.addEventListener("click", closeCart);

  cartOverlay?.addEventListener("click", closeCart);


  $("#checkoutButton")?.addEventListener("click", openCheckout);


  $$("[data-close-modal]").forEach((button) => {

    button.addEventListener("click", closeProductModal);

  });


  $$("[data-close-checkout]").forEach((button) => {

    button.addEventListener("click", closeCheckout);

  });


  $("[data-close-success]")?.addEventListener("click", closeSuccess);


  $("#mobileMenuBtn")?.addEventListener("click", openMobileMenu);

  $("#closeMobileMenu")?.addEventListener("click", closeMobileMenu);

  $("#mobileOverlay")?.addEventListener("click", closeMobileMenu);


  $("#newsletterForm")?.addEventListener("submit", (event) => {

    event.preventDefault();

    const email = event.target.querySelector("input")?.value;

    if (!email) return;

    showToast("تم الاشتراك بنجاح");

    event.target.reset();

  });


  $$(".tabs button").forEach((button) => {

    button.addEventListener("click", () => {

      $$(".tabs button").forEach((btn) => {
        btn.classList.remove("active");
      });

      button.classList.add("active");

      const tab = button.dataset.newTab;

      renderNewProducts(tab);

    });

  });


  checkoutForm?.addEventListener("submit", submitOrder);

}


/* =========================================================
   GLOBAL CLICK
   ========================================================= */

function handleGlobalClick(event) {

  const navElement = event.target.closest("[data-nav]");

  if (navElement) {

    event.preventDefault();

    const target = navElement.dataset.nav;

    if (target === "home") {

      closeMobileMenu();

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });

      return;
    }

    if (target === "products") {

      closeMobileMenu();

      $("#products")?.scrollIntoView({
        behavior: "smooth"
      });

      return;
    }

  }


  const categoryElement = event.target.closest("[data-category]");

  if (categoryElement) {

    event.preventDefault();

    const category = categoryElement.dataset.category;

    closeMobileMenu();

    selectCategory(category);

    return;

  }


  const actionElement = event.target.closest("[data-action]");

  if (actionElement) {

    event.preventDefault();

    handleAction(actionElement.dataset.action);

  }

}


/* =========================================================
   ACTIONS
   ========================================================= */

function handleAction(action) {

  switch (action) {

    case "cart":
      openCart();
      break;

    case "wishlist":
      showFavorites();
      break;

    case "account":
      showToast("قسم الحساب قيد التجهيز");
      break;

    case "contact":
      showToast("تواصل معنا لخدمتك");
      break;

    case "delivery":
      showToast("سيتم تحديث معلومات التوصيل قريباً");
      break;

    case "policy":
      showToast("سياسة المتجر قيد التجهيز");
      break;

  }

}


/* =========================================================
   LOAD PRODUCTS
   ========================================================= */

async function loadProducts() {

  try {

    const {
      data,
      error
    } = await supabaseClient
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("created_at", {
        ascending: false
      });


    if (error) {
      console.error(error);
      showToast("حدث خطأ أثناء تحميل المنتجات");
      return;
    }


    products = data || [];

    filteredProducts = [...products];


    renderAllProducts();
    renderFlashProducts();
    renderNewProducts("all");
    renderBestProducts();


  } catch (error) {

    console.error(error);

    showToast("تعذر تحميل المنتجات");

  }

}


/* =========================================================
   CATEGORY
   ========================================================= */

function selectCategory(category) {

  currentCategory = category;

  $("#categoryFilter").value = category === "new"
    ? ""
    : category === "sale"
      ? "sale"
      : category;

  $("#productsTitle").textContent =
    getCategoryTitle(category);


  applyFilters();


  $("#products")?.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

}


function getCategoryTitle(category) {

  const titles = {

    new: "وصل حديثاً",
    girls: "ملابس بناتي",
    boys: "ملابس ولادي",
    newborn: "Baby",
    sets: "الأطقم",
    shoes: "الأحذية",
    accessories: "الإكسسوارات",
    sale: "التخفيضات"

  };

  return titles[category] || "جميع المنتجات";

}


/* =========================================================
   SEARCH
   ========================================================= */

function handleSearch(event) {

  currentSearch = event.target.value
    .trim()
    .toLowerCase();


  if (currentSearch) {
    clearSearch.classList.add("show");
  } else {
    clearSearch.classList.remove("show");
  }


  applyFilters();

}


/* =========================================================
   FILTERS
   ========================================================= */

function applyFilters() {

  let result = [...products];


  /* Search */

  if (currentSearch) {

    result = result.filter((product) => {

      const text = [
        product.name,
        product.description,
        product.sku
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(currentSearch);

    });

  }


  /* Category */

  if (currentCategory && currentCategory !== "new") {

    result = result.filter((product) => {

      return matchesCategory(product, currentCategory);

    });

  }


  /* New */

  if (currentCategory === "new") {

    result = result.slice(0, 30);

  }


  /* Age */

  const age = $("#ageFilter")?.value;

  if (age) {

    result = result.filter((product) => {

      const text = JSON.stringify(product)
        .toLowerCase();

      return text.includes(age);

    });

  }


  /* Color */

  const color = $("#colorFilter")?.value;

  if (color) {

    result = result.filter((product) => {

      const colors = normalizeArray(product.colors)
        .join(" ")
        .toLowerCase();

      return colors.includes(color);

    });

  }


  /* Price */

  const minPrice = parseFloat($("#minPrice")?.value);

  const maxPrice = parseFloat($("#maxPrice")?.value);


  if (!isNaN(minPrice)) {

    result = result.filter((product) => {

      return getProductPrice(product) >= minPrice;

    });

  }


  if (!isNaN(maxPrice)) {

    result = result.filter((product) => {

      return getProductPrice(product) <= maxPrice;

    });

  }


  /* Sort */

  result = sortProducts(result);


  filteredProducts = result;


  renderAllProducts();

}


/* =========================================================
   CATEGORY MATCH
   ========================================================= */

function matchesCategory(product, category) {

  const text = [
    product.name,
    product.description,
    product.sku
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();


  const categories = {

    girls: [
      "girl",
      "girls",
      "بناتي",
      "بنات",
      "فستان",
      "فساتين",
      "بنت"
    ],

    boys: [
      "boy",
      "boys",
      "ولادي",
      "ولاد",
      "ولد"
    ],

    newborn: [
      "baby",
      "newborn",
      "babies",
      "بيبي",
      "مواليد",
      "مولود",
      "رضيع"
    ],

    sets: [
      "set",
      "sets",
      "طقم",
      "اطقم",
      "أطقم"
    ],

    shoes: [
      "shoe",
      "shoes",
      "حذاء",
      "أحذية",
      "جزمة",
      "صندل"
    ],

    accessories: [
      "accessory",
      "accessories",
      "إكسسوار",
      "اكسسوار",
      "قبعة",
      "شنطة",
      "حقيبة"
    ]

  };


  if (category === "sale") {

    return hasDiscount(product);

  }


  const keywords = categories[category] || [];

  return keywords.some((keyword) => text.includes(keyword));

}


/* =========================================================
   SORT
   ========================================================= */

function sortProducts(list) {

  const result = [...list];


  if (currentSort === "price-low") {

    return result.sort(
      (a, b) =>
        getProductPrice(a) -
        getProductPrice(b)
    );

  }


  if (currentSort === "price-high") {

    return result.sort(
      (a, b) =>
        getProductPrice(b) -
        getProductPrice(a)
    );

  }


  if (currentSort === "newest") {

    return result.sort(
      (a, b) =>
        new Date(b.created_at) -
        new Date(a.created_at)
    );

  }


  if (currentSort === "sale") {

    return result.sort(
      (a, b) =>
        getDiscountPercent(b) -
        getDiscountPercent(a)
    );

  }


  return result;

}


/* =========================================================
   RENDER ALL
   ========================================================= */

function renderAllProducts() {

  if (!productsGrid) return;


  productsGrid.innerHTML = "";


  resultsCount.textContent =
    `${filteredProducts.length} منتج`;


  if (!filteredProducts.length) {

    productsEmpty.hidden = false;

    return;

  }


  productsEmpty.hidden = true;


  filteredProducts.forEach((product) => {

    productsGrid.appendChild(
      createProductCard(product)
    );

  });

}


/* =========================================================
   FLASH SALE
   ========================================================= */

function renderFlashProducts() {

  if (!flashProductsGrid) return;


  const saleProducts = products
    .filter(hasDiscount)
    .slice(0, 8);


  flashProductsGrid.innerHTML = "";


  saleProducts.forEach((product) => {

    flashProductsGrid.appendChild(
      createProductCard(product)
    );

  });

}


/* =========================================================
   NEW PRODUCTS
   ========================================================= */

function renderNewProducts(tab = "all") {

  if (!newProductsGrid) return;


  let list = [...products];


  if (tab !== "all") {

    list = list.filter((product) =>
      matchesCategory(product, tab)
    );

  }


  list = list.slice(0, 8);


  newProductsGrid.innerHTML = "";


  list.forEach((product) => {

    newProductsGrid.appendChild(
      createProductCard(product)
    );

  });

}


/* =========================================================
   BEST PRODUCTS
   ========================================================= */

function renderBestProducts() {

  if (!bestProductsGrid) return;


  const list = [...products]
    .sort((a, b) => {

      const aStock = Number(a.stock || 0);
      const bStock = Number(b.stock || 0);

      return bStock - aStock;

    })
    .slice(0, 8);


  bestProductsGrid.innerHTML = "";


  list.forEach((product) => {

    bestProductsGrid.appendChild(
      createProductCard(product)
    );

  });

}


/* =========================================================
   PRODUCT CARD
   ========================================================= */

function createProductCard(product) {

  const card = document.createElement("article");

  card.className = "product-card";

  card.dataset.productId = product.id;


  const price = getProductPrice(product);

  const sale = hasDiscount(product);

  const discount = getDiscountPercent(product);

  const favorite = favorites.includes(product.id);


  const colors = normalizeArray(product.colors);


  const colorHTML = colors
    .slice(0, 6)
    .map((color) => {

      return `
        <span
          class="product-color"
          style="background:${getColorValue(color)}"
          title="${escapeHTML(String(color))}"
        ></span>
      `;

    })
    .join("");


  const stock = Math.max(
    0,
    Math.min(
      100,
      Number(product.stock || 0) * 10
    )
  );


  card.innerHTML = `

    <div class="product-image-wrap">

      ${
        sale
          ? `<span class="product-badge">
              -${discount}%
             </span>`
          : ""
      }

      <button
        class="product-wishlist ${favorite ? "active" : ""}"
        data-favorite="${product.id}"
        type="button"
        aria-label="المفضلة"
      >
        <i class="${favorite ? "fa-solid" : "fa-regular"} fa-heart"></i>
      </button>


      <img
        src="${escapeAttribute(product.image_url || getPlaceholderImage())}"
        alt="${escapeAttribute(product.name || "Koshi Wear")}"
        loading="lazy"
      >

    </div>


    <div class="product-info">

      <h3 class="product-name">
        ${escapeHTML(product.name || "منتج")}
      </h3>


      <div class="product-rating">
        <span>★★★★★</span>
        <span>4.9</span>
      </div>


      <div class="product-price">

        <strong class="current-price">
          ₪${formatPrice(price)}
        </strong>

        ${
          sale
            ? `
              <del class="old-price">
                ₪${formatPrice(product.price)}
              </del>

              <span class="discount">
                -${discount}%
              </span>
            `
            : ""
        }

      </div>


      ${
        colorHTML
          ? `
            <div class="product-colors">
              ${colorHTML}
            </div>
          `
          : ""
      }


      ${
        product.stock !== undefined
          ? `
            <div class="product-stock">
              <span style="width:${stock}%"></span>
            </div>

            <div class="product-stock-text">
              ${Number(product.stock)} قطعة متوفرة
            </div>
          `
          : ""
      }

    </div>

  `;


  card.addEventListener("click", (event) => {

    if (
      event.target.closest("[data-favorite]")
    ) {
      return;
    }

    openProductModal(product);

  });


  const favoriteButton =
    card.querySelector("[data-favorite]");


  favoriteButton?.addEventListener("click", (event) => {

    event.stopPropagation();

    toggleFavorite(product.id);

  });


  return card;

}


/* =========================================================
   PRODUCT MODAL
   ========================================================= */

function openProductModal(product) {

  selectedProduct = product;

  selectedQuantity = 1;

  selectedColor =
    normalizeArray(product.colors)[0] || "";

  selectedSize =
    normalizeArray(product.sizes)[0] || "";


  const price = getProductPrice(product);

  const sale = hasDiscount(product);

  const colors = normalizeArray(product.colors);

  const sizes = normalizeArray(product.sizes);


  productModalBody.innerHTML = `

    <div class="product-modal-content">

      <div class="product-modal-gallery">

        <img
          src="${escapeAttribute(product.image_url || getPlaceholderImage())}"
          alt="${escapeAttribute(product.name || "Koshi Wear")}"
        >

      </div>


      <div class="product-modal-details">

        <h2>
          ${escapeHTML(product.name || "منتج")}
        </h2>


        <div class="product-rating">
          <span>★★★★★</span>
          <span>4.9</span>
        </div>


        <div class="product-modal-price">

          <strong>
            ₪${formatPrice(price)}
          </strong>

          ${
            sale
              ? `
                <del>
                  ₪${formatPrice(product.price)}
                </del>
              `
              : ""
          }

        </div>


        <p class="product-modal-description">
          ${escapeHTML(
            product.description ||
            "قطعة مميزة من تشكيلة 𝐊𝐨𝐬𝐡𝐢 𝐰𝐞𝐚𝐫."
          )}
        </p>


        ${
          colors.length
            ? `
              <div class="product-option">

                <div class="product-option-title">
                  <span>اللون</span>
                  <span id="selectedColorLabel">
                    ${escapeHTML(String(selectedColor))}
                  </span>
                </div>

                <div class="option-buttons">

                  ${colors.map((color) => `

                    <button
                      type="button"
                      data-color-option="${escapeAttribute(color)}"
                      class="${color === selectedColor ? "active" : ""}"
                    >
                      ${escapeHTML(String(color))}
                    </button>

                  `).join("")}

                </div>

              </div>
            `
            : ""
        }


        ${
          sizes.length
            ? `
              <div class="product-option">

                <div class="product-option-title">
                  <span>المقاس</span>
                </div>

                <div class="option-buttons">

                  ${sizes.map((size) => `

                    <button
                      type="button"
                      data-size-option="${escapeAttribute(size)}"
                      class="${size === selectedSize ? "active" : ""}"
                    >
                      ${escapeHTML(String(size))}
                    </button>

                  `).join("")}

                </div>

              </div>
            `
            : ""
        }


        <div class="product-option">

          <div class="product-option-title">
            <span>الكمية</span>
          </div>

          <div class="quantity-control">

            <button
              type="button"
              id="decreaseQuantity"
            >
              −
            </button>

            <span id="productQuantity">
              1
            </span>

            <button
              type="button"
              id="increaseQuantity"
            >
              +
            </button>

          </div>

        </div>


        <button
          type="button"
          class="add-to-cart-btn"
          id="addToCartButton"
        >
          إضافة إلى السلة
          <i class="fa-solid fa-bag-shopping"></i>
        </button>


        <div class="product-details-list">

          <div>
            <i class="fa-solid fa-truck"></i>
            <span>توصيل إلى مناطق متعددة</span>
          </div>

          <div>
            <i class="fa-solid fa-shield"></i>
            <span>تجربة شراء آمنة</span>
          </div>

          <div>
            <i class="fa-solid fa-box"></i>
            <span>تغليف مرتب للطلب</span>
          </div>

        </div>

      </div>

    </div>

  `;


  productModal.classList.add("open");
  productModal.setAttribute("aria-hidden", "false");

  document.body.classList.add("modal-open");


  setupProductModalEvents();

}


/* =========================================================
   PRODUCT MODAL EVENTS
   ========================================================= */

function setupProductModalEvents() {

  $$("[data-color-option]").forEach((button) => {

    button.addEventListener("click", () => {

      $$("[data-color-option]").forEach((btn) => {
        btn.classList.remove("active");
      });

      button.classList.add("active");

      selectedColor =
        button.dataset.colorOption;

      const label =
        $("#selectedColorLabel");

      if (label) {
        label.textContent = selectedColor;
      }

    });

  });


  $$("[data-size-option]").forEach((button) => {

    button.addEventListener("click", () => {

      $$("[data-size-option]").forEach((btn) => {
        btn.classList.remove("active");
      });

      button.classList.add("active");

      selectedSize =
        button.dataset.sizeOption;

    });

  });


  $("#decreaseQuantity")?.addEventListener(
    "click",
    () => {

      selectedQuantity =
        Math.max(1, selectedQuantity - 1);

      $("#productQuantity").textContent =
        selectedQuantity;

    }
  );


  $("#increaseQuantity")?.addEventListener(
    "click",
    () => {

      selectedQuantity += 1;

      $("#productQuantity").textContent =
        selectedQuantity;

    }
  );


  $("#addToCartButton")?.addEventListener(
    "click",
    () => {

      addToCart(
        selectedProduct,
        selectedColor,
        selectedSize,
        selectedQuantity
      );

      closeProductModal();

    }
  );

}


/* =========================================================
   CLOSE PRODUCT MODAL
   ========================================================= */

function closeProductModal() {

  productModal.classList.remove("open");

  productModal.setAttribute(
    "aria-hidden",
    "true"
  );

  document.body.classList.remove("modal-open");

}


/* =========================================================
   CART
   ========================================================= */

function addToCart(
  product,
  color = "",
  size = "",
  quantity = 1
) {

  const existing = cart.find((item) =>

    item.productId === product.id &&
    item.color === color &&
    item.size === size

  );


  if (existing) {

    existing.quantity += quantity;

  } else {

    cart.push({

      productId: product.id,

      name: product.name,

      image: product.image_url,

      price: getProductPrice(product),

      color,

      size,

      quantity

    });

  }


  saveCart();

  updateCartUI();

  showToast("تمت إضافة المنتج إلى السلة");

}


/* =========================================================
   REMOVE CART
   ========================================================= */

function removeFromCart(index) {

  cart.splice(index, 1);

  saveCart();

  updateCartUI();

}


/* =========================================================
   CHANGE CART QUANTITY
   ========================================================= */

function changeCartQuantity(index, amount) {

  if (!cart[index]) return;

  cart[index].quantity += amount;


  if (cart[index].quantity <= 0) {

    cart.splice(index, 1);

  }


  saveCart();

  updateCartUI();

}


/* =========================================================
   SAVE CART
   ========================================================= */

function saveCart() {

  localStorage.setItem(
    "koshi_cart",
    JSON.stringify(cart)
  );

}


/* =========================================================
   CART UI
   ========================================================= */

function updateCartUI() {

  const count = cart.reduce(
    (sum, item) =>
      sum + Number(item.quantity || 0),
    0
  );


  if (cartCount) {
    cartCount.textContent = count;
  }

  if (mobileCartCount) {
    mobileCartCount.textContent = count;
  }


  if (!cartItems) return;


  cartItems.innerHTML = "";


  if (!cart.length) {

    cartEmpty.hidden = false;

  } else {

    cartEmpty.hidden = true;


    cart.forEach((item, index) => {

      const element =
        document.createElement("div");

      element.className = "cart-item";


      element.innerHTML = `

        <div class="cart-item-image">

          <img
            src="${escapeAttribute(
              item.image || getPlaceholderImage()
            )}"
            alt="${escapeAttribute(item.name)}"
          >

        </div>


        <div class="cart-item-info">

          <h4>
            ${escapeHTML(item.name)}
          </h4>


          ${
            item.color || item.size
              ? `
                <p>
                  ${item.color ? `اللون: ${escapeHTML(item.color)}` : ""}
                  ${item.color && item.size ? " • " : ""}
                  ${item.size ? `المقاس: ${escapeHTML(item.size)}` : ""}
                </p>
              `
              : ""
          }


          <div class="cart-item-price">
            ₪${formatPrice(item.price * item.quantity)}
          </div>


          <div class="cart-item-controls">

            <button
              type="button"
              data-cart-minus="${index}"
            >
              −
            </button>

            <span>
              ${item.quantity}
            </span>

            <button
              type="button"
              data-cart-plus="${index}"
            >
              +
            </button>

          </div>

        </div>


        <button
          class="cart-item-remove"
          type="button"
          data-cart-remove="${index}"
        >
          <i class="fa-solid fa-trash"></i>
        </button>

      `;


      cartItems.appendChild(element);

    });

  }


  updateCartSummary();

}


/* =========================================================
   CART EVENTS
   ========================================================= */

document.addEventListener("click", (event) => {

  const minus =
    event.target.closest("[data-cart-minus]");

  if (minus) {

    changeCartQuantity(
      Number(minus.dataset.cartMinus),
      -1
    );

    return;

  }


  const plus =
    event.target.closest("[data-cart-plus]");

  if (plus) {

    changeCartQuantity(
      Number(plus.dataset.cartPlus),
      1
    );

    return;

  }


  const remove =
    event.target.closest("[data-cart-remove]");

  if (remove) {

    removeFromCart(
      Number(remove.dataset.cartRemove)
    );

  }

});


/* =========================================================
   CART SUMMARY
   ========================================================= */

function updateCartSummary() {

  const subtotal = cart.reduce(
    (sum, item) =>
      sum +
      Number(item.price || 0) *
      Number(item.quantity || 0),
    0
  );


  const discount = 0;

  const shipping =
    cart.length ? 0 : 0;

  const total =
    subtotal - discount + shipping;


  $("#cartSubtotal").textContent =
    `₪${formatPrice(subtotal)}`;


  $("#cartDiscount").textContent =
    `₪${formatPrice(discount)}`;


  $("#cartShipping").textContent =
    cart.length
      ? "يحدد عند الطلب"
      : "₪0";


  $("#cartTotal").textContent =
    `₪${formatPrice(total)}`;


  $("#checkoutTotal").textContent =
    `₪${formatPrice(total)}`;

}


/* =========================================================
   OPEN CART
   ========================================================= */

function openCart() {

  cartDrawer.classList.add("open");

  cartOverlay.classList.add("show");

  cartDrawer.setAttribute(
    "aria-hidden",
    "false"
  );

}


/* =========================================================
   CLOSE CART
   ========================================================= */

function closeCart() {

  cartDrawer.classList.remove("open");

  cartOverlay.classList.remove("show");

  cartDrawer.setAttribute(
    "aria-hidden",
    "true"
  );

}


/* =========================================================
   FAVORITES
   ========================================================= */

function toggleFavorite(productId) {

  const index =
    favorites.indexOf(productId);


  if (index >= 0) {

    favorites.splice(index, 1);

    showToast("تمت إزالة المنتج من المفضلة");

  } else {

    favorites.push(productId);

    showToast("تمت إضافة المنتج للمفضلة");

  }


  localStorage.setItem(
    "koshi_favorites",
    JSON.stringify(favorites)
  );


  updateFavoritesUI();

  renderAllProducts();
  renderFlashProducts();
  renderNewProducts("all");
  renderBestProducts();

}


function updateFavoritesUI() {

  const count = favorites.length;


  if (favoritesCount) {
    favoritesCount.textContent = count;
  }


  if (mobileFavoritesCount) {
    mobileFavoritesCount.textContent = count;
  }

}


/* =========================================================
   SHOW FAVORITES
   ========================================================= */

function showFavorites() {

  if (!favorites.length) {

    showToast("لا توجد منتجات في المفضلة");

    return;

  }


  const favoriteProducts =
    products.filter((product) =>
      favorites.includes(product.id)
    );


  currentCategory = "";

  currentSearch = "";

  filteredProducts = favoriteProducts;


  $("#productsTitle").textContent =
    "المفضلة";


  productsGrid.innerHTML = "";


  favoriteProducts.forEach((product) => {

    productsGrid.appendChild(
      createProductCard(product)
    );

  });


  resultsCount.textContent =
    `${favoriteProducts.length} منتج`;


  productsEmpty.hidden =
    favoriteProducts.length !== 0;


  $("#products")?.scrollIntoView({
    behavior: "smooth"
  });

}


/* =========================================================
   CHECKOUT
   ========================================================= */

function openCheckout() {

  if (!cart.length) {

    showToast("السلة فارغة");

    return;

  }


  updateCartSummary();

  closeCart();


  checkoutModal.classList.add("open");

  checkoutModal.setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.classList.add("modal-open");

}


function closeCheckout() {

  checkoutModal.classList.remove("open");

  checkoutModal.setAttribute(
    "aria-hidden",
    "true"
  );

  document.body.classList.remove("modal-open");

}


/* =========================================================
   SUBMIT ORDER
   ========================================================= */

async function submitOrder(event) {

  event.preventDefault();


  if (!cart.length) {

    showToast("السلة فارغة");

    return;

  }


  if (!supabaseClient) {

    showToast("تعذر الاتصال بقاعدة البيانات");

    return;

  }


  const formData =
    new FormData(checkoutForm);


  const customer = {

    full_name:
      formData.get("customerName"),

    phone:
      formData.get("customerPhone"),

    region:
      formData.get("customerRegion"),

    city:
      formData.get("customerCity"),

    address:
      formData.get("customerAddress"),

    landmark:
      formData.get("customerLandmark") || "",

    notes:
      formData.get("customerNotes") || ""

  };


  const items = cart.map((item) => ({

    product_id:
      item.productId,

    product_name:
      item.name,

    quantity:
      item.quantity,

    unit_price:
      item.price,

    selected_color:
      item.color || null,

    selected_size:
      item.size || null

  }));


  const total =
    cart.reduce(
      (sum, item) =>
        sum +
        Number(item.price || 0) *
        Number(item.quantity || 0),
      0
    );


  try {

    const {
      data,
      error
    } = await supabaseClient.rpc(
      "create_store_order",
      {
        p_customer:
          customer,

        p_items:
          items,

        p_total:
          total,

        p_traffic_source:
          getTrafficSource(),

        p_notes:
          customer.notes || ""
      }
    );


    if (error) {

      console.error(error);

      showToast(
        "حدث خطأ أثناء إرسال الطلب"
      );

      return;

    }


    console.log(
      "Order created:",
      data
    );


    cart = [];

    saveCart();

    updateCartUI();

    checkoutForm.reset();

    closeCheckout();

    showSuccess();

  } catch (error) {

    console.error(error);

    showToast(
      "تعذر إرسال الطلب"
    );

  }

}


/* =========================================================
   SUCCESS
   ========================================================= */

function showSuccess() {

  const modal =
    $("#orderSuccessModal");

  modal.classList.add("open");

  modal.setAttribute(
    "aria-hidden",
    "false"
  );

}


function closeSuccess() {

  const modal =
    $("#orderSuccessModal");

  modal.classList.remove("open");

  modal.setAttribute(
    "aria-hidden",
    "true"
  );

}


/* =========================================================
   MOBILE MENU
   ========================================================= */

function openMobileMenu() {

  $("#mobileMenu")?.classList.add("open");

  $("#mobileOverlay")?.classList.add("show");

  document.body.classList.add("menu-open");

}


function closeMobileMenu() {

  $("#mobileMenu")?.classList.remove("open");

  $("#mobileOverlay")?.classList.remove("show");

  document.body.classList.remove("menu-open");

}


/* =========================================================
   COUNTDOWN
   ========================================================= */

function startCountdown() {

  updateCountdown();


  setInterval(() => {

    saleTimerSeconds--;

    if (saleTimerSeconds <= 0) {
      saleTimerSeconds =
        12 * 60 * 60;
    }

    updateCountdown();

  }, 1000);

}


function updateCountdown() {

  const hours =
    Math.floor(
      saleTimerSeconds / 3600
    );


  const minutes =
    Math.floor(
      (saleTimerSeconds % 3600) / 60
    );


  const seconds =
    saleTimerSeconds % 60;


  if ($("#countHours")) {
    $("#countHours").textContent =
      String(hours).padStart(2, "0");
  }


  if ($("#countMinutes")) {
    $("#countMinutes").textContent =
      String(minutes).padStart(2, "0");
  }


  if ($("#countSeconds")) {
    $("#countSeconds").textContent =
      String(seconds).padStart(2, "0");
  }

}


/* =========================================================
   VISITOR TRACKING
   ========================================================= */

async function trackVisitor() {

  if (!supabaseClient) return;


  try {

    let sessionId =
      localStorage.getItem(
        "koshi_visitor_session"
      );


    if (!sessionId) {

      sessionId =
        crypto.randomUUID();

      localStorage.setItem(
        "koshi_visitor_session",
        sessionId
      );

    }


    await supabaseClient
      .from("visitor_sessions")
      .upsert(
        {
          session_id:
            sessionId,

          traffic_source:
            getTrafficSource(),

          current_page:
            window.location.pathname,

          last_seen_at:
            new Date().toISOString()
        },
        {
          onConflict:
            "session_id"
        }
      );

  } catch (error) {

    console.warn(
      "Visitor tracking:",
      error
    );

  }

}


/* =========================================================
   TRAFFIC SOURCE
   ========================================================= */

function getTrafficSource() {

  const referrer =
    document.referrer;


  if (!referrer) {
    return "direct";
  }


  try {

    const host =
      new URL(referrer).hostname;


    if (host.includes("google")) {
      return "google";
    }

    if (host.includes("instagram")) {
      return "instagram";
    }

    if (host.includes("facebook")) {
      return "facebook";
    }

    if (host.includes("tiktok")) {
      return "tiktok";
    }

    return host;

  } catch {

    return "other";

  }

}


/* =========================================================
   HELPERS
   ========================================================= */

function getProductPrice(product) {

  if (
    product.sale_price !== null &&
    product.sale_price !== undefined &&
    Number(product.sale_price) > 0
  ) {

    return Number(product.sale_price);

  }


  return Number(product.price || 0);

}


function hasDiscount(product) {

  const price =
    Number(product.price || 0);

  const sale =
    Number(product.sale_price || 0);


  return (
    price > 0 &&
    sale > 0 &&
    sale < price
  );

}


function getDiscountPercent(product) {

  if (!hasDiscount(product)) {
    return 0;
  }


  const price =
    Number(product.price);


  const sale =
    Number(product.sale_price);


  return Math.round(
    ((price - sale) / price) * 100
  );

}


function normalizeArray(value) {

  if (!value) return [];


  if (Array.isArray(value)) {
    return value;
  }


  if (typeof value === "string") {

    try {

      const parsed =
        JSON.parse(value);

      if (Array.isArray(parsed)) {
        return parsed;
      }

    } catch {}

    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

  }


  return [];

}


function getColorValue(color) {

  const value =
    String(color)
      .toLowerCase()
      .trim();


  const colors = {

    black: "#111111",
    "أسود": "#111111",

    white: "#ffffff",
    "أبيض": "#ffffff",

    blue: "#315c9a",
    "أزرق": "#315c9a",

    pink: "#e8a6b8",
    "زهري": "#e8a6b8",
    "وردي": "#e8a6b8",

    green: "#587c5d",
    "أخضر": "#587c5d",

    beige: "#c8b99b",
    "بيج": "#c8b99b",

    red: "#b83c3c",
    "أحمر": "#b83c3c",

    gray: "#777777",
    "رمادي": "#777777",

    brown: "#795548",
    "بني": "#795548"

  };


  return colors[value] || "#777";

}


function formatPrice(value) {

  return Number(value || 0)
    .toFixed(2)
    .replace(".00", "");

}


function escapeHTML(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


function escapeAttribute(value) {

  return escapeHTML(value);

}


function getPlaceholderImage() {

  return "https://via.placeholder.com/800x1000/111111/ffffff?text=KOSHI+WEAR";

}


/* =========================================================
   CLEAR FILTERS
   ========================================================= */

function clearFilters() {

  currentCategory = "";
  currentSearch = "";
  currentSort = "default";


  if (searchInput) {
    searchInput.value = "";
  }

  clearSearch?.classList.remove("show");


  $("#categoryFilter").value = "";
  $("#ageFilter").value = "";
  $("#colorFilter").value = "";
  $("#minPrice").value = "";
  $("#maxPrice").value = "";
  $("#sortSelect").value = "default";


  $("#productsTitle").textContent =
    "جميع المنتجات";


  applyFilters();

}


/* =========================================================
   TOAST
   ========================================================= */

let toastTimeout;


function showToast(message) {

  if (!toast) return;


  toastMessage.textContent =
    message;


  toast.classList.add("show");


  clearTimeout(toastTimeout);


  toastTimeout =
    setTimeout(() => {

      toast.classList.remove("show");

    }, 2500);

}


/* =========================================================
   KEYBOARD
   ========================================================= */

document.addEventListener("keydown", (event) => {

  if (event.key === "Escape") {

    closeProductModal();
    closeCheckout();
    closeCart();
    closeMobileMenu();

  }

});
