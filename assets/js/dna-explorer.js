// Home page DNA explorer. The helix lies horizontally (along X) and spins about its own
// axis (driven here via model-viewer's `orientation` pitch). Selecting a gold node spins the
// helix so that segment's replication bubble faces the viewer, zooms in, unzips it (baked glTF
// morph animation "unzip_<key>") and shows a card.
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

  // Resting view: fit the camera so the horizontal helix (~11 units long) spans the stage width.
  var HOME_ORBIT = mv.getAttribute('camera-orbit');
  var TAN15 = Math.tan(15 * Math.PI / 180);
  function homeOrbit() {
    var w = mv.clientWidth, h = mv.clientHeight;
    if (!w || !h) return HOME_ORBIT;
    var r = Math.max(5.9 / (TAN15 * (w / h)), 3.4 / TAN15);
    return '0deg 90deg ' + r.toFixed(2) + 'm';
  }
  function fitHome() {
    if (openKey || !card.hidden) return;
    mv.fieldOfView = '30deg';
    mv.cameraOrbit = homeOrbit();
  }
  mv.addEventListener('load', fitHome);
  if (mv.loaded) fitHome();
  window.addEventListener('resize', fitHome);
  var SPIN_DEG_PER_S = 14;
  var OPEN_T = 0.999;          // end of the 1 s unzip clip (stay just short of the loop point)
  var angle = 0;               // current spin of the helix about its own axis (deg)
  var spinning = !reduceMotion;
  var pauseUntil = 0;
  var openKey = null;
  var tweenId = 0, turnId = 0;

  function setAngle(a) {
    angle = ((a % 360) + 360) % 360;
    mv.orientation = '0deg ' + angle.toFixed(2) + 'deg 0deg';
  }

  // continuous spin (paused briefly while the visitor drags, and while a segment is open)
  var last = performance.now();
  (function loop(now) {
    var dt = (now - last) / 1000; last = now;
    if (spinning && now > pauseUntil) setAngle(angle + SPIN_DEG_PER_S * dt);
    requestAnimationFrame(loop);
  })(last);
  mv.addEventListener('camera-change', function (e) {
    if (e.detail && e.detail.source === 'user-interaction') pauseUntil = performance.now() + 2500;
  });

  function ease(p) { return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; }

  // spin the helix (shortest way round) to a target angle
  function turnTo(target, ms) {
    var id = ++turnId, start = angle;
    var delta = ((target - start + 540) % 360) - 180;
    if (reduceMotion) { setAngle(target); return; }
    var t0 = performance.now();
    (function step(now) {
      if (id !== turnId) return;
      var p = Math.min(1, (now - t0) / ms);
      setAngle(start + delta * ease(p));
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }

  // Drive the unzip clip by scrubbing currentTime while paused, so it holds open.
  function scrubTo(target, ms, done) {
    var id = ++tweenId;
    var start = mv.currentTime || 0;
    if (reduceMotion || ms <= 0) { mv.currentTime = target; if (done) done(); return; }
    var t0 = performance.now();
    (function step(now) {
      if (id !== tweenId) return;
      var p = Math.min(1, (now - t0) / ms);
      mv.currentTime = start + (target - start) * ease(p);
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
    var c = hs.getAttribute('data-center').split(/\s+/).map(parseFloat);
    // On wide screens the card sits on the right: aim right of the bubble so it shows on the left.
    var shift = window.innerWidth > 700 ? 2.4 : 0;
    spinning = false;
    turnTo(parseFloat(hs.getAttribute('data-turn')) || 0, 900);
    mv.cameraTarget = (c[0] + shift).toFixed(3) + 'm 0m 0m';
    mv.cameraOrbit = '0deg 90deg 16m';
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
    mv.fieldOfView = '30deg';
    mv.cameraOrbit = homeOrbit();
    zipClosed(function () { spinning = !reduceMotion; });
  }

  hotspots.forEach(function (h) {
    h.addEventListener('click', function () { select(h.getAttribute('data-key')); });
  });
  back.addEventListener('click', close);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !card.hidden) close();
  });
})();
