// Home page DNA explorer: select a gold node to zoom the camera onto it, unzip that
// segment of the helix (baked glTF morph animation "unzip_<key>"), and show a card.
(function () {
  var root = document.querySelector('[data-dna-explorer]');
  if (!root) return;

  var mv = root.querySelector('model-viewer');
  var card = root.querySelector('.dna-card');
  var img = card.querySelector('img');
  var title = card.querySelector('h3');
  var blurb = card.querySelector('.dna-card__blurb');
  var go = card.querySelector('.dna-card__go');
  var back = card.querySelector('.dna-card__back');
  var hotspots = Array.prototype.slice.call(root.querySelectorAll('.dna-hotspot'));
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var HOME_ORBIT = mv.getAttribute('camera-orbit');
  var OPEN_T = 0.999;          // end of the 1 s unzip clip (stay just short of the loop point)
  var openKey = null;
  var tweenId = 0;
  if (reduceMotion) mv.removeAttribute('auto-rotate');

  // Drive the unzip clip by scrubbing currentTime while paused, so it holds open.
  function scrubTo(target, ms, done) {
    var id = ++tweenId;
    var start = mv.currentTime || 0;
    if (reduceMotion || ms <= 0) { mv.currentTime = target; if (done) done(); return; }
    var t0 = performance.now();
    (function step(now) {
      if (id !== tweenId) return;
      var p = Math.min(1, (now - t0) / ms);
      var e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      mv.currentTime = start + (target - start) * e;
      if (p < 1) requestAnimationFrame(step); else if (done) done();
    })(t0);
  }

  function unzip(key) {
    var clip = 'unzip_' + key;
    if (!mv.availableAnimations || mv.availableAnimations.indexOf(clip) === -1) return;
    var open = function () {
      mv.pause();
      mv.animationName = clip;
      mv.currentTime = 0;
      openKey = key;
      // wait a frame so the new clip is bound before scrubbing
      requestAnimationFrame(function () { scrubTo(OPEN_T, 1200); });
    };
    if (openKey && openKey !== key) scrubTo(0, 400, open); else if (openKey !== key) open();
  }

  function zipClosed(done) {
    if (!openKey) { if (done) done(); return; }
    scrubTo(0, 700, function () { openKey = null; if (done) done(); });
  }

  function select(key) {
    var hs = root.querySelector('.dna-hotspot[data-key="' + key + '"]');
    if (!hs) return;
    var n = hs.getAttribute('data-normal').split(/\s+/).map(parseFloat);
    var theta = Math.atan2(n[0], n[2]) * 180 / Math.PI; // face the node head-on

    mv.autoRotate = false;
    mv.cameraTarget = hs.getAttribute('data-position');
    mv.cameraOrbit = theta.toFixed(1) + 'deg 76deg 6.5m';
    mv.fieldOfView = '30deg';
    root.classList.add('is-open');
    hotspots.forEach(function (h) { h.classList.toggle('is-active', h === hs); });
    unzip(key);

    img.src = hs.getAttribute('data-image');
    img.alt = 'Close-up render of the DNA helix unzipping at the ' + hs.getAttribute('data-title') + ' segment';
    title.textContent = hs.getAttribute('data-title');
    blurb.textContent = hs.getAttribute('data-blurb');
    go.href = hs.getAttribute('data-url');
    go.textContent = 'Open ' + hs.getAttribute('data-title') + ' →';
    card.hidden = false;
    img.style.animation = 'none'; void img.offsetWidth; img.style.animation = '';
  }

  function close() {
    card.hidden = true;
    root.classList.remove('is-open');
    hotspots.forEach(function (h) { h.classList.remove('is-active'); });
    mv.cameraTarget = 'auto auto auto';
    mv.cameraOrbit = HOME_ORBIT;
    mv.fieldOfView = 'auto';
    zipClosed(function () { if (!reduceMotion) mv.autoRotate = true; });
  }

  hotspots.forEach(function (h) {
    h.addEventListener('click', function () { select(h.getAttribute('data-key')); });
  });
  back.addEventListener('click', close);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !card.hidden) close();
  });
})();
