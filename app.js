// ============================================================
// KOSHI.WEAR
// REAL PRODUCTS + REAL CART + REAL CHECKOUT
// ============================================================

const SUPABASE_URL =
  "https://eflcolwdhddfncbuvjua.supabase.co";

// IMPORTANT:
// Keep your existing Supabase Publishable Key here.
// Do not use the secret/service_role key.
const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_J8K4FI12ExE5stcHVHviRQ_Uk__w4ko";

const { createClient } = window.supabase;

const supabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

// ============================================================
// GLOBAL STATE
// ============================================================

let products = [];
let cart = [];
let visitorTrackingStarted = false;

// ============================================================
// DOM
// ============================================================

const productsGrid =
  document.getElementById("productsGrid");

const productSearch =
  document.getElementById("productSearch");

const cartCount =
  document.getElementById("cartCount");

const cartBody =
  document.getElementById("cartBody");

const cartTotal =
  document.getElementById("cartTotal");

// ============================================================
// START
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {

  loadCart();

  updateCartUI();

  await loadProducts();

  setupSearch();

  setupFilters();

  setupCheckout();

  startVisitorTracking();

});

// ============================================================
// LOAD PRODUCTS
// ============================================================

async function loadProducts() {

  if (!productsGrid) return;

  productsGrid.innerHTML = `
    <div style="
      grid-column:1/-1;
      text-align:center;
      padding:60px 20px;
      color:#888;
    ">
      <div style="
        font-size:30px;
        margin-bottom:12px;
      ">
        KOSHI.WEAR
      </div>

      <div>
        جاري تحميل المنتجات...
      </div>
    </div>
  `;

  try {

    const {
      data,
      error
    } = await supabaseClient
      .from("products")
      .select(`
        id,
        name,
        description,
        price,
        sale_price,
        image_url,
        sku,
        barcode,
        stock,
        colors,
        sizes,
        is_active,
        created_at,
        updated_at
      `)
      .eq("is_active", true)
      .order("created_at", {
        ascending: false
      });

    if (error) throw error;

    products = data || [];

    renderProducts(products);

  } catch (error) {

    console.error(
      "KOSHI.WEAR products error:",
      error
    );

    productsGrid.innerHTML = `
      <div style="
        grid-column:1/-1;
        text-align:center;
        padding:60px 20px;
      ">

        <div style="
          font-size:22px;
          font-weight:700;
          margin-bottom:10px;
        ">
          تعذر تحميل المنتجات
        </div>

        <div style="
          color:#888;
          font-size:13px;
          margin-bottom:18px;
        ">
          تأكد من اتصال المتجر بقاعدة البيانات.
        </div>

        <button
          type="button"
          onclick="loadProducts()"
          style="
            background:#000;
            color:#fff;
            border:0;
            border-radius:10px;
            padding:12px 24px;
            cursor:pointer;
          "
        >
          إعادة المحاولة
        </button>

      </div>
    `;
  }
}

// ============================================================
// RENDER PRODUCTS
// ============================================================

function renderProducts(list) {

  if (!productsGrid) return;

  if (!list.length) {

    productsGrid.innerHTML = `
      <div style="
        grid-column:1/-1;
        text-align:center;
        padding:70px 20px;
        color:#888;
      ">

        <div style="
          font-size:20px;
          color:#111;
          font-weight:700;
          margin-bottom:8px;
        ">
          لا توجد منتجات حاليًا
        </div>

        <div style="font-size:13px;">
          أضف المنتجات من لوحة الإدارة.
        </div>

      </div>
    `;

    return;
  }

  productsGrid.innerHTML =
    list.map(product => {

      const price =
        Number(product.price || 0);

      const salePrice =
        product.sale_price !== null &&
        product.sale_price !== undefined &&
        product.sale_price !== ""
          ? Number(product.sale_price)
          : null;

      const finalPrice =
        salePrice !== null &&
        salePrice > 0 &&
        salePrice < price
          ? salePrice
          : price;

      const isSale =
        salePrice !== null &&
        salePrice > 0 &&
        salePrice < price;

      const stock =
        Number(product.stock || 0);

      const isOutOfStock =
        stock <= 0;

      const image =
        product.image_url ||
        "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=1000&q=85";

      return `
        <article
          class="product-card"
          data-product-id="${escapeHTML(product.id)}"
          data-name="${escapeHTML(product.name || "")}"
        >

          <div class="product-image">

            ${
              isOutOfStock
                ? `
                  <span
                    class="product-badge"
                    style="
                      background:#111;
                      color:#fff;
                    "
                  >
                    نفدت الكمية
                  </span>
                `
                : isSale
                  ? `
                    <span class="product-badge sale">
                      SALE
                    </span>
                  `
                  : `
                    <span class="product-badge">
                      NEW
                    </span>
                  `
            }

            <img
              src="${escapeAttribute(image)}"
              alt="${escapeAttribute(product.name || "KOSHI.WEAR")}"
              loading="lazy"
              onerror="
                this.src='https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=1000&q=85'
              "
            >

          </div>

          <div class="product-info">

            <h3 class="product-name">
              ${escapeHTML(product.name || "منتج")}
            </h3>

            ${
              product.description
                ? `
                  <p class="product-description">
                    ${escapeHTML(product.description)}
                  </p>
                `
                : ""
            }

            <div class="price">

              <span class="current-price">
                ${formatPrice(finalPrice)}
              </span>

              ${
                isSale
                  ? `
                    <span class="old-price">
                      ${formatPrice(price)}
                    </span>
                  `
                  : ""
              }

            </div>

            ${
              isOutOfStock
                ? `
                  <button
                    class="add-product"
                    type="button"
                    disabled
                    style="
                      background:#eee;
                      color:#777;
                      border-color:#eee;
                      cursor:not-allowed;
                    "
                  >
                    نفدت الكمية
                  </button>
                `
                : `
                  <button
                    class="add-product"
                    type="button"
                    onclick="addProductToCart('${escapeJS(product.id)}')"
                  >
                    أضف إلى السلة
                  </button>
                `
            }

          </div>

        </article>
      `;

    }).join("");
}

// ============================================================
// ADD PRODUCT TO CART
// ============================================================

async function addProductToCart(productId) {

  const product =
    products.find(
      item =>
        String(item.id) === String(productId)
    );

  if (!product) {
    alert("تعذر العثور على المنتج.");
    return;
  }

  const stock =
    Number(product.stock || 0);

  if (stock <= 0) {
    alert("هذا المنتج نفدت كميته.");
    return;
  }

  const existing =
    cart.find(
      item =>
        String(item.product_id) ===
        String(product.id)
    );

  if (existing) {

    if (existing.quantity >= stock) {

      alert(
        `الكمية المتوفرة حاليًا: ${stock}`
      );

      return;
    }

    existing.quantity += 1;

  } else {

    const price =
      Number(product.price || 0);

    const salePrice =
      product.sale_price !== null &&
      product.sale_price !== undefined &&
      product.sale_price !== ""
        ? Number(product.sale_price)
        : null;

    const finalPrice =
      salePrice !== null &&
      salePrice > 0 &&
      salePrice < price
        ? salePrice
        : price;

    cart.push({

      product_id: product.id,

      name: product.name,

      image_url: product.image_url,

      price: finalPrice,

      original_price: price,

      quantity: 1,

      stock: stock,

      colors: normalizeArray(product.colors),

      sizes: normalizeArray(product.sizes),

      selected_color: null,

      selected_size: null

    });
  }

  saveCart();

  updateCartUI();

  openCart();
}

// ============================================================
// REMOVE PRODUCT
// ============================================================

function removeCartItem(index) {

  if (
    index < 0 ||
    index >= cart.length
  ) {
    return;
  }

  cart.splice(index, 1);

  saveCart();

  updateCartUI();
}

// ============================================================
// CHANGE QUANTITY
// ============================================================

function changeCartQuantity(index, change) {

  const item = cart[index];

  if (!item) return;

  const newQuantity =
    Number(item.quantity || 0) + Number(change || 0);

  if (newQuantity <= 0) {

    removeCartItem(index);

    return;
  }

  if (
    item.stock &&
    newQuantity > Number(item.stock)
  ) {

    alert(
      `الكمية المتوفرة حاليًا: ${item.stock}`
    );

    return;
  }

  item.quantity =
    newQuantity;

  saveCart();

  updateCartUI();
}

// ============================================================
// CART UI
// ============================================================

function updateCartUI() {

  if (!cartCount) return;

  const count =
    cart.reduce(
      (total, item) =>
        total +
        Number(item.quantity || 0),
      0
    );

  cartCount.textContent = count;

  const total =
    calculateCartTotal();

  if (cartTotal) {

    cartTotal.textContent =
      formatPrice(total);
  }

  if (!cartBody) return;

  if (!cart.length) {

    cartBody.innerHTML = `
      <div class="empty-cart">

        <div class="empty-cart-icon">
          🛍
        </div>

        <strong>
          السلة فارغة
        </strong>

        <span>
          أضف بعض القطع التي تعجبك.
        </span>

      </div>
    `;

    return;
  }

  cartBody.innerHTML =
    cart.map(
      (item, index) => {

        const itemTotal =
          Number(item.price || 0) *
          Number(item.quantity || 0);

        return `
          <div style="
            display:flex;
            gap:12px;
            padding:15px 0;
            border-bottom:1px solid #eee;
            align-items:center;
          ">

            <img
              src="${escapeAttribute(
                item.image_url ||
                "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=300&q=80"
              )}"
              alt=""
              style="
                width:72px;
                height:90px;
                object-fit:cover;
                border-radius:10px;
                background:#eee;
              "
            >

            <div style="
              flex:1;
              min-width:0;
            ">

              <strong style="
                display:block;
                font-size:13px;
                margin-bottom:5px;
              ">
                ${escapeHTML(item.name)}
              </strong>

              <div style="
                font-size:11px;
                color:#888;
                margin-bottom:9px;
              ">
                ${formatPrice(item.price)}
              </div>

              <div style="
                display:flex;
                align-items:center;
                gap:8px;
              ">

                <button
                  type="button"
                  onclick="changeCartQuantity(${index}, -1)"
                  style="
                    width:28px;
                    height:28px;
                    border:1px solid #ddd;
                    background:white;
                    border-radius:50%;
                    cursor:pointer;
                  "
                >
                  −
                </button>

                <span style="
                  min-width:20px;
                  text-align:center;
                  font-size:12px;
                  font-weight:700;
                ">
                  ${item.quantity}
                </span>

                <button
                  type="button"
                  onclick="changeCartQuantity(${index}, 1)"
                  style="
                    width:28px;
                    height:28px;
                    border:1px solid #ddd;
                    background:white;
                    border-radius:50%;
                    cursor:pointer;
                  "
                >
                  +
                </button>

              </div>

            </div>

            <div style="
              text-align:left;
            ">

              <strong style="
                display:block;
                font-size:12px;
                margin-bottom:10px;
              ">
                ${formatPrice(itemTotal)}
              </strong>

              <button
                type="button"
                onclick="removeCartItem(${index})"
                style="
                  border:0;
                  background:none;
                  color:#999;
                  cursor:pointer;
                  font-size:11px;
                "
              >
                حذف
              </button>

            </div>

          </div>
        `;

      }
    ).join("");
}

// ============================================================
// CHECKOUT SETUP
// ============================================================

function setupCheckout() {

  const checkoutButton =
    document.getElementById("checkoutButton") ||
    document.querySelector("[data-checkout]");

  if (!checkoutButton) {

    console.warn(
      "KOSHI.WEAR: checkout button not found."
    );

    return;
  }

  checkoutButton.removeEventListener(
    "click",
    openCheckout
  );

  checkoutButton.addEventListener(
    "click",
    function(event) {

      event.preventDefault();

      openCheckout();

    }
  );
}

// ============================================================
// CHECKOUT MODAL
// ============================================================

function openCheckout() {

  if (!cart.length) {

    alert("السلة فارغة.");

    return;
  }

  const existing =
    document.getElementById(
      "koshiCheckoutModal"
    );

  if (existing) {
    existing.remove();
  }

  const total =
    calculateCartTotal();

  const modal =
    document.createElement("div");

  modal.id =
    "koshiCheckoutModal";

  modal.style.cssText = `
    position:fixed;
    inset:0;
    background:rgba(0,0,0,.65);
    z-index:99999;
    display:flex;
    align-items:center;
    justify-content:center;
    padding:20px;
    overflow:auto;
  `;

  modal.innerHTML = `

    <div style="
      width:min(600px,100%);
      background:#fff;
      border-radius:20px;
      padding:25px;
      position:relative;
      max-height:90vh;
      overflow:auto;
      direction:rtl;
      box-sizing:border-box;
    ">

      <button
        type="button"
        id="closeKoshiCheckout"
        style="
          position:absolute;
          left:18px;
          top:15px;
          border:0;
          background:#f1f1f1;
          width:35px;
          height:35px;
          border-radius:50%;
          cursor:pointer;
          font-size:18px;
        "
      >
        ×
      </button>

      <h2 style="
        margin:0 0 8px;
        font-size:25px;
      ">
        إتمام الطلب
      </h2>

      <p style="
        color:#777;
        margin:0 0 22px;
        font-size:13px;
      ">
        أدخل معلومات التوصيل لإتمام طلبك.
      </p>

      <form
        id="koshiCheckoutForm"
        novalidate
      >

        <label style="
          display:block;
          margin-bottom:6px;
          font-weight:700;
        ">
          الاسم الكامل
        </label>

        <input
          name="full_name"
          required
          placeholder="الاسم الكامل"
          autocomplete="name"
          style="${checkoutInputStyle()}"
        >

        <label style="
          display:block;
          margin-bottom:6px;
          font-weight:700;
        ">
          رقم الهاتف
        </label>

        <input
          name="phone"
          required
          placeholder="05xxxxxxxx"
          inputmode="tel"
          autocomplete="tel"
          style="${checkoutInputStyle()}"
        >

        <label style="
          display:block;
          margin-bottom:6px;
          font-weight:700;
        ">
          المحافظة / المنطقة
        </label>

        <select
          name="region"
          required
          style="${checkoutInputStyle()}"
        >
          <option value="">اختر المنطقة</option>
          <option>الضفة الغربية</option>
          <option>قطاع غزة</option>
          <option>المدن والبلدات داخل إسرائيل</option>
        </select>

        <label style="
          display:block;
          margin-bottom:6px;
          font-weight:700;
        ">
          المدينة / البلدة
        </label>

        <input
          name="city"
          required
          placeholder="مثال: جنين"
          autocomplete="address-level2"
          style="${checkoutInputStyle()}"
        >

        <label style="
          display:block;
          margin-bottom:6px;
          font-weight:700;
        ">
          العنوان بالتفصيل
        </label>

        <textarea
          name="address"
          required
          placeholder="اسم الشارع، الحي، رقم المنزل..."
          rows="3"
          autocomplete="street-address"
          style="${checkoutInputStyle()}resize:vertical;"
        ></textarea>

        <label style="
          display:block;
          margin-bottom:6px;
          font-weight:700;
        ">
          أقرب معلم
          <span style="
            font-weight:400;
            color:#999;
          ">
            اختياري
          </span>
        </label>

        <input
          name="landmark"
          placeholder="مثال: بجانب..."
          style="${checkoutInputStyle()}"
        >

        <label style="
          display:block;
          margin-bottom:6px;
          font-weight:700;
        ">
          ملاحظات
          <span style="
            font-weight:400;
            color:#999;
          ">
            اختياري
          </span>
        </label>

        <textarea
          name="notes"
          placeholder="أي ملاحظات للطلب..."
          rows="2"
          style="${checkoutInputStyle()}resize:vertical;"
        ></textarea>

        <div style="
          background:#f7f7f7;
          padding:15px;
          border-radius:12px;
          margin:18px 0;
          display:flex;
          justify-content:space-between;
          font-weight:800;
        ">
          <span>
            الإجمالي
          </span>

          <span>
            ${formatPrice(total)}
          </span>
        </div>

        <button
          type="submit"
          id="submitKoshiOrder"
          style="
            width:100%;
            background:#000;
            color:#fff;
            border:0;
            border-radius:12px;
            padding:16px;
            font-size:15px;
            font-weight:800;
            cursor:pointer;
          "
        >
          تأكيد الطلب
        </button>

        <div
          id="checkoutError"
          style="
            display:none;
            color:#b00020;
            background:#fff1f1;
            padding:12px;
            border-radius:10px;
            margin-top:12px;
            font-size:13px;
            line-height:1.7;
          "
        ></div>

      </form>

    </div>
  `;

  document.body.appendChild(modal);

  // ==========================================================
  // IMPORTANT:
  // Bind the form AFTER the modal has been inserted.
  // ==========================================================

  const form =
    modal.querySelector(
      "#koshiCheckoutForm"
    );

  const closeButton =
    modal.querySelector(
      "#closeKoshiCheckout"
    );

  if (closeButton) {

    closeButton.addEventListener(
      "click",
      closeCheckout
    );
  }

  if (!form) {

    console.error(
      "KOSHI.WEAR: checkout form was not created."
    );

    alert(
      "تعذر فتح نموذج الطلب. أعد تحميل الصفحة."
    );

    return;
  }

  form.addEventListener(
    "submit",
    submitRealOrder
  );

  // Allow pressing Enter to submit normally.
  form.querySelectorAll("input, select, textarea")
    .forEach(field => {

      field.addEventListener(
        "keydown",
        function(event) {

          if (
            event.key === "Enter" &&
            field.tagName !== "TEXTAREA"
          ) {

            event.preventDefault();

            form.requestSubmit();

          }

        }
      );

    });

  // Focus first field.
  const firstInput =
    form.querySelector(
      'input[name="full_name"]'
    );

  if (firstInput) {
    setTimeout(() => firstInput.focus(), 50);
  }
}

// ============================================================
// SUBMIT REAL ORDER
// ============================================================

async function submitRealOrder(event) {

  event.preventDefault();

  event.stopPropagation();

  const form =
    event.currentTarget;

  if (!form) return;

  const button =
    form.querySelector(
      "#submitKoshiOrder"
    );

  const errorBox =
    form.querySelector(
      "#checkoutError"
    );

  if (!cart.length) {

    showCheckoutError(
      "السلة فارغة.",
      errorBox
    );

    return;
  }

  const formData =
    new FormData(form);

  const fullName =
    String(
      formData.get("full_name") || ""
    ).trim();

  const phone =
    String(
      formData.get("phone") || ""
    ).trim();

  const region =
    String(
      formData.get("region") || ""
    ).trim();

  const city =
    String(
      formData.get("city") || ""
    ).trim();

  const address =
    String(
      formData.get("address") || ""
    ).trim();

  const landmark =
    String(
      formData.get("landmark") || ""
    ).trim();

  const notes =
    String(
      formData.get("notes") || ""
    ).trim();

  // ==========================================================
  // VALIDATION
  // ==========================================================

  if (!fullName) {

    showCheckoutError(
      "اكتب الاسم الكامل.",
      errorBox
    );

    return;
  }

  if (!validatePalestinePhone(phone)) {

    showCheckoutError(
      "رقم الهاتف غير صحيح. استخدم 05xxxxxxxx أو +9705xxxxxxxx أو +9725xxxxxxxx.",
      errorBox
    );

    return;
  }

  if (!region) {

    showCheckoutError(
      "اختر المنطقة.",
      errorBox
    );

    return;
  }

  if (!city) {

    showCheckoutError(
      "اكتب المدينة أو البلدة.",
      errorBox
    );

    return;
  }

  if (!address) {

    showCheckoutError(
      "اكتب العنوان بالتفصيل.",
      errorBox
    );

    return;
  }

  // ==========================================================
  // DISABLE BUTTON
  // ==========================================================

  if (button) {

    button.disabled = true;

    button.style.opacity = "0.6";

    button.style.cursor = "wait";

    button.textContent =
      "جاري تأكيد الطلب...";
  }

  if (errorBox) {

    errorBox.style.display =
      "none";

    errorBox.textContent =
      "";
  }

  try {

    // ========================================================
    // BUILD ORDER ITEMS
    // ========================================================

    const items =
      cart.map(item => ({

        product_id:
          item.product_id,

        quantity:
          Number(item.quantity || 1),

        selected_color:
          item.selected_color || null,

        selected_size:
          item.selected_size || null

      }));

    if (!items.length) {

      throw new Error(
        "السلة فارغة."
      );
    }

    // ========================================================
    // TRAFFIC SOURCE
    // ========================================================

    const trafficSource =
      getTrafficSource();

    console.log(
      "KOSHI.WEAR: creating real order...",
      {
        items,
        trafficSource
      }
    );

    // ========================================================
    // REAL SUPABASE RPC
    // ========================================================

    const {
      data,
      error
    } =
      await supabaseClient.rpc(
        "create_store_order",
        {
          p_full_name:
            fullName,

          p_phone:
            phone,

          p_region:
            region,

          p_city:
            city,

          p_address:
            address,

          p_landmark:
            landmark || null,

          p_notes:
            notes || null,

          p_traffic_source:
            trafficSource,

          p_items:
            items
        }
      );

    console.log(
      "KOSHI.WEAR RPC response:",
      {
        data,
        error
      }
    );

    if (error) {

      console.error(
        "KOSHI.WEAR checkout error:",
        error
      );

      throw error;
    }

    // ========================================================
    // CHECK RESPONSE
    // ========================================================

    if (!data) {

      throw new Error(
        "لم تصل استجابة من قاعدة البيانات."
      );
    }

    if (data.success !== true) {

      throw new Error(
        data.message ||
        data.error ||
        "تعذر إنشاء الطلب."
      );
    }

    if (!data.order_number) {

      throw new Error(
        "تم إنشاء الطلب لكن لم يتم استلام رقم الطلب."
      );
    }

    // ========================================================
    // SUCCESS
    // ========================================================

    cart = [];

    saveCart();

    updateCartUI();

    // Close the shopping drawer if open.
    closeCart();

    showOrderSuccess(data);

  } catch (error) {

    console.error(
      "KOSHI.WEAR REAL ORDER ERROR:",
      error
    );

    let message =
      error?.message ||
      "حدث خطأ أثناء إنشاء الطلب.";

    const lowerMessage =
      String(message).toLowerCase();

    if (
      lowerMessage.includes(
        "failed to fetch"
      )
    ) {

      message =
        "تعذر الاتصال بقاعدة البيانات. تأكد من اتصال الإنترنت وإعدادات Supabase.";

    } else if (
      lowerMessage.includes(
        "permission denied"
      )
    ) {

      message =
        "قاعدة البيانات رفضت إنشاء الطلب بسبب الصلاحيات. يجب مراجعة صلاحيات دالة الطلب في Supabase.";

    } else if (
      lowerMessage.includes(
        "function"
      ) &&
      lowerMessage.includes(
        "does not exist"
      )
    ) {

      message =
        "دالة إنشاء الطلب غير موجودة في Supabase.";

    } else if (
      lowerMessage.includes(
        "الكمية غير متوفرة"
      )
    ) {

      message =
        message;

    } else if (
      lowerMessage.includes(
        "المنتج غير موجود"
      )
    ) {

      message =
        "أحد المنتجات لم يعد متاحًا. حدّث الصفحة وحاول مرة أخرى.";
    }

    showCheckoutError(
      message,
      errorBox
    );

    if (button) {

      button.disabled = false;

      button.style.opacity =
        "1";

      button.style.cursor =
        "pointer";

      button.textContent =
        "تأكيد الطلب";
    }
  }
}

// ============================================================
// SUCCESS
// ============================================================

function showOrderSuccess(data) {

  const modal =
    document.getElementById(
      "koshiCheckoutModal"
    );

  if (!modal) return;

  const orderNumber =
    data?.order_number ||
    "—";

  const total =
    Number(data?.total || 0);

  modal.innerHTML = `

    <div style="
      width:min(500px,100%);
      background:#fff;
      border-radius:22px;
      padding:35px 25px;
      text-align:center;
      direction:rtl;
      box-sizing:border-box;
    ">

      <div style="
        width:70px;
        height:70px;
        margin:0 auto 18px;
        border-radius:50%;
        background:#111;
        color:#fff;
        display:flex;
        align-items:center;
        justify-content:center;
        font-size:32px;
      ">
        ✓
      </div>

      <h2 style="
        margin:0 0 10px;
        font-size:25px;
      ">
        تم استلام طلبك بنجاح
      </h2>

      <p style="
        color:#777;
        margin:0 0 20px;
        line-height:1.7;
      ">
        شكرًا لطلبك من KOSHI.WEAR
      </p>

      <div style="
        background:#f6f6f6;
        border-radius:14px;
        padding:16px;
        margin-bottom:15px;
      ">

        <div style="
          font-size:12px;
          color:#888;
          margin-bottom:5px;
        ">
          رقم الطلب
        </div>

        <strong style="
          font-size:19px;
          letter-spacing:.5px;
        ">
          ${escapeHTML(orderNumber)}
        </strong>

      </div>

      <div style="
        font-size:16px;
        font-weight:800;
        margin-bottom:25px;
      ">
        الإجمالي:
        ${formatPrice(total)}
      </div>

      <button
        type="button"
        id="successCloseButton"
        style="
          width:100%;
          background:#000;
          color:#fff;
          border:0;
          border-radius:12px;
          padding:15px;
          font-weight:800;
          cursor:pointer;
        "
      >
        إغلاق
      </button>

    </div>
  `;

  const closeButton =
    modal.querySelector(
      "#successCloseButton"
    );

  if (closeButton) {

    closeButton.addEventListener(
      "click",
      closeCheckout
    );
  }
}

// ============================================================
// CHECKOUT HELPERS
// ============================================================

function closeCheckout() {

  const modal =
    document.getElementById(
      "koshiCheckoutModal"
    );

  if (modal) {

    modal.remove();
  }
}

function showCheckoutError(
  message,
  target
) {

  const errorBox =
    target ||
    document.getElementById(
      "checkoutError"
    );

  if (!errorBox) {

    alert(message);

    return;
  }

  errorBox.textContent =
    String(message);

  errorBox.style.display =
    "block";

  errorBox.scrollIntoView({
    behavior: "smooth",
    block: "nearest"
  });
}

function checkoutInputStyle() {

  return `
    width:100%;
    box-sizing:border-box;
    border:1px solid #ddd;
    border-radius:10px;
    padding:13px;
    margin-bottom:15px;
    font-size:14px;
    background:#fff;
    outline:none;
  `;
}

function calculateCartTotal() {

  return cart.reduce(
    (sum, item) =>
      sum +
      Number(item.price || 0) *
      Number(item.quantity || 0),
    0
  );
}

function validatePalestinePhone(phone) {

  const cleaned =
    String(phone || "")
      .replace(
        /[\s()-]/g,
        ""
      );

  return (
    /^05\d{8}$/.test(cleaned) ||
    /^\+9705\d{8}$/.test(cleaned) ||
    /^\+9725\d{8}$/.test(cleaned)
  );
}

// ============================================================
// TRAFFIC SOURCE
// ============================================================

function getTrafficSource() {

  try {

    const params =
      new URLSearchParams(
        window.location.search
      );

    const utmSource =
      params.get("utm_source");

    if (utmSource) {

      localStorage.setItem(
        "koshi_traffic_source",
        utmSource
      );

      return utmSource;
    }

    return (
      localStorage.getItem(
        "koshi_traffic_source"
      ) ||
      "direct"
    );

  } catch {

    return "direct";
  }
}

// ============================================================
// VISITOR TRACKING
// ============================================================

async function startVisitorTracking() {

  if (visitorTrackingStarted) return;

  visitorTrackingStarted = true;

  try {

    let sessionId =
      localStorage.getItem(
        "koshi_visitor_session"
      );

    if (!sessionId) {

      if (
        window.crypto &&
        typeof window.crypto.randomUUID === "function"
      ) {

        sessionId =
          window.crypto.randomUUID();

      } else {

        sessionId =
          "visitor-" +
          Date.now() +
          "-" +
          Math.random()
            .toString(36)
            .slice(2);

      }

      localStorage.setItem(
        "koshi_visitor_session",
        sessionId
      );
    }

    const trafficSource =
      getTrafficSource();

    const currentPage =
      window.location.pathname || "/";

    const {
      error
    } =
      await supabaseClient
        .from("visitor_sessions")
        .upsert(
          {
            session_id:
              sessionId,

            traffic_source:
              trafficSource,

            current_page:
              currentPage,

            last_seen_at:
              new Date().toISOString()
          },
          {
            onConflict:
              "session_id"
          }
        );

    if (error) {

      console.error(
        "Visitor tracking error:",
        error
      );

      return;
    }

    setInterval(
      async () => {

        try {

          await supabaseClient
            .from("visitor_sessions")
            .update({
              current_page:
                window.location.pathname ||
                "/",

              last_seen_at:
                new Date().toISOString()
            })
            .eq(
              "session_id",
              sessionId
            );

        } catch (error) {

          console.error(
            "Visitor heartbeat error:",
            error
          );
        }

      },
      30000
    );

  } catch (error) {

    console.error(
      "Visitor initialization error:",
      error
    );
  }
}

// ============================================================
// SEARCH
// ============================================================

function setupSearch() {

  if (!productSearch) return;

  productSearch.addEventListener(
    "input",
    function() {

      const value =
        this.value
          .trim()
          .toLowerCase();

      const filtered =
        products.filter(
          product => {

            const name =
              String(
                product.name || ""
              ).toLowerCase();

            const description =
              String(
                product.description || ""
              ).toLowerCase();

            const sku =
              String(
                product.sku || ""
              ).toLowerCase();

            return (
              name.includes(value) ||
              description.includes(value) ||
              sku.includes(value)
            );
          }
        );

      renderProducts(filtered);
    }
  );
}

// ============================================================
// FILTERS
// ============================================================

function setupFilters() {

  document
    .querySelectorAll(".filter")
    .forEach(button => {

      button.addEventListener(
        "click",
        function() {

          document
            .querySelectorAll(".filter")
            .forEach(btn =>
              btn.classList.remove("active")
            );

          this.classList.add("active");

          const category =
            this.dataset.category;

          if (
            !category ||
            category === "all"
          ) {

            renderProducts(products);

            return;
          }

          if (category === "sale") {

            const saleProducts =
              products.filter(
                product => {

                  const price =
                    Number(
                      product.price || 0
                    );

                  const sale =
                    Number(
                      product.sale_price || 0
                    );

                  return (
                    sale > 0 &&
                    sale < price
                  );
                }
              );

            renderProducts(saleProducts);

            return;
          }

          if (category === "new") {

            renderProducts(
              products.slice(0, 8)
            );

            return;
          }

          renderProducts(products);
        }
      );

    });
}

// ============================================================
// CART STORAGE
// ============================================================

function saveCart() {

  try {

    localStorage.setItem(
      "koshi_cart",
      JSON.stringify(cart)
    );

  } catch (error) {

    console.error(
      "Cart save error:",
      error
    );
  }
}

function loadCart() {

  try {

    const saved =
      localStorage.getItem(
        "koshi_cart"
      );

    if (!saved) {

      cart = [];

      return;
    }

    const parsed =
      JSON.parse(saved);

    if (Array.isArray(parsed)) {

      cart = parsed;

    } else {

      cart = [];
    }

  } catch (error) {

    console.error(
      "Cart loading error:",
      error
    );

    cart = [];
  }
}

// ============================================================
// OPEN / CLOSE CART
// ============================================================

function openCart() {

  const drawer =
    document.getElementById(
      "cartDrawer"
    );

  const overlay =
    document.getElementById(
      "overlay"
    );

  if (drawer) {

    drawer.classList.add("active");
  }

  if (overlay) {

    overlay.classList.add("active");
  }
}

function closeCart() {

  const drawer =
    document.getElementById(
      "cartDrawer"
    );

  const overlay =
    document.getElementById(
      "overlay"
    );

  if (drawer) {

    drawer.classList.remove("active");
  }

  if (overlay) {

    overlay.classList.remove("active");
  }
}

// ============================================================
// NORMALIZE COLORS / SIZES
// ============================================================

function normalizeArray(value) {

  if (Array.isArray(value)) {

    return value;
  }

  if (
    typeof value === "string"
  ) {

    try {

      const parsed =
        JSON.parse(value);

      if (Array.isArray(parsed)) {

        return parsed;
      }

    } catch (error) {

      return value
        .split(",")
        .map(
          item => item.trim()
        )
        .filter(Boolean);
    }
  }

  return [];
}

// ============================================================
// PRICE
// ============================================================

function formatPrice(price) {

  const number =
    Number(price || 0);

  return (
    number.toLocaleString(
      "en-US",
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }
    ) +
    " ₪"
  );
}

// ============================================================
// HTML SAFETY
// ============================================================

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

function escapeJS(value) {

  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r");
}

// ============================================================
// EXPOSE FUNCTIONS
// ============================================================

window.loadProducts =
  loadProducts;

window.addProductToCart =
  addProductToCart;

window.removeCartItem =
  removeCartItem;

window.changeCartQuantity =
  changeCartQuantity;

window.openCart =
  openCart;

window.closeCart =
  closeCart;

window.openCheckout =
  openCheckout;

window.closeCheckout =
  closeCheckout;

window.updateCartUI =
  updateCartUI;
