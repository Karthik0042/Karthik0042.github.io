// Home page DNA explorer: click a gold phosphate (or a list item) to zoom into that
// segment of the helix and show a card with a close-up render, blurb and link.
(function () {
  var root = document.querySelector('[data-dna-explorer]');
  if (!root) return;

  var mv = root.querySelector('model-viewer');
  var intro = root.querySelector('.dna-card__intro');
  var detail = root.querySelector('.dna-card__detail');
  var img = detail.querySelector('img');
  var title = detail.querySelector('h3');
  var blurb = detail.querySelector('.dna-card__blurb');
  var go = detail.querySelector('.dna-card__go');
  var back = detail.querySelector('.dna-card__back');
  var hotspots = Array.prototype.slice.call(root.querySelectorAll('.dna-hotspot'));
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var HOME_ORBIT = mv.getAttribute('camera-orbit');
  if (reduceMotion) mv.removeAttribute('auto-rotate');

  function parseVec(s) {
    return s.split(/\s+/).map(function (v) { return parseFloat(v); });
  }

  function select(key) {
    var hs = root.querySelector('.dna-hotspot[data-key="' + key + '"]');
    if (!hs) return;
    var pos = hs.getAttribute('data-position');
    var n = parseVec(hs.getAttribute('data-normal'));
    // Face the phosphate head-on: theta measured around Y from +Z toward +X.
    var theta = Math.atan2(n[0], n[2]) * 180 / Math.PI;

    mv.autoRotate = false;
    mv.cameraTarget = pos;
    mv.cameraOrbit = theta.toFixed(1) + 'deg 76deg 5.5m';
    mv.fieldOfView = '30deg';

    hotspots.forEach(function (h) { h.classList.toggle('is-active', h === hs); });

    img.src = hs.getAttribute('data-image');
    img.alt = 'Close-up render of the DNA helix unzipping at the ' + hs.getAttribute('data-title') + ' segment';
    title.textContent = hs.getAttribute('data-title');
    blurb.textContent = hs.getAttribute('data-blurb');
    go.href = hs.getAttribute('data-url');
    go.textContent = 'Open ' + hs.getAttribute('data-title') + ' →';
    intro.hidden = true;
    detail.hidden = false;
    // restart the zoom-in animation on the image
    img.style.animation = 'none'; void img.offsetWidth; img.style.animation = '';

    if (window.innerWidth <= 900) {
      detail.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
    }
  }

  function reset() {
    hotspots.forEach(function (h) { h.classList.remove('is-active'); });
    mv.cameraTarget = 'auto auto auto';
    mv.cameraOrbit = HOME_ORBIT;
    mv.fieldOfView = 'auto';
    if (!reduceMotion) mv.autoRotate = true;
    detail.hidden = true;
    intro.hidden = false;
  }

  hotspots.forEach(function (h) {
    h.addEventListener('click', function () { select(h.getAttribute('data-key')); });
  });
  Array.prototype.forEach.call(root.querySelectorAll('[data-dna-select]'), function (b) {
    b.addEventListener('click', function () { select(b.getAttribute('data-dna-select')); });
  });
  back.addEventListener('click', reset);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !detail.hidden) reset();
  });
})();
