(function (globalScope, factory) {
  "use strict";

  var api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    globalScope.DailyFamiliarIntroduction = api;
  }
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var DISPLAY_MS = 5000;

  var PLACEMENT_GAP = 12;
  var DEFAULT_SAFE_INSET = 8;

  function clamp(value, minimum, maximum) {
    return Math.min(Math.max(value, minimum), Math.max(minimum, maximum));
  }

  function intersects(first, second) {
    return first.left < second.right && first.right > second.left &&
      first.top < second.bottom && first.bottom > second.top;
  }

  function overlapArea(first, second) {
    if (!intersects(first, second)) return 0;
    return (Math.min(first.right, second.right) - Math.max(first.left, second.left)) *
      (Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top));
  }

  function placementFor(rect, bubbleHeight, viewportWidth) {
    return {
      anchorLeft: rect.left + rect.width / 2 < viewportWidth / 2,
      anchorBelow: rect.top < bubbleHeight + 16
    };
  }

  function bubblePlacement(options) {
    var tilde = options.tilde;
    var crib = options.crib;
    var bubbleWidth = Math.max(0, options.bubbleWidth || 0);
    var bubbleHeight = Math.max(0, options.bubbleHeight || 0);
    var viewportWidth = Math.max(0, options.viewportWidth || 0);
    var viewportHeight = Math.max(0, options.viewportHeight || 0);
    var safeLeft = Math.max(DEFAULT_SAFE_INSET, options.safeLeft || 0);
    var safeRight = Math.max(DEFAULT_SAFE_INSET, options.safeRight || 0);
    var safeTop = Math.max(DEFAULT_SAFE_INSET, options.safeTop || 0);
    var safeBottom = Math.max(DEFAULT_SAFE_INSET, options.safeBottom || 0);
    var obstacles = [tilde, crib].filter(function (item) { return item && item.width >= 0 && item.height >= 0; });
    var composition = obstacles.reduce(function (bounds, item) {
      return {
        left: Math.min(bounds.left, item.left),
        top: Math.min(bounds.top, item.top),
        right: Math.max(bounds.right, item.right),
        bottom: Math.max(bounds.bottom, item.bottom)
      };
    }, { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity });
    var minLeft = safeLeft;
    var maxLeft = Math.max(minLeft, viewportWidth - safeRight - bubbleWidth);
    var minTop = safeTop;
    var maxTop = Math.max(minTop, viewportHeight - safeBottom - bubbleHeight);
    var targetX = tilde ? tilde.left + tilde.width / 2 : viewportWidth / 2;
    var targetY = tilde ? tilde.top + tilde.height / 2 : viewportHeight / 2;
    var candidates = [
      { edge: "top", left: composition.left + (composition.right - composition.left - bubbleWidth) / 2, top: composition.top - PLACEMENT_GAP - bubbleHeight },
      { edge: "bottom", left: composition.left + (composition.right - composition.left - bubbleWidth) / 2, top: composition.bottom + PLACEMENT_GAP },
      { edge: "left", left: composition.left - PLACEMENT_GAP - bubbleWidth, top: targetY - bubbleHeight / 2 },
      { edge: "right", left: composition.right + PLACEMENT_GAP, top: targetY - bubbleHeight / 2 },
      { edge: "top", left: safeLeft, top: safeTop },
      { edge: "top", left: viewportWidth - safeRight - bubbleWidth, top: safeTop },
      { edge: "bottom", left: safeLeft, top: viewportHeight - safeBottom - bubbleHeight },
      { edge: "bottom", left: viewportWidth - safeRight - bubbleWidth, top: viewportHeight - safeBottom - bubbleHeight }
    ];
    var best = null;
    candidates.forEach(function (candidate, index) {
      var left = clamp(candidate.left, minLeft, maxLeft);
      var top = clamp(candidate.top, minTop, maxTop);
      var bubble = { left: left, top: top, right: left + bubbleWidth, bottom: top + bubbleHeight };
      var overlap = obstacles.reduce(function (total, obstacle) { return total + overlapArea(bubble, obstacle); }, 0);
      var distance = Math.abs(left + bubbleWidth / 2 - targetX) + Math.abs(top + bubbleHeight / 2 - targetY);
      var score = overlap * 1000000 + distance;
      if (!best || score < best.score || (score === best.score && index < best.index)) {
        best = { left: left, top: top, edge: candidate.edge, pointerX: clamp(targetX - left, 12, Math.max(12, bubbleWidth - 12)), pointerY: clamp(targetY - top, 12, Math.max(12, bubbleHeight - 12)), score: score, index: index };
      }
    });
    return best;
  }

  function create(options) {
    var bubble = options.bubble;
    var message = options.message;
    var close = options.close;
    var keyboardTarget = options.keyboardTarget;
    var schedule = options.schedule || window.setTimeout.bind(window);
    var cancel = options.cancel || window.clearTimeout.bind(window);
    var onPlacement = options.onPlacement || function () {};
    var timer = null;
    var shown = false;
    var dismissed = false;

    function dismiss() {
      if (!shown || dismissed) return false;
      dismissed = true;
      if (timer !== null) {
        cancel(timer);
        timer = null;
      }
      bubble.hidden = true;
      bubble.setAttribute("aria-hidden", "true");
      return true;
    }

    function show(sleeping) {
      if (shown) return false;
      shown = true;
      message.textContent = sleeping ? "tilde is sleeping. Say hi later." : "Hi, I'm tilde!";
      bubble.hidden = false;
      bubble.removeAttribute("aria-hidden");
      onPlacement();
      timer = schedule(dismiss, DISPLAY_MS);
      return true;
    }

    bubble.addEventListener("click", dismiss);
    close.addEventListener("click", dismiss);
    keyboardTarget.addEventListener("keydown", function (event) {
      if (event.key === "Escape") dismiss();
    });

    return {
      show: show,
      dismiss: dismiss,
      updatePlacement: onPlacement,
      displayMs: DISPLAY_MS
    };
  }

  return {
    create: create,
    placementFor: placementFor,
    bubblePlacement: bubblePlacement,
    displayMs: DISPLAY_MS
  };
}));
