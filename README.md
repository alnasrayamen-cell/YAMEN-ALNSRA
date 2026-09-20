<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>لوحة تحكم الأدمن</title>

  <style>
    * {
      box-sizing: border-box;
      font-family: Arial, sans-serif;
    }

    body {
      margin: 0;
      background: #f3f4f6;
    }

    header {
      background: #111827;
      color: white;
      padding: 20px 8%;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .container {
      width: 90%;
      max-width: 1000px;
      margin: 30px auto;
    }

    .box {
      background: white;
      padding: 25px;
      margin-bottom: 25px;
      border-radius: 10px;
      box-shadow: 0 2px 8px #ddd;
    }

    input {
      width: 100%;
      padding: 12px;
      margin: 8px 0;
      border: 1px solid #ddd;
      border-radius: 6px;
    }

    button {
      border: none;
      padding: 11px 18px;
      border-radius: 6px;
      cursor: pointer;
      color: white;
      background: #2563eb;
      margin-top: 8px;
    }

    button:hover {
      background: #1d4ed8;
    }

    .delete {
      background: #dc2626;
    }

    .delete:hover {
      background: #b91c1c;
    }

    .product {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #eee;
      padding: 15px 0;
      gap: 15px;
    }

    .product img {
      width: 70px;
      height: 70px;
      object-fit: cover;
      border-radius: 8px;
    }

    .hidden {
      display: none;
    }

    .error {
      color: red;
      margin-top: 10px;
    }
  </style>
</head>

<body>

  <header>
    <h2>لوحة تحكم المتجر</h2>
    <button onclick="logout()">تسجيل الخروج</button>
  </header>

  <div class="container">

    <!-- تسجيل الدخول -->
    <div class="box" id="login-box">
      <h2>تسجيل دخول الأدمن</h2>

      <input type="text" id="username" placeholder="اسم المستخدم">
      <input type="password" id="password" placeholder="كلمة المرور">

      <button onclick="login()">دخول</button>

      <p class="error" id="login-error"></p>
    </div>

    <!-- لوحة التحكم -->
    <div id="dashboard" class="hidden">

      <div class="box">
        <h2>إضافة منتج جديد</h2>

        <input type="text" id="product-name" placeholder="اسم المنتج">
        <input type="number" id="product-price" placeholder="السعر">
        <input type="text" id="product-image" placeholder="رابط صورة المنتج">

        <button onclick="addProduct()">إضافة المنتج</button>
      </div>

      <div class="box">
        <h2>المنتجات الحالية</h2>
        <div id="products-list"></div>
      </div>

    </div>

  </div>

  <script>
    const ADMIN_USERNAME = "admin";
    const ADMIN_PASSWORD = "1234";

    let products = JSON.parse(localStorage.getItem("products")) || [];

    function login() {
      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;
      const error = document.getElementById("login-error");

      if (
        username === ADMIN_USERNAME &&
        password === ADMIN_PASSWORD
      ) {
        localStorage.setItem("adminLoggedIn", "true");

        document.getElementById("login-box").classList.add("hidden");
        document.getElementById("dashboard").classList.remove("hidden");

        displayProducts();
      } else {
        error.textContent = "اسم المستخدم أو كلمة المرور غير صحيحة";
      }
    }

    function logout() {
      localStorage.removeItem("adminLoggedIn");
      location.reload();
    }

    function addProduct() {
      const name = document.getElementById("product-name").value;
      const price = document.getElementById("product-price").value;
      const image = document.getElementById("product-image").value;

      if (!name || !price || !image) {
        alert("يرجى تعبئة جميع الحقول");
        return;
      }

      const newProduct = {
        id: Date.now(),
        name: name,
        price: price,
        image: image
      };

      products.push(newProduct);

      localStorage.setItem("products", JSON.stringify(products));

      document.getElementById("product-name").value = "";
      document.getElementById("product-price").value = "";
      document.getElementById("product-image").value = "";

      displayProducts();
      alert("تمت إضافة المنتج بنجاح");
    }

    function deleteProduct(id) {
      products = products.filter(product => product.id !== id);

      localStorage.setItem("products", JSON.stringify(products));

      displayProducts();
    }

    function displayProducts() {
      const list = document.getElementById("products-list");

      if (products.length === 0) {
        list.innerHTML = "<p>لا توجد منتجات حاليًا</p>";
        return;
      }

      list.innerHTML = products.map(product => `
        <div class="product">
          <img src="${product.image}" alt="${product.name}">

          <div>
            <strong>${product.name}</strong>
            <p>${product.price} ريال</p>
          </div>

          <button class="delete" onclick="deleteProduct(${product.id})">
            حذف
          </button>
        </div>
      `).join("");
    }

    function checkLogin() {
      const loggedIn = localStorage.getItem("adminLoggedIn");

      if (loggedIn === "true") {
        document.getElementById("login-box").classList.add("hidden");
        document.getElementById("dashboard").classList.remove("hidden");
        displayProducts();
      }
    }

    checkLogin();
  </script>

</body>
</html>
