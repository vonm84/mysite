/* Click any photo to see it whole. No dependencies.
   Desktop: click, Esc to close, arrow keys to move.
   Mobile: tap, swipe left/right, tap the backdrop to close. */
(function () {
  var groups = [];
  document.querySelectorAll('.gallery').forEach(function (g) {
    groups.push(Array.prototype.slice.call(g.querySelectorAll('img')));
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
