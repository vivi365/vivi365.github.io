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

  function placementFor(rect, bubbleHeight, viewportWidth) {
    return {
      anchorLeft: rect.left + rect.width / 2 < viewportWidth / 2,
      anchorBelow: rect.top < bubbleHeight + 16
    };
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
    displayMs: DISPLAY_MS
  };
}));
