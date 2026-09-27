// ==========================================
// لوحة تحكم المتجر - admin.js
// ==========================================


// ==========================================
// المنتجات الافتراضية
// ==========================================

const defaultAdminProducts = [
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
    }
];


// ==========================================
// تحميل المنتجات
// ==========================================

function adminGetProducts() {

    const saved =
        localStorage.getItem("storeProducts");

    if (saved) {

        try {
            return JSON.parse(saved);
        }

        catch (error) {
            console.log("خطأ في قراءة المنتجات");
        }
    }

    localStorage.setItem(
        "storeProducts",
        JSON.stringify(defaultAdminProducts)
    );

    return defaultAdminProducts;
}


// ==========================================
// حفظ المنتجات
// ==========================================

function adminSaveProducts(products) {

    localStorage.setItem(
        "storeProducts",
        JSON.stringify(products)
    );
}


// ==========================================
// عرض إحصائيات لوحة الأدمن
// ==========================================

function loadAdminStats() {

    const products =
        adminGetProducts();


    const visitors =
        Number(
            localStorage.getItem("storeVisits") || 0
        );


    const orders =
        JSON.parse(
            localStorage.getItem("storeOrders") || "[]"
        );


    const cart =
        JSON.parse(
            localStorage.getItem("storeCart") || "[]"
        );


    const visitorsElement =
        document.getElementById("visitors");

    const productCountElement =
        document.getElementById("productCount");

    const ordersElement =
        document.getElementById("orders");

    const cartStatElement =
        document.getElementById("cartStat");


    if (visitorsElement) {

        visitorsElement.textContent =
            visitors;

    }


    if (productCountElement) {

        productCountElement.textContent =
            products.length;

    }


    if (ordersElement) {

        ordersElement.textContent =
            orders.length;

    }


    if (cartStatElement) {

        cartStatElement.textContent =
            cart.length;

    }


    const liveVisitors =
        document.getElementById("liveVisitors");

    const todayVisitors =
        document.getElementById("todayVisitors");


    if (liveVisitors) {

        liveVisitors.textContent =
            visitors;

    }


    if (todayVisitors) {

        todayVisitors.textContent =
            visitors;

    }
}


// ==========================================
// عرض المنتجات في الأدمن
// ==========================================

function renderAdminProducts() {

    const container =
        document.getElementById("adminProducts");


    if (!container) {
        return;
    }


    const products =
        adminGetProducts();


    if (products.length === 0) {

        container.innerHTML = `
            <p class="muted">
                لا توجد منتجات حالياً.
            </p>
        `;

        return;
    }


    container.innerHTML =
        products.map(product => {

            return `
                <div class="admin-product">

                    <div>

                        <strong>
                            ${adminEscape(product.name)}
                        </strong>

                        <div class="muted">

                            ${Number(product.price).toFixed(2)}
                            ₪

                            -
                            ${adminEscape(product.category || "")}

                        </div>

                    </div>


                    <button
                        class="btn danger small"
                        onclick="deleteProduct(${product.id})"
                    >
                        🗑️ حذف
                    </button>

                </div>
            `;

        }).join("");
}


// ==========================================
// إضافة منتج
// ==========================================

function addProduct() {

    const nameElement =
        document.getElementById("pName");

    const priceElement =
        document.getElementById("pPrice");

    const categoryElement =
        document.getElementById("pCategory");

    const imageElement =
        document.getElementById("pImage");

    const descElement =
        document.getElementById("pDesc");


    const name =
        nameElement.value.trim();

    const price =
        Number(priceElement.value);

    const category =
        categoryElement.value.trim();

    const image =
        imageElement.value.trim();

    const description =
        descElement.value.trim();


    if (!name) {

        alert("اكتب اسم المنتج أولاً.");

        return;
    }


    if (!price || price < 0) {

        alert("أدخل سعر صحيح.");

        return;
    }


    if (!category) {

        alert("اكتب تصنيف المنتج.");

        return;
    }


    const products =
        adminGetProducts();


    const newProduct = {

        id: Date.now(),

        name: name,

        price: price,

        category: category,

        image:
            image ||
            "https://via.placeholder.com/600x400?text=Product",

        description:
            description ||
            "منتج جديد من متجرنا."

    };


    products.push(newProduct);


    adminSaveProducts(products);


    nameElement.value = "";

    priceElement.value = "";

    categoryElement.value = "";

    imageElement.value = "";

    descElement.value = "";


    renderAdminProducts();

    loadAdminStats();


    alert("تمت إضافة المنتج بنجاح ✅");
}


// ==========================================
// حذف منتج
// ==========================================

function deleteProduct(productId) {

    const products =
        adminGetProducts();


    const product =
        products.find(
            item =>
                Number(item.id) ===
                Number(productId)
        );


    if (!product) {
        return;
    }


    const confirmed =
        confirm(
            "هل تريد حذف المنتج:\n" +
            product.name +
            " ؟"
        );


    if (!confirmed) {
        return;
    }


    const updated =
        products.filter(
            item =>
                Number(item.id) !==
                Number(productId)
        );


    adminSaveProducts(updated);


    renderAdminProducts();

    loadAdminStats();


    alert("تم حذف المنتج ✅");
}


// ==========================================
// حفظ إعدادات الصفحة الرئيسية
// ==========================================

function saveHero() {

    const titleElement =
        document.getElementById("heroTitleInput");

    const textElement =
        document.getElementById("heroTextInput");

    const imageElement =
        document.getElementById("heroImageInput");


    const title =
        titleElement.value.trim();

    const text =
        textElement.value.trim();

    const image =
        imageElement.value.trim();


    if (title) {

        localStorage.setItem(
            "heroTitle",
            title
        );

    }


    if (text) {

        localStorage.setItem(
            "heroText",
            text
        );

    }


    if (image) {

        localStorage.setItem(
            "heroImage",
            image
        );

    }


    alert(
        "تم حفظ إعدادات الصفحة الرئيسية ✅"
    );
}


// ==========================================
// تحميل إعدادات الصفحة الرئيسية
// ==========================================

function loadHeroSettings() {

    const title =
        localStorage.getItem("heroTitle");

    const text =
        localStorage.getItem("heroText");

    const image =
        localStorage.getItem("heroImage");


    const titleElement =
        document.getElementById("heroTitleInput");

    const textElement =
        document.getElementById("heroTextInput");

    const imageElement =
        document.getElementById("heroImageInput");


    if (title && titleElement) {

        titleElement.value =
            title;

    }


    if (text && textElement) {

        textElement.value =
            text;

    }


    if (image && imageElement) {

        imageElement.value =
            image;

    }
}


// ==========================================
// مكتبة الصور
// ==========================================

function loadMedia() {

    const container =
        document.getElementById("mediaGrid");


    if (!container) {
        return;
    }


    const images =
        JSON.parse(
            localStorage.getItem("storeImages") || "[]"
        );


    if (images.length === 0) {

        container.innerHTML = `
            <p class="muted">
                لم تتم إضافة صور بعد.
            </p>
        `;

        return;
    }


    container.innerHTML =
        images.map((image, index) => {

            return `
                <div class="media-item">

                    <img
                        src="${image}"
                        alt="صورة المتجر"
                    >

                    <button
                        onclick="deleteMedia(${index})"
                    >
                        ×
                    </button>

                </div>
            `;

        }).join("");
}


// ==========================================
// رفع الصور
// ==========================================

function setupImageUpload() {

    const upload =
        document.getElementById("imageUpload");


    if (!upload) {
        return;
    }


    upload.addEventListener(
        "change",
        function () {

            const files =
                Array.from(this.files);


            if (files.length === 0) {
                return;
            }


            const existing =
                JSON.parse(
                    localStorage.getItem("storeImages") || "[]"
                );


            let processed = 0;


            files.forEach(file => {

                const reader =
                    new FileReader();


                reader.onload = function (event) {

                    existing.push(
                        event.target.result
                    );


                    processed++;


                    if (
                        processed ===
                        files.length
                    ) {

                        localStorage.setItem(
                            "storeImages",
                            JSON.stringify(existing)
                        );


                        loadMedia();

                        alert(
                            "تمت إضافة الصور إلى المكتبة 🖼️"
                        );

                    }
                };


                reader.readAsDataURL(file);

            });


            this.value = "";

        }
    );
}


// ==========================================
// حذف صورة
// ==========================================

function deleteMedia(index) {

    const images =
        JSON.parse(
            localStorage.getItem("storeImages") || "[]"
        );


    if (
        index < 0 ||
        index >= images.length
    ) {
        return;
    }


    const confirmed =
        confirm(
            "هل تريد حذف هذه الصورة؟"
        );


    if (!confirmed) {
        return;
    }


    images.splice(index, 1);


    localStorage.setItem(
        "storeImages",
        JSON.stringify(images)
    );


    loadMedia();
}


// ==========================================
// حماية النص
// ==========================================

function adminEscape(value) {

    return String(value)

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;")

        .replace(/"/g, "&quot;")

        .replace(/'/g, "&#039;");
}


// ==========================================
// تشغيل لوحة الأدمن
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadAdminStats();

        renderAdminProducts();

        loadHeroSettings();

        loadMedia();

        setupImageUpload();

    }
);
