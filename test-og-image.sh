#!/bin/bash

# Dynamic OG Image Test Script
# Run this after deployment to verify everything works

echo "🧪 Testing Dynamic OG Image Setup..."
echo "======================================"
echo ""

DOMAIN="https://qurancircle.net"

# Test 1: Check if index.html has correct meta tags
echo "📄 Test 1: Checking HTML meta tags..."
META_CHECK=$(curl -s "$DOMAIN/" | grep -c 'og:image.*https://qurancircle.net/og-image.png')
if [ "$META_CHECK" -gt 0 ]; then
  echo "✅ PASS: og:image meta tag found in HTML"
else
  echo "❌ FAIL: og:image meta tag not found"
fi
echo ""

# Test 2: Check if /og-image.png is accessible
echo "🖼️  Test 2: Checking if /og-image.png is accessible..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$DOMAIN/og-image.png")
if [ "$HTTP_STATUS" = "200" ]; then
  echo "✅ PASS: /og-image.png returns 200 OK"
else
  echo "❌ FAIL: /og-image.png returns $HTTP_STATUS"
fi
echo ""

# Test 3: Check if image has correct content type
echo "🎨 Test 3: Checking content type..."
CONTENT_TYPE=$(curl -s -I "$DOMAIN/og-image.png" | grep -i "content-type" | awk '{print $2}' | tr -d '\r')
if [[ "$CONTENT_TYPE" == "image/"* ]]; then
  echo "✅ PASS: Content-Type is $CONTENT_TYPE"
else
  echo "❌ FAIL: Content-Type is $CONTENT_TYPE (expected image/*)"
fi
echo ""

# Test 4: Check if image has caching headers
echo "⚡ Test 4: Checking caching headers..."
CACHE_CONTROL=$(curl -s -I "$DOMAIN/og-image.png" | grep -i "cache-control" | awk -F': ' '{print $2}' | tr -d '\r')
if [[ "$CACHE_CONTROL" == *"max-age"* ]]; then
  echo "✅ PASS: Cache-Control header found: $CACHE_CONTROL"
else
  echo "⚠️  WARN: Cache-Control header missing or invalid"
fi
echo ""

# Test 5: Download image and check size
echo "📦 Test 5: Checking image file size..."
IMAGE_SIZE=$(curl -s "$DOMAIN/og-image.png" | wc -c)
if [ "$IMAGE_SIZE" -gt 1000 ]; then
  echo "✅ PASS: Image size is $(($IMAGE_SIZE / 1024))KB (looks valid)"
else
  echo "❌ FAIL: Image size is only ${IMAGE_SIZE} bytes (too small)"
fi
echo ""

# Summary
echo "======================================"
echo "📊 Test Summary"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Upload a test image via admin panel"
echo "2. Wait 5 seconds"
echo "3. Run this script again to verify it updated"
echo "4. Test with LinkedIn Post Inspector:"
echo "   https://www.linkedin.com/post-inspector/"
echo ""
echo "5. Test with Facebook Debugger:"
echo "   https://developers.facebook.com/tools/debug/"
echo ""
echo "6. Test with Twitter Card Validator:"
echo "   https://cards-dev.twitter.com/validator"
echo ""
