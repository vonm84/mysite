/* Photo galleries: justified layout + click to enlarge. No dependencies.

   Layout: images keep their true proportions — nothing is cropped. Each row is
   scaled to fill the column exactly, so the block reads as one solid shape.
   Rows are balanced (no lonely last row), and heights vary between rows, which
   is what gives it the mosaic feel rather than a uniform grid.

   Lightbox: click/tap a photo to see it full size. Esc or backdrop to close,
   arrow keys or swipe to move through the set. */
(function () {
  'use strict';

  var GAP = 6;          // px, matches the CSS gap
  var PER_ROW = 3;      // target photos per row on a wide screen
  var galleries = Array.prototype.slice.call(document.querySelectorAll('.gallery'));

  /* ---------- justified layout ---------- */

  function rowSizes(n, perRow) {
    var rows = Math.max(1, Math.ceil(n / perRow));
    var base = Math.floor(n / rows), extra = n % rows, out = [];
    for (var i = 0; i < rows; i++) out.push(base + (i < extra ? 1 : 0));
    return out;
  }

  /* Proportions come from the width/height attributes in the markup, so the
     layout is correct before the images have loaded (they are lazy). */
  function ratio(im) {
    var w = parseFloat(im.getAttribute('width')),
        h = parseFloat(im.getAttribute('height'));
    if (w && h) return w / h;
    if (im.naturalWidth) return im.naturalWidth / im.naturalHeight;
    return 1.5;
  }

  function layout(g) {
    var imgs = Array.prototype.slice.call(g.querySelectorAll('img'));
    if (!imgs.length) return;

    var width = g.clientWidth;
    if (!width) return;
    var perRow = width < 420 ? 2 : PER_ROW;
    var sizes = rowSizes(imgs.length, perRow);
    var i = 0;

    sizes.forEach(function (count) {
      var row = imgs.slice(i, i + count);
      i += count;
      var ratios = row.map(ratio);
      var totalRatio = ratios.reduce(function (a, b) { return a + b; }, 0);
      var avail = width - GAP * (count - 1);
      var h = Math.floor(avail / totalRatio);
      var used = 0;
      row.forEach(function (im, n) {
        var w = (n === count - 1) ? (avail - used) : Math.floor(h * ratios[n]);
        used += w;
        im.style.width = w + 'px';
        im.style.height = h + 'px';
      });
    });
    g.classList.add('is-laid-out');
  }

  function layoutAll() { galleries.forEach(layout); }

  if (galleries.length) {
    layoutAll();
    window.addEventListener('load', layoutAll);
    galleries.forEach(function (g) {
      g.querySelectorAll('img').forEach(function (im) {
        if (!im.complete) im.addEventListener('load', function () { layout(g); });
      });
    });
    var t;
    window.addEventListener('resize', function () {
      clearTimeout(t);
      t = setTimeout(layoutAll, 120);
    });
  }

  /* ---------- lightbox ---------- */

  var groups = galleries.map(function (g) {
    return Array.prototype.slice.call(g.querySelectorAll('img'));
  });
  document.querySelectorAll('img.shot').forEach(function (el) { groups.push([el]); });
  if (!groups.length) return;

  var box = document.createElement('div');
  box.className = 'lightbox';
  box.hidden = true;
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.innerHTML =
    '<button class="lb-btn lb-close" aria-label="Close">×</button>' +
    '<button class="lb-btn lb-prev" aria-label="Previous image">‹</button>' +
    '<img alt="">' +
    '<button class="lb-btn lb-next" aria-label="Next image">›</button>';
  document.body.appendChild(box);

  var view = box.querySelector('img'),
      prev = box.querySelector('.lb-prev'),
      next = box.querySelector('.lb-next'),
      group = [], idx = 0, opener = null;

  function show(n) {
    idx = (n + group.length) % group.length;
    view.src = group[idx].src;
    view.alt = group[idx].alt || '';
    prev.hidden = next.hidden = group.length < 2;
  }
  function open(list, n, trigger) {
    group = list; opener = trigger;
    box.hidden = false;
    document.documentElement.style.overflow = 'hidden';
    show(n);
    box.querySelector('.lb-close').focus();
  }
  function close() {
    box.hidden = true;
    view.removeAttribute('src');
    document.documentElement.style.overflow = '';
    if (opener) opener.focus();
  }

  groups.forEach(function (list) {
    list.forEach(function (el, n) {
      el.tabIndex = 0;
      el.setAttribute('role', 'button');
      el.setAttribute('aria-label', (el.alt || 'Photo') + ' — view larger');
      el.addEventListener('click', function () { open(list, n, el); });
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(list, n, el); }
      });
    });
  });

  box.addEventListener('click', function (e) {
    if (e.target === box || e.target.classList.contains('lb-close')) close();
    else if (e.target.classList.contains('lb-prev')) show(idx - 1);
    else if (e.target.classList.contains('lb-next')) show(idx + 1);
  });
  document.addEventListener('keydown', function (e) {
    if (box.hidden) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') show(idx - 1);
    else if (e.key === 'ArrowRight') show(idx + 1);
  });

  var startX = null;
  box.addEventListener('touchstart', function (e) {
    startX = e.changedTouches[0].clientX;
  }, { passive: true });
  box.addEventListener('touchend', function (e) {
    if (startX === null) return;
    var dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 40) show(idx + (dx < 0 ? 1 : -1));
    startX = null;
  }, { passive: true });
})();
