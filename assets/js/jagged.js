/* Hand-cut, jagged edges for boxes across the site.
   Every target gets an irregular clip-path whose edges wander inward by up to J px, with frequent
   deeper notches. A new shape is drawn on every page load (and when the box resizes).

   Glowing trim: instead of putting a CSS filter around the box (which forces the browser to
   re-render the filter every frame when the box contains animation or the 3D canvas), a separate
   static "back" layer is placed behind the box, cut to the same shape but a few px larger, and
   given the glow. It never changes between frames, so the browser draws it once and caches it.

   Targets:
   - [data-dna-shape="J"]  Home hero and DNA stage (gold/red trim); [data-jag-outline="none"] skips trim
   - .courses-panel, .course-detail__card, .video-card  (crimson trim)
   - .video-embed, .video-card__summary-text  (no trim)
   - .author__avatar img  (profile photo, gold/red trim) */
(function () {
  var AUTO = [
    { sel: '.courses-panel', J: 20, outline: 'crimson' },
    { sel: '.course-detail__card', J: 16, outline: 'crimson' },
    { sel: '.video-card', J: 12, outline: 'crimson' },
    { sel: '.video-embed', J: 7, outline: null },
    { sel: '.video-card__summary-text', J: 6, outline: null },
    { sel: '.author__avatar img', J: 9, outline: 'goldred' }
  ];

  function edgePoints(len, J) {
    var pts = [], pos = 0;
    while (pos < len) {
      var depth = Math.random() < 0.22 ? J * (1.4 + Math.random() * 0.8) : Math.random() * J;  /* frequent deep notches (max 2.2 J) */
      pts.push([pos, depth]);
      pos += 10 + Math.random() * 30;                                                            /* a point every 10-40 px */
    }
    return pts;
  }

  var TRIM = 3;   /* trim thickness in px (matches .jag-back inset) */

  function cut(el) {
    var J = parseFloat(el.getAttribute('data-jag')) || 14;
    var w = el.offsetWidth, h = el.offsetHeight;
    if (!w || !h) return;
    J = Math.min(J, w / 6, h / 6);
    var pts = [];
    edgePoints(w, J).forEach(function (q) { pts.push([q[0], q[1]]); });            /* top */
    edgePoints(h, J).forEach(function (q) { pts.push([w - q[1], q[0]]); });        /* right */
    edgePoints(w, J).forEach(function (q) { pts.push([w - q[0], h - q[1]]); });    /* bottom */
    edgePoints(h, J).forEach(function (q) { pts.push([q[1], h - q[0]]); });        /* left */
    var poly = 'polygon(' + pts.map(function (p) { return p[0].toFixed(1) + 'px ' + p[1].toFixed(1) + 'px'; }).join(', ') + ')';
    el.style.clipPath = el.style.webkitClipPath = poly;
    if (el._jagBack) {
      /* trim = ring between a slightly enlarged copy of the shape and the shape itself (even-odd),
         so see-through panels are not tinted by the trim colour */
      var W = w + 2 * TRIM, H = h + 2 * TRIM;
      var outer = pts.map(function (p) { return (p[0] * W / w).toFixed(1) + ' ' + (p[1] * H / h).toFixed(1); });
      var inner = pts.map(function (p) { return (p[0] + TRIM).toFixed(1) + ' ' + (p[1] + TRIM).toFixed(1); });
      var ring = "path(evenodd, 'M " + outer.join(' L ') + " Z M " + inner.join(' L ') + " Z')";
      el._jagBack.style.clipPath = el._jagBack.style.webkitClipPath = ring;
    }
    place(el);
    el._jagSize = w + 'x' + h;
  }

  /* The trim layer is inserted as a sibling just before the box and positioned over it, so the
     box itself is never moved in the page (moving a 3D viewer can reset its camera). */
  function addTrim(el, color) {
    if (!color || el._jagBack) return;
    var parent = el.parentNode;
    if (getComputedStyle(parent).position === 'static') parent.style.position = 'relative';
    var back = document.createElement('div');
    back.className = 'jag-back jag-back--' + color;
    var shape = document.createElement('div');
    shape.className = 'jag-back__shape';
    back.appendChild(shape);
    parent.insertBefore(back, el);
    el.classList.add('jag-front');
    el._jagBack = shape;
    el._jagBackBox = back;
  }

  function place(el) {
    var b = el._jagBackBox;
    if (!b) return;
    b.style.left = (el.offsetLeft - TRIM) + 'px';
    b.style.top = (el.offsetTop - TRIM) + 'px';
    b.style.width = (el.offsetWidth + 2 * TRIM) + 'px';
    b.style.height = (el.offsetHeight + 2 * TRIM) + 'px';
  }

  var targets = [];
  document.querySelectorAll('[data-dna-shape]').forEach(function (el) {
    el.setAttribute('data-jag', el.getAttribute('data-dna-shape'));
    if (el.getAttribute('data-jag-outline') !== 'none') addTrim(el, 'goldred');
    targets.push(el);
  });
  AUTO.forEach(function (t) {
    document.querySelectorAll(t.sel).forEach(function (el) {
      if (el.hasAttribute('data-jag')) return;
      el.setAttribute('data-jag', t.J);
      el.classList.add('is-jagged');
      addTrim(el, t.outline);
      targets.push(el);
    });
  });

  targets.forEach(cut);

  /* re-cut when a box changes size (window resize, a card opening) */
  if (window.ResizeObserver) {
    var ro = new ResizeObserver(function (entries) {
      entries.forEach(function (e) {
        var el = e.target;
        if (el._jagSize !== el.offsetWidth + 'x' + el.offsetHeight) cut(el);
      });
    });
    targets.forEach(function (el) { ro.observe(el); });
  }
  window.addEventListener('resize', function () { targets.forEach(place); });
  window.addEventListener('load', function () { targets.forEach(place); });
})();
