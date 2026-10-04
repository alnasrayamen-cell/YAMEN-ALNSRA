"use strict";

/* =========================================================
   SUPABASE
========================================================= */

const SUPABASE_URL =
    "https://eflcolwdhddfncbuvjua.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_J8K4FI12ExE5stcHVHviRQ_Uk__w4ko";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


/* =========================================================
   STATE
========================================================= */

let products = [];
let orders = [];
let editingProductId = null;


/* =========================================================
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        if (
            document.getElementById(
                "loginForm"
            )
        ) {
            setupLogin();
            return;
        }

        if (
            document.getElementById(
                "productForm"
            )
        ) {

            const session =
                await checkAdminSession();

            if (!session) {
                window.location.href =
                    "admin-login.html";
                return;
            }

            initializeAdmin();

        }

    }
);


/* =========================================================
   LOGIN
========================================================= */

function setupLogin() {

    const form =
        document.getElementById(
            "loginForm"
        );

    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            const email =
                document.getElementById(
                    "loginEmail"
                ).value.trim();

            const password =
                document.getElementById(
                    "loginPassword"
                ).value;

            const button =
                document.getElementById(
                    "loginButton"
                );

            const message =
                document.getElementById(
                    "loginMessage"
                );

            button.disabled = true;
            button.textContent =
                "جاري تسجيل الدخول...";

            message.textContent = "";

            const {
                error
            } =
                await supabaseClient.auth
                    .signInWithPassword({
                        email,
                        password
                    });

            if (error) {

                message.textContent =
                    "بيانات الدخول غير صحيحة.";

                button.disabled = false;

                button.textContent =
                    "دخول لوحة الإدارة";

                return;
            }

            window.location.href =
                "admin.html";

        }
    );

}


/* =========================================================
   SESSION
========================================================= */

async function checkAdminSession() {

    const {
        data
    } =
        await supabaseClient.auth
            .getSession();

    return data.session;

}


/* =========================================================
   INITIALIZE ADMIN
========================================================= */

async function initializeAdmin() {

    setupNavigation();

    setupButtons();

    setupProductForm();

    setupSettings();

    setupLogout();

    await loadEverything();

}


/* =========================================================
   NAVIGATION
========================================================= */

function setupNavigation() {

    document
        .querySelectorAll(
            ".nav-item"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    openSection(
                        button.dataset.section
                    );

                }
            );

        });

}


function openSection(section) {

    document
        .querySelectorAll(
            ".nav-item"
        )
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.section ===
                section
            );

        });


    document
        .querySelectorAll(
            ".admin-section"
        )
        .forEach(element => {

            element.classList.toggle(
                "active",
                element.id ===
                `section-${section}`
            );

        });


    const titles = {

        dashboard:
            [
                "لوحة التحكم",
                "إدارة متجر Little Stars"
            ],

        orders:
            [
                "الطلبات",
                "جميع طلبات الزبائن"
            ],

        products:
            [
                "المنتجات",
                "إدارة المنتجات والمخزون"
            ],

        "add-product":
            [
                "إضافة منتج",
                "إضافة أو تعديل منتج"
            ],

        settings:
            [
                "إعدادات المتجر",
                "معلومات المتجر"
            ]

    };


    if (titles[section]) {

        document.getElementById(
            "pageTitle"
        ).textContent =
            titles[section][0];

        document.getElementById(
            "pageDescription"
        ).textContent =
            titles[section][1];

    }

}


/* =========================================================
   BUTTONS
========================================================= */

function setupButtons() {

    document
        .querySelectorAll(
            "[data-go-section]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    openSection(
                        button.dataset.goSection
                    );

                }
            );

        });


    document
        .getElementById(
            "refreshOrders"
        )
        ?.addEventListener(
            "click",
            loadOrders
        );


    document
        .getElementById(
            "closeOrderModal"
        )
        ?.addEventListener(
            "click",
            closeOrderModal
        );

}


/* =========================================================
   LOAD EVERYTHING
========================================================= */

async function loadEverything() {

    await Promise.all([
        loadProducts(),
        loadOrders(),
        loadSettings()
    ]);

    updateDashboard();

}


/* =========================================================
   PRODUCTS
========================================================= */

async function loadProducts() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("products")
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );

    if (error) {

        toast(
            "تعذر تحميل المنتجات"
        );

        console.error(error);

        return;
    }

    products =
        data || [];

    renderProducts();

}


function renderProducts() {

    const table =
        document.getElementById(
            "productsTable"
        );

    if (!table) return;

    if (!products.length) {

        table.innerHTML = `
            <tr>
                <td colspan="7">
                    لا توجد منتجات
                </td>
            </tr>
        `;

        return;
    }


    table.innerHTML =
        products.map(
            product => {

                const image =
                    product.image_url ||
                    "https://via.placeholder.com/100";

                const price =
                    product.sale_price ??
                    product.price ??
                    0;

                return `

                    <tr>

                        <td>
                            <img
                                class="product-thumb"
                                src="${escapeHTML(image)}"
                                alt=""
                            >
                        </td>

                        <td>
                            <strong>
                                ${escapeHTML(
                                    product.name
                                )}
                            </strong>
                        </td>

                        <td>
                            ${escapeHTML(
                                product.sku || "-"
                            )}
                        </td>

                        <td>
                            ₪${price}
                        </td>

                        <td>
                            ${product.stock ?? 0}
                        </td>

                        <td>

                            <span class="status ${
                                product.is_active
                                    ? "active"
                                    : "inactive"
                            }">

                                ${
                                    product.is_active
                                        ? "ظاهر"
                                        : "مخفي"
                                }

                            </span>

                        </td>

                        <td>

                            <button
                                class="action-button edit-button"
                                onclick="editProduct('${product.id}')"
                            >
                                تعديل
                            </button>

                            <button
                                class="action-button delete-button"
                                onclick="deleteProduct('${product.id}')"
                            >
                                حذف
                            </button>

                        </td>

                    </tr>

                `;

            }
        ).join("");

}


/* =========================================================
   PRODUCT FORM
========================================================= */

function setupProductForm() {

    const form =
        document.getElementById(
            "productForm"
        );

    form.addEventListener(
        "submit",
        saveProduct
    );


    document
        .getElementById(
            "cancelProductEdit"
        )
        .addEventListener(
            "click",
            resetProductForm
        );

}


async function saveProduct(event) {

    event.preventDefault();

    const product = {

        name:
            document.getElementById(
                "productName"
            ).value.trim(),

        description:
            document.getElementById(
                "productDescription"
            ).value.trim(),

        price:
            Number(
                document.getElementById(
                    "productPrice"
                ).value
            ),

        sale_price:
            nullableNumber(
                document.getElementById(
                    "productSalePrice"
                ).value
            ),

        image_url:
            document.getElementById(
                "productImage"
            ).value.trim() || null,

        sku:
            document.getElementById(
                "productSKU"
            ).value.trim() || null,

        barcode:
            document.getElementById(
                "productBarcode"
            ).value.trim() || null,

        stock:
            Number(
                document.getElementById(
                    "productStock"
                ).value
            ),

        colors:
            stringToArray(
                document.getElementById(
                    "productColors"
                ).value
            ),

        sizes:
            stringToArray(
                document.getElementById(
                    "productSizes"
                ).value
            ),

        is_active:
            document.getElementById(
                "productActive"
            ).checked

    };


    const rating =
        Number(
            document.getElementById(
                "productRating"
            ).value
        );

    const reviews =
        Number(
            document.getElementById(
                "productReviews"
            ).value
        );


    /*
       إذا كانت أعمدة rating/reviews
       موجودة عندك، سيتم إرسالها.
       إذا لم تكن موجودة، نعيد المحاولة
       بدونها.
    */

    product.rating =
        rating;

    product.reviews =
        reviews;


    let result;


    if (editingProductId) {

        result =
            await supabaseClient
                .from("products")
                .update(product)
                .eq(
                    "id",
                    editingProductId
                );

    } else {

        result =
            await supabaseClient
                .from("products")
                .insert(product);

    }


    if (
        result.error &&
        (
            result.error.message
                .toLowerCase()
                .includes("rating")
            ||
            result.error.message
                .toLowerCase()
                .includes("reviews")
        )
    ) {

        delete product.rating;
        delete product.reviews;


        if (editingProductId) {

            result =
                await supabaseClient
                    .from("products")
                    .update(product)
                    .eq(
                        "id",
                        editingProductId
                    );

        } else {

            result =
                await supabaseClient
                    .from("products")
                    .insert(product);

        }

    }


    if (result.error) {

        console.error(
            result.error
        );

        toast(
            "حدث خطأ أثناء حفظ المنتج"
        );

        return;
    }


    toast(
        editingProductId
            ? "تم تعديل المنتج بنجاح"
            : "تمت إضافة المنتج بنجاح"
    );


    resetProductForm();

    await loadProducts();

    updateDashboard();

    openSection("products");

}


function editProduct(id) {

    const product =
        products.find(
            item =>
                String(item.id) ===
                String(id)
        );

    if (!product) return;


    editingProductId =
        product.id;


    document.getElementById(
        "productId"
    ).value =
        product.id;


    document.getElementById(
        "productName"
    ).value =
        product.name || "";


    document.getElementById(
        "productDescription"
    ).value =
        product.description || "";


    document.getElementById(
        "productPrice"
    ).value =
        product.price ?? "";


    document.getElementById(
        "productSalePrice"
    ).value =
        product.sale_price ?? "";


    document.getElementById(
        "productImage"
    ).value =
        product.image_url || "";


    document.getElementById(
        "productSKU"
    ).value =
        product.sku || "";


    document.getElementById(
        "productBarcode"
    ).value =
        product.barcode || "";


    document.getElementById(
        "productStock"
    ).value =
        product.stock ?? 0;


    document.getElementById(
        "productColors"
    ).value =
        arrayToString(
            product.colors
        );


    document.getElementById(
        "productSizes"
    ).value =
        arrayToString(
            product.sizes
        );


    document.getElementById(
        "productActive"
    ).checked =
        product.is_active !== false;


    document.getElementById(
        "productRating"
    ).value =
        product.rating ?? 5;


    document.getElementById(
        "productReviews"
    ).value =
        product.reviews ?? 0;


    document.getElementById(
        "productFormTitle"
    ).textContent =
        "تعديل المنتج";


    document.getElementById(
        "saveProductButton"
    ).textContent =
        "💾 حفظ التعديلات";


    openSection(
        "add-product"
    );

}


async function deleteProduct(id) {

    const product =
        products.find(
            item =>
                String(item.id) ===
                String(id)
        );

    if (!product) return;


    const confirmed =
        confirm(
            `هل أنت متأكد من حذف "${product.name}"؟`
        );

    if (!confirmed) return;


    const {
        error
    } =
        await supabaseClient
            .from("products")
            .delete()
            .eq(
                "id",
                id
            );


    if (error) {

        console.error(error);

        toast(
            "تعذر حذف المنتج"
        );

        return;
    }


    toast(
        "تم حذف المنتج"
    );


    await loadProducts();

    updateDashboard();

}


function resetProductForm() {

    editingProductId =
        null;


    document
        .getElementById(
            "productForm"
        )
        .reset();


    document.getElementById(
        "productActive"
    ).checked =
        true;


    document.getElementById(
        "productRating"
    ).value =
        5;


    document.getElementById(
        "productReviews"
    ).value =
        0;


    document.getElementById(
        "productFormTitle"
    ).textContent =
        "إضافة منتج جديد";


    document.getElementById(
        "saveProductButton"
    ).textContent =
        "💾 حفظ المنتج";

}


/* =========================================================
   ORDERS
========================================================= */

async function loadOrders() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("orders")
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(error);

        toast(
            "تعذر تحميل الطلبات"
        );

        return;
    }


    orders =
        data || [];


    renderOrders();

    renderRecentOrders();

    updateDashboard();

}


function renderOrders() {

    const table =
        document.getElementById(
            "ordersTable"
        );

    if (!table) return;


    if (!orders.length) {

        table.innerHTML = `
            <tr>
                <td colspan="7">
                    لا توجد طلبات حتى الآن
                </td>
            </tr>
        `;

        return;
    }


    table.innerHTML =
        orders.map(
            order => {

                const status =
                    order.status ||
                    "pending";


                return `

                    <tr>

                        <td>
                            <strong>
                                ${escapeHTML(
                                    order.order_number ||
                                    order.id?.slice(0,8) ||
                                    "-"
                                )}
                            </strong>
                        </td>

                        <td>
                            ${escapeHTML(
                                order.customer_name ||
                                order.customer_id ||
                                "غير محدد"
                            )}
                        </td>

                        <td>
                            ₪${order.total ?? 0}
                        </td>

                        <td>

                            <span class="status ${
                                statusClass(
                                    status
                                )
                            }">

                                ${escapeHTML(
                                    translateStatus(
                                        status
                                    )
                                )}

                            </span>

                        </td>

                        <td>
                            ${escapeHTML(
                                order.traffic_source ||
                                "-"
                            )}
                        </td>

                        <td>
                            ${formatDate(
                                order.created_at
                            )}
                        </td>

                        <td>

                            <button
                                class="action-button view-button"
                                onclick="showOrder('${order.id}')"
                            >
                                👁️ التفاصيل
                            </button>

                        </td>

                    </tr>

                `;

            }
        ).join("");

}


/* =========================================================
   ORDER DETAILS
========================================================= */

async function showOrder(orderId) {

    const order =
        orders.find(
            item =>
                String(item.id) ===
                String(orderId)
        );

    if (!order) return;


    const modal =
        document.getElementById(
            "orderModal"
        );

    const details =
        document.getElementById(
            "orderDetails"
        );


    details.innerHTML = `

        <div class="order-summary">

            <p>
                <strong>رقم الطلب:</strong>
                ${escapeHTML(
                    order.order_number ||
                    order.id
                )}
            </p>

            <p>
                <strong>الزبون:</strong>
                ${escapeHTML(
                    order.customer_name ||
                    order.customer_id ||
                    "غير محدد"
                )}
            </p>

            <p>
                <strong>المجموع:</strong>
                ₪${order.total ?? 0}
            </p>

            <p>
                <strong>الحالة:</strong>
                ${escapeHTML(
                    translateStatus(
                        order.status ||
                        "pending"
                    )
                )}
            </p>

            <p>
                <strong>الملاحظات:</strong>
                ${escapeHTML(
                    order.notes || "لا يوجد"
                )}
            </p>

        </div>

        <hr>

        <h3>
            المنتجات المطلوبة
        </h3>

        <div id="orderItemsContainer">
            جاري تحميل المنتجات...
        </div>

    `;


    modal.classList.add(
        "open"
    );


    const {
        data,
        error
    } =
        await supabaseClient
            .from("order_items")
            .select("*")
            .eq(
                "order_id",
                orderId
            );


    const container =
        document.getElementById(
            "orderItemsContainer"
        );


    if (error) {

        container.innerHTML =
            `
                <p>
                    تعذر تحميل تفاصيل المنتجات.
                </p>
            `;

        console.error(error);

        return;
    }


    if (!data?.length) {

        container.innerHTML =
            `
                <p>
                    لا توجد تفاصيل مسجلة لهذا الطلب.
                </p>
            `;

        return;
    }


    container.innerHTML =
        data.map(
            item => {

                const product =
                    products.find(
                        product =>
                            String(
                                product.id
                            ) ===
                            String(
                                item.product_id
                            )
                    );


                const name =
                    item.product_name ||
                    product?.name ||
                    item.name ||
                    "منتج";


                const quantity =
                    item.quantity ??
                    1;


                const price =
                    item.price ??
                    item.unit_price ??
                    product?.price ??
                    0;


                const size =
                    item.size ||
                    item.selected_size ||
                    "";


                return `

                    <div class="order-detail-item">

                        <div>

                            <strong>
                                ${escapeHTML(name)}
                            </strong>

                            <br>

                            <small>
                                الكمية: ${quantity}
                                ${
                                    size
                                        ? ` | المقاس: ${escapeHTML(size)}`
                                        : ""
                                }
                            </small>

                        </div>

                        <strong>
                            ₪${Number(price) * Number(quantity)}
                        </strong>

                    </div>

                `;

            }
        ).join("");

}


function closeOrderModal() {

    document
        .getElementById(
            "orderModal"
        )
        .classList.remove(
            "open"
        );

}


/* =========================================================
   SETTINGS
========================================================= */

async function loadSettings() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("store_settings")
            .select("*")
            .limit(1)
            .maybeSingle();


    if (error) {

        console.error(
            "Settings:",
            error
        );

        return;
    }


    if (!data) return;


    document.getElementById(
        "storeName"
    ).value =
        data.store_name || "";


    document.getElementById(
        "storeLogo"
    ).value =
        data.logo_url || "";


    document.getElementById(
        "adminProfileImage"
    ).value =
        data.admin_profile_image_url ||
        "";

}


function setupSettings() {

    document
        .getElementById(
            "settingsForm"
        )
        .addEventListener(
            "submit",
            saveSettings
        );

}


async function saveSettings(event) {

    event.preventDefault();


    const values = {

        store_name:
            document.getElementById(
                "storeName"
            ).value.trim(),

        logo_url:
            document.getElementById(
                "storeLogo"
            ).value.trim() ||
            null,

        admin_profile_image_url:
            document.getElementById(
                "adminProfileImage"
            ).value.trim() ||
            null

    };


    const {
        data: existing
    } =
        await supabaseClient
            .from("store_settings")
            .select("id")
            .limit(1)
            .maybeSingle();


    let result;


    if (existing?.id) {

        result =
            await supabaseClient
                .from("store_settings")
                .update(values)
                .eq(
                    "id",
                    existing.id
                );

    } else {

        result =
            await supabaseClient
                .from("store_settings")
                .insert(values);

    }


    if (result.error) {

        console.error(
            result.error
        );

        toast(
            "تعذر حفظ الإعدادات"
        );

        return;
    }


    toast(
        "تم حفظ إعدادات المتجر"
    );

}


/* =========================================================
   DASHBOARD
========================================================= */

function updateDashboard() {

    const productsCount =
        products.length;


    const ordersCount =
        orders.length;


    const sales =
        orders.reduce(
            (
                total,
                order
            ) =>
                total +
                Number(
                    order.total || 0
                ),
            0
        );


    const pending =
        orders.filter(
            order =>
                ![
                    "completed",
                    "cancelled",
                    "delivered"
                ].includes(
                    String(
                        order.status ||
                        ""
                    ).toLowerCase()
                )
        ).length;


    document.getElementById(
        "statProducts"
    ).textContent =
        productsCount;


    document.getElementById(
        "statOrders"
    ).textContent =
        ordersCount;


    document.getElementById(
        "statSales"
    ).textContent =
        `₪${sales}`;


    document.getElementById(
        "statPending"
    ).textContent =
        pending;


    renderStockWarnings();

}


function renderRecentOrders() {

    const container =
        document.getElementById(
            "recentOrders"
        );

    if (!container) return;


    const recent =
        orders.slice(
            0,
            5
        );


    if (!recent.length) {

        container.innerHTML =
            "<p>لا توجد طلبات.</p>";

        return;
    }


    container.innerHTML =
        recent.map(
            order => `

                <div class="order-row">

                    <div class="order-main">

                        <strong>
                            ${escapeHTML(
                                order.order_number ||
                                order.id?.slice(0,8) ||
                                "-"
                            )}
                        </strong>

                        <strong>
                            ₪${order.total ?? 0}
                        </strong>

                    </div>

                    <small>
                        ${formatDate(
                            order.created_at
                        )}
                    </small>

                </div>

            `
        ).join("");

}


function renderStockWarnings() {

    const container =
        document.getElementById(
            "stockWarnings"
        );

    if (!container) return;


    const warnings =
        products
            .filter(
                product =>
                    Number(
                        product.stock || 0
                    ) <= 5
            )
            .slice(
                0,
                8
            );


    if (!warnings.length) {

        container.innerHTML =
            `
                <p>
                    ✅ المخزون جيد.
                </p>
            `;

        return;
    }


    container.innerHTML =
        warnings.map(
            product => `

                <div class="stock-warning">

                    <strong>
                        ${escapeHTML(
                            product.name
                        )}
                    </strong>

                    <br>

                    <small>
                        المتبقي:
                        ${product.stock ?? 0}
                    </small>

                </div>

            `
        ).join("");

}


/* =========================================================
   LOGOUT
========================================================= */

function setupLogout() {

    document
        .getElementById(
            "logoutButton"
        )
        .addEventListener(
            "click",
            async () => {

                await supabaseClient.auth
                    .signOut();

                window.location.href =
                    "admin-login.html";

            }
        );

}


/* =========================================================
   HELPERS
========================================================= */

function stringToArray(value) {

    return String(
        value || ""
    )
        .split(",")
        .map(
            item =>
                item.trim()
        )
        .filter(Boolean);

}


function arrayToString(value) {

    if (Array.isArray(value)) {

        return value.join(
            ", "
        );

    }

    if (
        typeof value ===
        "object" &&
        value !== null
    ) {

        return Object.values(
            value
        ).join(", ");

    }

    if (
        typeof value ===
        "string"
    ) {

        try {

            const parsed =
                JSON.parse(value);

            if (
                Array.isArray(
                    parsed
                )
            ) {

                return parsed.join(
                    ", "
                );

            }

        } catch {}

        return value;

    }

    return "";

}


function nullableNumber(value) {

    if (
        value === null ||
        value === undefined ||
        String(value).trim() === ""
    ) {

        return null;

    }

    return Number(value);

}


function escapeHTML(value) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


function formatDate(value) {

    if (!value) return "-";

    try {

        return new Date(
            value
        ).toLocaleString(
            "ar-PS",
            {
                dateStyle:
                    "short",
                timeStyle:
                    "short"
            }
        );

    } catch {

        return String(
            value
        );

    }

}


function translateStatus(status) {

    const map = {

        pending:
            "قيد الانتظار",

        processing:
            "قيد التجهيز",

        shipped:
            "تم الشحن",

        delivered:
            "تم التسليم",

        completed:
            "مكتمل",

        cancelled:
            "ملغي",

        canceled:
            "ملغي"

    };


    return (
        map[
            String(
                status ||
                ""
            ).toLowerCase()
        ] ||
        status ||
        "غير محدد"
    );

}


function statusClass(status) {

    const value =
        String(
            status ||
            ""
        ).toLowerCase();


    if (
        [
            "completed",
            "delivered"
        ].includes(
            value
        )
    ) {

        return "active";

    }


    if (
        [
            "cancelled",
            "canceled"
        ].includes(
            value
        )
    ) {

        return "inactive";

    }


    return "pending";

}


let toastTimer;

function toast(message) {

    const element =
        document.getElementById(
            "adminToast"
        );

    if (!element) return;


    element.textContent =
        message;


    element.classList.add(
        "show"
    );


    clearTimeout(
        toastTimer
    );


    toastTimer =
        setTimeout(
            () => {

                element.classList.remove(
                    "show"
                );

            },
            3000
        );

}


/* =========================================================
   GLOBAL FUNCTIONS
========================================================= */

window.editProduct =
    editProduct;

window.deleteProduct =
    deleteProduct;

window.showOrder =
    showOrder;

window.closeOrderModal =
    closeOrderModal;
