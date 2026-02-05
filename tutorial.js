js

(() => {
  // ===== Configure your tutorial here =====
  const BASE_PATH = "./assets/tutorial/";
  const PREFIX = "tut_";
  const EXT = ".png";

  // If you know how many images you have, set it here (recommended).
  // Example: tut_1.png ... tut_12.png  => 12
  const TUT_COUNT = null; // e.g. 12, or leave null to auto-probe (slightly slower)

  const imgEl = document.getElementById("tutImg");
  const frameEl = document.getElementById("tutorialFrame");
  const prevBtn = document.getElementById("tutPrev");
  const nextBtn = document.getElementById("tutNext");
  const counterEl = document.getElementById("tutCounter");
  const dotsEl = document.getElementById("tutDots");

  if (!imgEl || !frameEl || !prevBtn || !nextBtn || !counterEl) return;

  let index = 1;
  let maxIndex = TUT_COUNT; // may stay null if auto-probing

  function srcFor(i){
    return `${BASE_PATH}${PREFIX}${i}${EXT}`;
  }

  function clampIndex(i){
    if (maxIndex != null) {
      if (i < 1) i = 1;
      if (i > maxIndex) i = maxIndex;
      return i;
    }
    // If unknown, allow moving forward; actual load will decide.
    if (i < 1) i = 1;
    return i;
  }

  function renderDots(){
    dotsEl.innerHTML = "";
    if (maxIndex == null) return; // hide dots if we don't know total
    const count = Math.min(maxIndex, 24); // keep it sane if you have tons
    for (let i = 1; i <= count; i++){
      const d = document.createElement("span");
      d.className = "tutorial-dot" + (i === index ? " is-active" : "");
      dotsEl.appendChild(d);
    }
  }

  function renderCounter(){
    counterEl.textContent = maxIndex == null ? `${index} / ?` : `${index} / ${maxIndex}`;
  }

  function setImage(i){
    i = clampIndex(i);

    // Preload the candidate
    const test = new Image();
    test.onload = () => {
      index = i;
      imgEl.src = test.src;
      imgEl.alt = `Tutorial page ${index}`;
      renderCounter();
      renderDots();
    };
    test.onerror = () => {
      // If we were auto-probing and next image doesn't exist, lock maxIndex.
      if (maxIndex == null && i > index) {
        maxIndex = index; // we just discovered the end
        renderCounter();
        renderDots();
      }
      // Otherwise ignore (don’t move).
    };
    test.src = srcFor(i);
  }

  function next(){ setImage(index + 1); }
  function prev(){ setImage(index - 1); }

  // Buttons
  prevBtn.addEventListener("click", prev);
  nextBtn.addEventListener("click", next);

  // Click/tap left/right side of image/frame
  frameEl.addEventListener("click", (e) => {
    // Avoid double-trigger when clicking the buttons
    const target = e.target;
    if (target === prevBtn || target === nextBtn) return;

    const rect = frameEl.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const isLeft = x < rect.width / 2;
    if (isLeft) prev();
    else next();
  });

  // Keyboard arrows (when user is on the page)
  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") prev();
    if (e.key === "ArrowRight") next();
  });

  // Swipe support
  let touchStartX = null;
  let touchStartY = null;

  frameEl.addEventListener("touchstart", (e) => {
    if (!e.touches || e.touches.length !== 1) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  frameEl.addEventListener("touchend", (e) => {
    if (touchStartX == null || touchStartY == null) return;
    const t = (e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0] : null;
    if (!t) return;

    const dx = t.clientX - touchStartX;
    const dy = t.clientY - touchStartY;

    // Horizontal swipe threshold; ignore if mostly vertical (so scrolling still works)
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      if (dx < 0) next();
      else prev();
    }

    touchStartX = null;
    touchStartY = null;
  }, { passive: true });

  // If auto-probing, try to discover total quickly (optional)
  async function probeMax(limit = 60){
    // tries 1..limit until failure
    for (let i = 1; i <= limit; i++){
      // eslint-disable-next-line no-await-in-loop
      const ok = await new Promise((resolve) => {
        const im = new Image();
        im.onload = () => resolve(true);
        im.onerror = () => resolve(false);
        im.src = srcFor(i);
      });
      if (!ok) return i - 1;
    }
    return limit;
  }

  (async () => {
    if (maxIndex == null) {
      const found = await probeMax(80); // bump if you have more than 80
      if (found >= 1) maxIndex = found;
    }
    renderCounter();
    renderDots();
    setImage(1);
  })();
})();