#!/bin/bash
# ============================================================
# Mazhai Vaanam Backend — Full Module Test Script
# Tests every admin endpoint the dashboard depends on
# ============================================================

API="http://localhost:5000/api"
PASS=0
FAIL=0
TOTAL=0

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

test_endpoint() {
  local label="$1"
  local method="$2"
  local url="$3"
  local data="$4"
  local token="$5"
  
  TOTAL=$((TOTAL + 1))
  
  local headers=(-H "Content-Type: application/json")
  if [ -n "$token" ]; then
    headers+=(-H "Authorization: Bearer $token")
  fi
  
  if [ "$method" = "GET" ]; then
    RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "${headers[@]}" "$url")
  elif [ "$method" = "POST" ]; then
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${headers[@]}" -d "$data" "$url")
  elif [ "$method" = "PUT" ]; then
    RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "${headers[@]}" -d "$data" "$url")
  elif [ "$method" = "DELETE" ]; then
    RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE "${headers[@]}" "$url")
  fi
  
  HTTP_CODE=$(echo "$RESPONSE" | tail -1)
  BODY=$(echo "$RESPONSE" | sed '$d')
  SUCCESS=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('success', False))" 2>/dev/null)
  
  if [ "$SUCCESS" = "True" ]; then
    echo -e "  ${GREEN}✅${NC} ${label} (${HTTP_CODE})"
    PASS=$((PASS + 1))
  else
    MSG=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('message', 'Unknown error'))" 2>/dev/null)
    echo -e "  ${RED}❌${NC} ${label} (${HTTP_CODE}) — ${MSG}"
    FAIL=$((FAIL + 1))
  fi
}

echo ""
echo "============================================"
echo "  🧪 MAZHAI VAANAM — MODULE TEST SUITE"
echo "============================================"
echo ""

# ====== 1. AUTH MODULE ======
echo -e "${YELLOW}🔐 1. AUTH MODULE${NC}"

# Login
LOGIN_RES=$(curl -s -X POST -H "Content-Type: application/json" \
  -d '{"email":"admin@mazhaivaanam.com","password":"Admin@123"}' \
  "$API/auth/login")
TOKEN=$(echo "$LOGIN_RES" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])" 2>/dev/null)
REFRESH=$(echo "$LOGIN_RES" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['refreshToken'])" 2>/dev/null)

if [ -n "$TOKEN" ] && [ "$TOKEN" != "None" ]; then
  echo -e "  ${GREEN}✅${NC} Admin Login — Token obtained"
  PASS=$((PASS + 1))
else
  echo -e "  ${RED}❌${NC} Admin Login — No token received"
  FAIL=$((FAIL + 1))
  echo "Cannot proceed without token. Exiting."
  exit 1
fi
TOTAL=$((TOTAL + 1))

test_endpoint "Get Profile (me)" "GET" "$API/auth/me" "" "$TOKEN"
test_endpoint "Refresh Token" "POST" "$API/auth/refresh-token" "{\"refreshToken\":\"$REFRESH\"}" ""

# Register a test customer
test_endpoint "Register Customer" "POST" "$API/auth/register" '{"firstName":"Test","lastName":"User","email":"test@test.com","password":"Test@123","phone":"+91 99999 00000"}' ""

echo ""

# ====== 2. PRODUCTS MODULE ======
echo -e "${YELLOW}🛍️  2. PRODUCTS MODULE${NC}"

test_endpoint "Get All Products" "GET" "$API/products" "" ""
test_endpoint "Featured Products" "GET" "$API/products/featured" "" ""
test_endpoint "New Arrivals" "GET" "$API/products/new-arrivals" "" ""
test_endpoint "Best Sellers" "GET" "$API/products/best-sellers" "" ""
test_endpoint "Pre-Orders" "GET" "$API/products/pre-orders" "" ""
test_endpoint "Search Products" "GET" "$API/products/search?q=silk" "" ""
test_endpoint "Filter by Category" "GET" "$API/products?category=festive-glow" "" ""
test_endpoint "Filter by Fabric" "GET" "$API/products?fabric=Cotton" "" ""

# Get first product slug
SLUG=$(curl -s "$API/products?limit=1" | python3 -c "import sys,json; print(json.load(sys.stdin)['data'][0]['slug'])" 2>/dev/null)
test_endpoint "Get Product by Slug" "GET" "$API/products/$SLUG" "" ""

echo ""

# ====== 3. CATEGORIES MODULE ======
echo -e "${YELLOW}📂 3. CATEGORIES MODULE${NC}"

test_endpoint "Get All Categories" "GET" "$API/categories" "" ""

# Get first category slug
CAT_SLUG=$(curl -s "$API/categories" | python3 -c "import sys,json; print(json.load(sys.stdin)['data'][0]['slug'])" 2>/dev/null)
test_endpoint "Get Category by Slug" "GET" "$API/categories/$CAT_SLUG" "" ""
test_endpoint "Get Collections" "GET" "$API/collections" "" ""

echo ""

# ====== 4. ADMIN DASHBOARD MODULE ======
echo -e "${YELLOW}📊 4. ADMIN DASHBOARD MODULE${NC}"

test_endpoint "Dashboard Overview" "GET" "$API/admin/dashboard" "" "$TOKEN"
test_endpoint "Sales (daily)" "GET" "$API/admin/dashboard/sales?period=daily" "" "$TOKEN"
test_endpoint "Sales (weekly)" "GET" "$API/admin/dashboard/sales?period=weekly" "" "$TOKEN"
test_endpoint "Sales (monthly)" "GET" "$API/admin/dashboard/sales?period=monthly" "" "$TOKEN"

echo ""

# ====== 5. ADMIN PRODUCTS CRUD ======
echo -e "${YELLOW}🛍️  5. ADMIN PRODUCTS CRUD${NC}"

# Get category ID for product creation
CAT_ID=$(curl -s "$API/categories" | python3 -c "import sys,json; print(json.load(sys.stdin)['data'][0]['_id'])" 2>/dev/null)

# Create product
CREATE_RES=$(curl -s -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d "{\"name\":\"Test Saree\",\"description\":\"Test product for validation\",\"category\":\"$CAT_ID\",\"fabric\":\"Pure Silk\",\"price\":9999,\"mrpPrice\":12000,\"occasion\":\"Wedding\"}" \
  "$API/admin/products")
PROD_ID=$(echo "$CREATE_RES" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['_id'])" 2>/dev/null)
CREATE_OK=$(echo "$CREATE_RES" | python3 -c "import sys,json; print(json.load(sys.stdin).get('success', False))" 2>/dev/null)

TOTAL=$((TOTAL + 1))
if [ "$CREATE_OK" = "True" ]; then
  echo -e "  ${GREEN}✅${NC} Create Product (201)"
  PASS=$((PASS + 1))
else
  echo -e "  ${RED}❌${NC} Create Product — $(echo "$CREATE_RES" | python3 -c "import sys,json; print(json.load(sys.stdin).get('message',''))" 2>/dev/null)"
  FAIL=$((FAIL + 1))
fi

test_endpoint "Update Product" "PUT" "$API/admin/products/$PROD_ID" '{"name":"Test Saree Updated","price":10999}' "$TOKEN"
test_endpoint "Delete Product" "DELETE" "$API/admin/products/$PROD_ID" "" "$TOKEN"

echo ""

# ====== 6. ADMIN CATEGORIES CRUD ======
echo -e "${YELLOW}📂 6. ADMIN CATEGORIES CRUD${NC}"

CREATE_CAT=$(curl -s -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Test Category","description":"Test"}' "$API/admin/categories")
NEW_CAT_ID=$(echo "$CREATE_CAT" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['_id'])" 2>/dev/null)
CREATE_CAT_OK=$(echo "$CREATE_CAT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('success', False))" 2>/dev/null)

TOTAL=$((TOTAL + 1))
if [ "$CREATE_CAT_OK" = "True" ]; then
  echo -e "  ${GREEN}✅${NC} Create Category (201)"
  PASS=$((PASS + 1))
else
  echo -e "  ${RED}❌${NC} Create Category"
  FAIL=$((FAIL + 1))
fi

test_endpoint "Update Category" "PUT" "$API/admin/categories/$NEW_CAT_ID" '{"name":"Test Category Updated"}' "$TOKEN"
test_endpoint "Delete Category" "DELETE" "$API/admin/categories/$NEW_CAT_ID" "" "$TOKEN"

echo ""

# ====== 7. ADMIN ORDERS MODULE ======
echo -e "${YELLOW}📦 7. ADMIN ORDERS MODULE${NC}"

test_endpoint "Get All Orders (admin)" "GET" "$API/admin/orders" "" "$TOKEN"

echo ""

# ====== 8. ADMIN USERS MODULE ======
echo -e "${YELLOW}👥 8. ADMIN USERS MODULE${NC}"

test_endpoint "Get All Users" "GET" "$API/admin/users" "" "$TOKEN"

echo ""

# ====== 9. ADMIN INVENTORY MODULE ======
echo -e "${YELLOW}📊 9. ADMIN INVENTORY MODULE${NC}"

test_endpoint "Get All Inventory" "GET" "$API/admin/inventory" "" "$TOKEN"
test_endpoint "Get Low Stock" "GET" "$API/admin/inventory/low-stock" "" "$TOKEN"
test_endpoint "Get Out of Stock" "GET" "$API/admin/inventory/out-of-stock" "" "$TOKEN"

# Get a product ID for restock test
INV_PROD_ID=$(curl -s -H "Authorization: Bearer $TOKEN" "$API/admin/inventory" | python3 -c "import sys,json; print(json.load(sys.stdin)['data'][0]['product']['_id'])" 2>/dev/null)
test_endpoint "Get Product Inventory" "GET" "$API/admin/inventory/$INV_PROD_ID" "" "$TOKEN"
test_endpoint "Restock Product (+10)" "PUT" "$API/admin/inventory/$INV_PROD_ID/restock" '{"quantity":10,"note":"Test restock"}' "$TOKEN"

echo ""

# ====== 10. ADMIN REVIEWS MODULE ======
echo -e "${YELLOW}⭐ 10. ADMIN REVIEWS MODULE${NC}"

test_endpoint "Get Pending Reviews" "GET" "$API/admin/reviews" "" "$TOKEN"

echo ""

# ====== 11. ADMIN INQUIRIES MODULE ======
echo -e "${YELLOW}📬 11. ADMIN INQUIRIES MODULE${NC}"

test_endpoint "Get All Inquiries" "GET" "$API/admin/inquiries" "" "$TOKEN"

# Submit a contact inquiry first
test_endpoint "Submit Contact Inquiry" "POST" "$API/contact" '{"name":"Test","email":"test@test.com","subject":"Test","message":"Hello from test script"}' ""

echo ""

# ====== 12. ADMIN COUPONS MODULE ======
echo -e "${YELLOW}🎫 12. ADMIN COUPONS MODULE${NC}"

test_endpoint "Get All Coupons" "GET" "$API/admin/coupons" "" "$TOKEN"

CREATE_COUPON=$(curl -s -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"code":"TESTDISCOUNT","type":"percentage","value":10,"minOrderAmount":1000,"validUntil":"2027-12-31","description":"Test coupon"}' \
  "$API/admin/coupons")
COUPON_ID=$(echo "$CREATE_COUPON" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['_id'])" 2>/dev/null)
COUPON_OK=$(echo "$CREATE_COUPON" | python3 -c "import sys,json; print(json.load(sys.stdin).get('success', False))" 2>/dev/null)

TOTAL=$((TOTAL + 1))
if [ "$COUPON_OK" = "True" ]; then
  echo -e "  ${GREEN}✅${NC} Create Coupon (201)"
  PASS=$((PASS + 1))
else
  echo -e "  ${RED}❌${NC} Create Coupon — $(echo "$CREATE_COUPON" | python3 -c "import sys,json; print(json.load(sys.stdin).get('message',''))" 2>/dev/null)"
  FAIL=$((FAIL + 1))
fi

test_endpoint "Update Coupon" "PUT" "$API/admin/coupons/$COUPON_ID" '{"description":"Updated test coupon"}' "$TOKEN"
test_endpoint "Delete Coupon" "DELETE" "$API/admin/coupons/$COUPON_ID" "" "$TOKEN"

echo ""

# ====== 13. CART MODULE (Customer) ======
echo -e "${YELLOW}🛒 13. CART MODULE${NC}"

# Login as customer
CUST_LOGIN=$(curl -s -X POST -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test@123"}' "$API/auth/login")
CUST_TOKEN=$(echo "$CUST_LOGIN" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])" 2>/dev/null)

# Get a product ID
FIRST_PROD=$(curl -s "$API/products?limit=1" | python3 -c "import sys,json; print(json.load(sys.stdin)['data'][0]['_id'])" 2>/dev/null)

test_endpoint "Add to Cart" "POST" "$API/cart/add" "{\"productId\":\"$FIRST_PROD\",\"quantity\":2}" "$CUST_TOKEN"
test_endpoint "Get Cart" "GET" "$API/cart" "" "$CUST_TOKEN"
test_endpoint "Cart Count" "GET" "$API/cart/count" "" "$CUST_TOKEN"
test_endpoint "Update Cart Item" "PUT" "$API/cart/update" "{\"productId\":\"$FIRST_PROD\",\"quantity\":1}" "$CUST_TOKEN"
test_endpoint "Remove from Cart" "DELETE" "$API/cart/remove/$FIRST_PROD" "" "$CUST_TOKEN"

echo ""

# ====== 14. WISHLIST MODULE (Customer) ======
echo -e "${YELLOW}❤️  14. WISHLIST MODULE${NC}"

test_endpoint "Toggle Wishlist (add)" "POST" "$API/wishlist/toggle/$FIRST_PROD" "" "$CUST_TOKEN"
test_endpoint "Get Wishlist" "GET" "$API/wishlist" "" "$CUST_TOKEN"
test_endpoint "Remove from Wishlist" "DELETE" "$API/wishlist/remove/$FIRST_PROD" "" "$CUST_TOKEN"

echo ""

# ====== 15. ADDRESS MODULE (Customer) ======
echo -e "${YELLOW}📍 15. ADDRESS MODULE${NC}"

CREATE_ADDR=$(curl -s -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $CUST_TOKEN" \
  -d '{"fullName":"Test User","phone":"+91 99999 00000","addressLine":"123 Test Street","city":"Chennai","state":"Tamil Nadu","pinCode":"600001"}' \
  "$API/addresses")
ADDR_ID=$(echo "$CREATE_ADDR" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['_id'])" 2>/dev/null)
ADDR_OK=$(echo "$CREATE_ADDR" | python3 -c "import sys,json; print(json.load(sys.stdin).get('success', False))" 2>/dev/null)

TOTAL=$((TOTAL + 1))
if [ "$ADDR_OK" = "True" ]; then
  echo -e "  ${GREEN}✅${NC} Create Address (201)"
  PASS=$((PASS + 1))
else
  echo -e "  ${RED}❌${NC} Create Address — $(echo "$CREATE_ADDR" | python3 -c "import sys,json; print(json.load(sys.stdin).get('message',''))" 2>/dev/null)"
  FAIL=$((FAIL + 1))
fi

test_endpoint "Get Addresses" "GET" "$API/addresses" "" "$CUST_TOKEN"
test_endpoint "Update Address" "PUT" "$API/addresses/$ADDR_ID" '{"fullName":"Updated Name"}' "$CUST_TOKEN"
test_endpoint "Set Default Address" "PUT" "$API/addresses/$ADDR_ID/default" "" "$CUST_TOKEN"
test_endpoint "Delete Address" "DELETE" "$API/addresses/$ADDR_ID" "" "$CUST_TOKEN"

echo ""

# ====== 16. REVIEWS MODULE (Customer) ======
echo -e "${YELLOW}⭐ 16. REVIEWS MODULE (Customer)${NC}"

test_endpoint "Get Product Reviews" "GET" "$API/reviews/product/$FIRST_PROD" "" ""
test_endpoint "Submit Review" "POST" "$API/reviews/product/$FIRST_PROD" '{"rating":5,"text":"Beautiful saree!","name":"Test User"}' "$CUST_TOKEN"

echo ""

# ====== 17. ORDER MODULE (Customer) ======
echo -e "${YELLOW}📦 17. ORDERS MODULE (Customer)${NC}"

test_endpoint "Get My Orders" "GET" "$API/orders" "" "$CUST_TOKEN"

echo ""

# ====== RESULTS ======
echo "============================================"
echo "  📊 TEST RESULTS"
echo "============================================"
echo ""
echo -e "  Total:  ${TOTAL}"
echo -e "  ${GREEN}Passed: ${PASS}${NC}"
echo -e "  ${RED}Failed: ${FAIL}${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
  echo -e "  ${GREEN}🎉 ALL MODULES WORKING PERFECTLY!${NC}"
else
  echo -e "  ${YELLOW}⚠️  ${FAIL} test(s) need attention${NC}"
fi
echo ""
