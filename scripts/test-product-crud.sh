#!/bin/bash
# End-to-end test: admin add product -> DB -> customer site -> delete -> 404.
set -u
BASE=http://localhost:3000
COOKIE=/tmp/test-cookie.txt
SLUG="test-e2e-$(date +%s)"

echo "=== Step 1: Login as admin (NextAuth credentials) ==="
RESP=$(curl -s -c $COOKIE --max-time 30 \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=admin@shafaqatelier.pk&password=Admin@123456&csrfToken=$(curl -s -b $COOKIE $BASE/api/auth/csrf 2>/dev/null | python3 -c 'import json,sys;print(json.load(sys.stdin).get("csrfToken",""))' 2>/dev/null)&callbackUrl=http://localhost:3000&json=true" \
  $BASE/api/auth/callback/credentials \
  -o /dev/null -w "%{http_code}")
echo "Login HTTP: $RESP"
sleep 4
SESSION=$(curl -s -b $COOKIE --max-time 30 $BASE/api/auth/session | head -c 200)
echo "Session: $SESSION"

echo ""
echo "=== Step 2: GET /api/admin/products (should be authenticated) ==="
COUNT_BEFORE=$(curl -s -b $COOKIE --max-time 30 $BASE/api/admin/products | python3 -c 'import json,sys;d=json.load(sys.stdin);print(len(d.get("products",[])))' 2>&1)
echo "Products before: $COUNT_BEFORE"
sleep 3

echo ""
echo "=== Step 3: Admin adds new product via POST /api/admin/products ==="
NEW_PRODUCT='{"name":"E2E Test Abaya","category":"New Arrivals","price":9999,"image":"/images/new-1.jpg","colorOptions":[{"hex":"#1a1a1a","name":"Black"},{"hex":"#c9a24b","name":"Gold"}],"sizes":["XS","S","M","L","XL","XXL"],"badge":"E2E Test","fabric":"Test fabric","care":"Test care","description":"E2E test product","stock":10}'
ADD_RESP=$(curl -s -b $COOKIE --max-time 30 -X POST -H "Content-Type: application/json" -d "$NEW_PRODUCT" $BASE/api/admin/products)
echo "Add response: $ADD_RESP"
sleep 3

echo ""
echo "=== Step 4: Verify new product appears in /api/products (customer) ==="
CUSTOMER_PRODUCTS=$(curl -s --max-time 30 $BASE/api/products)
HAS_NEW=$(echo "$CUSTOMER_PRODUCTS" | python3 -c "import json,sys;d=json.load(sys.stdin);slugs=[p['id'] for p in d['products']];print('FOUND' if 'e2e-test' in ' '.join(slugs).lower() else 'NOT FOUND')")
echo "Customer API has new product: $HAS_NEW"
sleep 3

echo ""
echo "=== Step 5: Verify new product detail returns 200 ==="
SLUG_FOUND=$(echo "$ADD_RESP" | python3 -c 'import json,sys;d=json.load(sys.stdin);print(d.get("product",{}).get("id",""))' 2>&1)
echo "Created slug: $SLUG_FOUND"
if [ -n "$SLUG_FOUND" ]; then
  SLUG="$SLUG_FOUND"
fi
sleep 3
DETAIL_STATUS=$(curl -s --max-time 30 -o /dev/null -w "%{http_code}" $BASE/api/products/$SLUG)
echo "Detail API status: $DETAIL_STATUS (should be 200)"
sleep 3

echo ""
echo "=== Step 6: Verify product appears in search ==="
SEARCH_RES=$(curl -s --max-time 30 "$BASE/api/search?q=E2E" | python3 -c 'import json,sys;d=json.load(sys.stdin);print("FOUND" if any("e2e" in p["id"].lower() or "E2E" in p["name"] for p in d["products"]) else "NOT FOUND")' 2>&1)
echo "Search results: $SEARCH_RES"
sleep 3

echo ""
echo "=== Step 7: Admin deletes product via DELETE /api/admin/products/$SLUG ==="
DEL_RESP=$(curl -s -b $COOKIE --max-time 30 -X DELETE $BASE/api/admin/products/$SLUG -w " (status: %{http_code})")
echo "Delete response: $DEL_RESP"
sleep 3

echo ""
echo "=== Step 8: Verify deleted product is GONE from /api/products ==="
CUSTOMER_PRODUCTS_AFTER=$(curl -s --max-time 30 $BASE/api/products)
HAS_AFTER=$(echo "$CUSTOMER_PRODUCTS_AFTER" | python3 -c "import json,sys;d=json.load(sys.stdin);slugs=[p['id'] for p in d['products']];print('GONE (good)' if '$SLUG' not in slugs else 'STILL THERE (BAD)')")
echo "Customer API after delete: $HAS_AFTER"
sleep 3

echo ""
echo "=== Step 9: Verify deleted product direct URL returns 404 ==="
DETAIL_AFTER=$(curl -s --max-time 30 -o /dev/null -w "%{http_code}" $BASE/api/products/$SLUG)
echo "Detail API after delete: $DETAIL_AFTER (should be 404)"
sleep 3

echo ""
echo "=== Step 10: Verify deleted product not in search ==="
SEARCH_AFTER=$(curl -s --max-time 30 "$BASE/api/search?q=E2E" | python3 -c 'import json,sys;d=json.load(sys.stdin);print("GONE (good)" if not any("e2e" in p["id"].lower() or "E2E" in p["name"] for p in d["products"]) else "STILL THERE (BAD)")' 2>&1)
echo "Search after delete: $SEARCH_AFTER"
sleep 3

echo ""
echo "=== Step 11: Verify product detail page (server-rendered) returns 404 ==="
PDP_STATUS=$(curl -s --max-time 30 -o /dev/null -w "%{http_code}" $BASE/product/$SLUG)
echo "PDP after delete: $PDP_STATUS (should be 404)"

echo ""
echo "=== SUMMARY ==="
echo "Before: $COUNT_BEFORE products"
echo "Slug: $SLUG"
echo "Login: $RESP"
echo "Detail before delete: $DETAIL_STATUS"
echo "Detail after delete: $DETAIL_AFTER (expected 404)"
echo "PDP after delete: $PDP_STATUS (expected 404)"
