# Nescafé scroll-to-brew site

A scroll-driven 3D landing page (Three.js r128): a sachet drops into a glass,
coffee fills, ice rises, steam curls, then the cup rises so you can grab it,
pick a quantity and add it to the cart.

## Run
Open `index.html` in a browser, or serve the folder for best results:

    npx serve .        # or: python3 -m http.server 8000

## Structure
- index.html       page markup
- css/style.css    styles
- js/main.js       3D scene, scroll animation, cart logic
- js/three.min.js  Three.js r128 (bundled, works offline)

## Tweak
- Scroll length: `#track{height:700vh}` in css/style.css
- Animation timing: the `a, b, c, d, e` phase values in `frame()` in js/main.js
- Camera path: the `K` keyframe array in js/main.js
- Price: `PRICE` in js/main.js
- Checkout is a demo only. Connect Stripe/Paystack/Flutterwave on the `#co` click handler for real payments.
