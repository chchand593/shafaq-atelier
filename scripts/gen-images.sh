#!/bin/bash
# Generate premium abaya images for the e-commerce foundation
# NOTE: API requires dimensions to be multiples of 32, max pixels <= 2^22
cd /home/z/my-project
mkdir -p public/images

log() { echo "[$(date +%H:%M:%S)] $*"; }

log "=== Generating abaya images (valid sizes) ==="

# Hero image - landscape 1344x768 (multiples of 32)
z-ai image -p "Editorial fashion photography of an elegant Pakistani woman wearing a flowing black abaya with subtle gold embroidery, standing gracefully in a minimalist beige studio with soft warm natural light, modest fashion, premium luxury aesthetic, sophisticated, high fashion magazine style, soft shadows, cream and mocha tones background" -o "./public/images/hero.jpg" -s 1344x768 >/dev/null 2>&1 && log "hero OK" || log "hero FAIL" &

# Daily Wear products (portrait 864x1152)
z-ai image -p "Premium product photography of a modest black everyday abaya on an elegant invisible mannequin, minimalist cream studio background, soft diffused lighting, full length, simple clean design, high quality fashion catalog, beige tones" -o "./public/images/daily-1.jpg" -s 864x1152 >/dev/null 2>&1 && log "daily-1 OK" || log "daily-1 FAIL" &
z-ai image -p "Premium product photography of a soft mocha brown everyday abaya dress on an elegant invisible mannequin, minimalist off-white studio background, soft natural lighting, full length, simple modest design, high quality fashion catalog" -o "./public/images/daily-2.jpg" -s 864x1152 >/dev/null 2>&1 && log "daily-2 OK" || log "daily-2 FAIL" &
z-ai image -p "Premium product photography of a beige everyday abaya on an elegant invisible mannequin, minimalist cream studio background, soft diffused lighting, full length, simple clean modest design, high quality fashion catalog" -o "./public/images/daily-3.jpg" -s 864x1152 >/dev/null 2>&1 && log "daily-3 OK" || log "daily-3 FAIL" &
z-ai image -p "Premium product photography of a charcoal grey everyday abaya on an elegant invisible mannequin, minimalist warm white studio background, soft natural lighting, full length, simple modest design, high quality fashion catalog" -o "./public/images/daily-4.jpg" -s 864x1152 >/dev/null 2>&1 && log "daily-4 OK" || log "daily-4 FAIL" &

# Customized abaya feature image - landscape 1344x768
z-ai image -p "Artisan hands embroidering delicate gold thread details onto a luxurious black abaya fabric, close-up elegant craftsmanship, warm soft lighting, beige and cream workspace, premium bespoke tailoring, modest luxury fashion" -o "./public/images/custom.jpg" -s 1344x768 >/dev/null 2>&1 && log "custom OK" || log "custom FAIL" &

# New arrivals + best sellers products (portrait 864x1152)
z-ai image -p "Premium product photography of an elegant black abaya with delicate gold floral embroidery on sleeves, on invisible mannequin, minimalist cream studio background, soft lighting, full length, luxury modest fashion catalog" -o "./public/images/new-1.jpg" -s 864x1152 >/dev/null 2>&1 && log "new-1 OK" || log "new-1 FAIL" &
z-ai image -p "Premium product photography of a flowing soft cream colored abaya with subtle beading detail, on invisible mannequin, minimalist beige studio background, soft diffused lighting, full length, luxury modest fashion" -o "./public/images/new-2.jpg" -s 864x1152 >/dev/null 2>&1 && log "new-2 OK" || log "new-2 FAIL" &
z-ai image -p "Premium product photography of a deep mocha brown abaya with elegant bell sleeves and subtle gold trim, on invisible mannequin, minimalist off-white studio background, soft lighting, full length, luxury modest fashion" -o "./public/images/best-1.jpg" -s 864x1152 >/dev/null 2>&1 && log "best-1 OK" || log "best-1 FAIL" &
z-ai image -p "Premium product photography of a black open front abaya with cream inner dress and delicate gold belt detail, on invisible mannequin, minimalist warm studio background, soft lighting, full length, luxury modest fashion catalog" -o "./public/images/best-2.jpg" -s 864x1152 >/dev/null 2>&1 && log "best-2 OK" || log "best-2 FAIL" &

wait
log "=== All images generation attempt finished ==="
ls -la public/images/
