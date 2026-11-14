/* Hand-cut, jagged edges for boxes across the site.
   Every target gets an irregular clip-path whose edges wander inward by up to J px, with frequent
   deeper notches. A new shape is drawn on every page load (and when the box resizes), so nothing
   looks machine-perfect. Outlines come from drop-shadow filters on a wrapper, which follow the cut.

   Targets:
   - [data-dna-shape="J"]  (Home hero, DNA stage, info card; outlined by existing wrappers)
   - .courses-panel, .course-detail__card, .video-card  (crimson-outlined panels)
   - .video-embed, .video-card__summary-text (no outline)
   - .author__avatar img (profile photo, gold outline) */
(function () {
  var AUTO = [
    { sel: '.courses-panel', J: 20, outline: 'crimson' },
    { sel: '.course-detail__card', J: 16, outline: 'crimson' },
    { sel: '.video-card', J: 12, outline: 'crimson' },
    { sel: '.video-embed', J: 7, outline: null },
    { sel: '.video-card__summary-text', J: 6, outline: null },
    { sel: '.author__avatar img', J: 9, outline: 'gold' }
  ];

  function edgePoints(len, J) {
    var pts = [], pos = 0;
    while (pos < len) {
      var r = Math.random();
      var depth = r < 0.22 ? J * (1.4 + Math.random() * 0.8) : Math.random() * J;   /* frequent deep notches (max 2.2 J) */
      pts.push([pos, depth]);
      pos += 10 + Math.random() * 30;                                                    /* a point every 10-40 px */
    }
    return pts;
  }

  function cut(el) {
    var J = parseFloat(el.getAttribute('data-jag')) || 14;
    var w = el.offsetWidth, h = el.offsetHeight;
    if (!w || !h) return;
    J = Math.min(J, w / 6, h / 6);
    var p = [];
    function pct(v, total) { return (v / total * 100).toFixed(2) + '%'; }
    edgePoints(w, J).forEach(function (q) { p.push(pct(q[0], w) + ' ' + q[1].toFixed(1) + 'px'); });                                   /* top */
    edgePoints(h, J).forEach(function (q) { p.push('calc(100% - ' + q[1].toFixed(1) + 'px) ' + pct(q[0], h)); });                     /* right */
    edgePoints(w, J).forEach(function (q) { p.push(pct(w - q[0], w) + ' calc(100% - ' + q[1].toFixed(1) + 'px)'); });                /* bottom */
    edgePoints(h, J).forEach(function (q) { p.push(q[1].toFixed(1) + 'px ' + pct(h - q[0], h)); });                                    /* left */
    el.style.clipPath = 'polygon(' + p.join(', ') + ')';
    el.style.webkitClipPath = el.style.clipPath;
    el._jagSize = w + 'x' + h;
  }

  function wrap(el, color) {
    if (!color || (el.parentNode && el.parentNode.classList.contains('jag-wrap'))) return;
    var w = document.createElement('div');
    w.className = 'jag-wrap jag-wrap--' + color;
    el.parentNode.insertBefore(w, el);
    w.appendChild(el);
  }

  var targets = [];
  document.querySelectorAll('[data-dna-shape]').forEach(function (el) {
    el.setAttribute('data-jag', el.getAttribute('data-dna-shape'));
    targets.push(el);
  });
  AUTO.forEach(function (t) {
    document.querySelectorAll(t.sel).forEach(function (el) {
      if (el.hasAttribute('data-jag')) return;
      el.setAttribute('data-jag', t.J);
      el.classList.add('is-jagged');
      wrap(el, t.outline);
      targets.push(el);
    });
  });

  targets.forEach(cut);

  /* re-cut when a box changes size (e.g. window resize, a card opening) */
  if (window.ResizeObserver) {
    var ro = new ResizeObserver(function (entries) {
      entries.forEach(function (e) {
        var el = e.target;
        if (el._jagSize !== el.offsetWidth + 'x' + el.offsetHeight) cut(el);
      });
    });
    targets.forEach(function (el) { ro.observe(el); });
  }
})();
