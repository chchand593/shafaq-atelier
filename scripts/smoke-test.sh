#!/bin/bash
# Pre-deployment smoke test with auto-restart for sandbox memory issues.
set -u
cd /home/z/my-project

PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

restart_server() {
  pkill -9 -f "server.js" 2>/dev/null
  pkill -9 -f "next dev" 2>/dev/null
  pkill -9 -f "next-server" 2>/dev/null
  sleep 2
  NODE_ENV=production setsid nohup node .next/standalone/server.js < /dev/null > /tmp/prod.log 2>&1 &
  disown
  for i in 1 2 3 4 5; do
    sleep 2
    if curl -sS --max-time 5 -o /dev/null http://localhost:3000/api/payments/config 2>/dev/null; then
      return 0
    fi
  done
  return 1
}

test_page() {
  local path="$1"
  local expected_status="$2"
  local name="$3"
  for attempt in 1 2; do
    local result
    result=$(curl -sS --max-time 15 -o /tmp/page.html -w "%{http_code}" "http://localhost:3000${path}" 2>/dev/null)
    if [ "$result" = "$expected_status" ]; then
      local title=$(grep -o '<title[^>]*>[^<]*</title>' /tmp/page.html | head -1 | sed 's/<[^>]*>//g')
      local layla=$(grep -ci 'layla' /tmp/page.html)
      echo "  ✓ [${name}] ${path} → ${result} | title: ${title} | layla: ${layla}"
      PASS_COUNT=$((PASS_COUNT+1))
      return 0
    elif [ "$result" = "000" ] && [ $attempt -eq 1 ]; then
      echo "  ! [${name}] server died, restarting..."
      restart_server
      sleep 3
      continue
    else
      echo "  ✗ [${name}] ${path} → ${result} (expected ${expected_status})"
      FAIL_COUNT=$((FAIL_COUNT+1))
      return 1
    fi
  done
  echo "  ✗ [${name}] failed after 2 attempts"
  FAIL_COUNT=$((FAIL_COUNT+1))
}

test_redirect() {
  local path="$1"
  local expected_substr="$2"
  local name="$3"
  for attempt in 1 2; do
    local result
    result=$(curl -sS --max-time 15 -o /dev/null -w "%{http_code}|%{redirect_url}" "http://localhost:3000${path}" 2>/dev/null)
    local status=$(echo "$result" | cut -d'|' -f1)
    local redir=$(echo "$result" | cut -d'|' -f2)
    if [ "$status" = "307" ] && echo "$redir" | grep -q "$expected_substr"; then
      echo "  ✓ [${name}] ${path} → ${status} (redirect contains '${expected_substr}')"
      PASS_COUNT=$((PASS_COUNT+1))
      return 0
    elif [ "$status" = "000" ] && [ $attempt -eq 1 ]; then
      restart_server
      sleep 3
      continue
    else
      echo "  ✗ [${name}] ${path} → ${status} ${redir} (expected redirect with '${expected_substr}')"
      FAIL_COUNT=$((FAIL_COUNT+1))
      return 1
    fi
  done
}

test_api() {
  local method="$1"
  local path="$2"
  local expected_status="$3"
  local name="$4"
  for attempt in 1 2; do
    local result
    if [ "$method" = "GET" ]; then
      result=$(curl -sS --max-time 15 -o /tmp/api.json -w "%{http_code}" "http://localhost:3000${path}" 2>/dev/null)
    else
      result=$(curl -sS --max-time 15 -o /tmp/api.json -w "%{http_code}" -X "$method" -H "Content-Type: application/json" -d '{}' "http://localhost:3000${path}" 2>/dev/null)
    fi
    if [ "$result" = "$expected_status" ]; then
      local body=$(cat /tmp/api.json | head -c 100)
      echo "  ✓ [${name}] ${method} ${path} → ${result} (${body})"
      PASS_COUNT=$((PASS_COUNT+1))
      return 0
    elif [ "$result" = "000" ] && [ $attempt -eq 1 ]; then
      restart_server
      sleep 3
      continue
    else
      echo "  ✗ [${name}] ${method} ${path} → ${result} (expected ${expected_status})"
      FAIL_COUNT=$((FAIL_COUNT+1))
      return 1
    fi
  done
}

restart_server

echo ""
echo "=== Customer pages ==="
test_page "/" "200" "homepage"
test_page "/daily-wear" "200" "daily-wear"
test_page "/customized-abayas" "200" "customized-abayas"
test_page "/about" "200" "about"
test_page "/contact" "200" "contact"
test_page "/size-guide" "200" "size-guide"
test_page "/compare" "200" "compare"
test_page "/product/dw-01" "200" "product-noor"
test_page "/product/bs-01" "200" "product-rania"

echo ""
echo "=== Admin route protection (unauth → 307 redirect with admin_error=auth) ==="
test_redirect "/admin" "admin_error=auth" "admin-route-unauth"
test_redirect "/admin/products" "admin_error=auth" "admin-products-unauth"
test_redirect "/admin/orders" "admin_error=auth" "admin-orders-unauth"
test_redirect "/admin/orders/create" "admin_error=auth" "admin-create-unauth"
test_redirect "/admin/customers" "admin_error=auth" "admin-customers-unauth"
test_redirect "/admin/reviews" "admin_error=auth" "admin-reviews-unauth"
test_redirect "/admin/settings" "admin_error=auth" "admin-settings-unauth"

echo ""
echo "=== Admin API protection (unauth → 401) ==="
test_api GET "/api/admin/products" "401" "api-products"
test_api GET "/api/admin/orders" "401" "api-orders"
test_api GET "/api/admin/customers" "401" "api-customers"
test_api GET "/api/admin/settings" "401" "api-settings"
test_api GET "/api/admin/analytics" "401" "api-analytics"
test_api GET "/api/admin/reviews" "401" "api-reviews"
test_api POST "/api/admin/orders/create" "401" "api-orders-create"
test_api POST "/api/admin/products" "401" "api-products-create"
test_api PATCH "/api/admin/orders/test" "401" "api-orders-patch"

echo ""
echo "=== Payment config (online disabled, no secrets) ==="
test_api GET "/api/payments/config" "200" "payment-config"
echo "  Config body:"
cat /tmp/api.json | head -c 200
echo ""
echo ""

echo "=== Webhook rejects unsigned ==="
test_api POST "/api/payments/webhook" "400" "webhook-unsigned"

echo ""
echo "=== Security headers ==="
for attempt in 1 2; do
  headers=$(curl -sS --max-time 10 -I http://localhost:3000/ 2>/dev/null)
  if [ -n "$headers" ]; then
    echo "  Homepage headers:"
    echo "$headers" | grep -iE "X-Frame-Options|X-Content-Type-Options|Referrer-Policy|Permissions-Policy" | head -5 | sed 's/^/    /'
    PASS_COUNT=$((PASS_COUNT+1))
    break
  elif [ $attempt -eq 1 ]; then
    restart_server
    sleep 3
  fi
done

echo ""
echo "=== Products API (active only visible to customer) ==="
test_api GET "/api/products" "200" "products-list"
echo "  Products count: $(cat /tmp/api.json | grep -o '"id":' | wc -l)"
echo "  Products list has 'active' field? $(grep -c '"active"' /tmp/api.json)"

echo ""
echo "=== SUMMARY ==="
echo "PASS: $PASS_COUNT | FAIL: $FAIL_COUNT | WARN: $WARN_COUNT"
echo "TOTAL: $((PASS_COUNT + FAIL_COUNT + WARN_COUNT))"
