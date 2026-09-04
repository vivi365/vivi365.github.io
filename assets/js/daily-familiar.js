(function () {
  "use strict";

  var root = document.getElementById("daily-familiar");
  var bank = document.getElementById("daily-familiar-bank");
  if (!root || !bank) return;

  var cfg = bank.querySelector("[data-familiar-config]");
  var homeCfg = bank.querySelector("[data-familiar-home]");
  var pets = Array.prototype.slice.call(bank.querySelectorAll("[data-familiar-pet]"));
  var foods = Array.prototype.slice.call(bank.querySelectorAll("[data-familiar-food]"));
  var home = document.getElementById("daily-familiar-home");
  var homeImage = home && home.querySelector(".daily-familiar-home__image");
  var homeForeground = document.getElementById("daily-familiar-home-foreground");
  var homeForegroundImage = homeForeground && homeForeground.querySelector(".daily-familiar-home-foreground__image");
  var trigger = root.querySelector(".daily-familiar__trigger");
  var picker = root.querySelector(".daily-familiar__picker");
  var image = root.querySelector(".daily-familiar__image");
  var looks = root.querySelector(".daily-familiar__looks");
  var foodToggle = root.querySelector(".daily-familiar__food-toggle");
  var foodToggleIcon = root.querySelector(".daily-familiar__food-toggle-icon");
  var foodTray = root.querySelector(".daily-familiar__food-tray");
  var reaction = root.querySelector(".daily-familiar__reaction");
  var homeAction = root.querySelector(".daily-familiar__home-action");
  var homeActionImage = root.querySelector(".daily-familiar__home-action-image");
  if (!cfg || !homeCfg || !pets.length || foods.length !== 3 || !home || !homeImage || !homeForeground || !homeForegroundImage || !trigger || !picker || !image || !looks || !foodToggle || !foodToggleIcon || !foodTray || !reaction || !homeAction || !homeActionImage) return;

  var store = {
    get: function (key) {
      try { return localStorage.getItem(key); } catch (_) { return null; }
    },
    set: function (key, value) {
      try { localStorage.setItem(key, value); } catch (_) {}
    },
    remove: function (key) {
      try { localStorage.removeItem(key); } catch (_) {}
    }
  };

  function zonedParts(date, options) {
    var formatter = new Intl.DateTimeFormat("en", Object.assign({
      timeZone: cfg.dataset.timezone || "Europe/Stockholm"
    }, options));
    var values = {};
    formatter.formatToParts(date).forEach(function (part) {
      if (part.type !== "literal") values[part.type] = part.value;
    });
    return values;
  }

  function dateKey(date) {
    var values = zonedParts(date, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
    return values.year + "-" + values.month + "-" + values.day;
  }

  function isSleepTime(date) {
    var values = zonedParts(date, {
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
    });
    var minutes = Number(values.hour) * 60 + Number(values.minute);
    return minutes >= 22 * 60 + 30 || minutes < 8 * 60;
  }

  function dateOrdinal(day) {
    var parts = day.split("-").map(Number);
    return Math.floor(Date.UTC(parts[0], parts[1] - 1, parts[2]) / 86400000);
  }

  function hash(value) {
    var result = 2166136261;
    for (var i = 0; i < value.length; i += 1) {
      result ^= value.charCodeAt(i);
      result = Math.imul(result, 16777619);
    }
    return result >>> 0;
  }

  function greatestCommonDivisor(a, b) {
    while (b) {
      var remainder = a % b;
      a = b;
      b = remainder;
    }
    return a;
  }

  function dailyPick(list, day, salt) {
    if (list.length === 1) return list[0];
    var step = (hash(salt + "step") % (list.length - 1)) + 1;
    while (greatestCommonDivisor(step, list.length) !== 1) {
      step = (step % (list.length - 1)) + 1;
    }
    var index = ((dateOrdinal(day) % list.length) * step + (hash(salt + "offset") % list.length)) % list.length;
    return list[index];
  }

  function hasControlCharacters(value) {
    return /[\u0000-\u001f\u007f]/.test(value);
  }

  function safeImageUrl(value) {
    if (!value) return "";
    var candidate = value.trim();
    if (candidate.charAt(0) !== "/" || candidate.slice(0, 2) === "//" || hasControlCharacters(candidate)) return "";
    try {
      var parsed = new URL(candidate, location.origin);
      return parsed.origin === location.origin && (parsed.protocol === "http:" || parsed.protocol === "https:") ? parsed.href : "";
    } catch (_) {
      return "";
    }
  }

  var petBoundsCache = {};
  var activePetImageUrl = "";

  function applyPetBounds(bounds) {
    if (!bounds || !root.offsetWidth || !root.offsetHeight) return;
    var visibleWidth = bounds.right - bounds.left + 1;
    var visibleHeight = bounds.bottom - bounds.top + 1;
    var targetSize = Math.min(root.offsetWidth, root.offsetHeight) * 0.68;
    var scale = targetSize / Math.max(visibleWidth, visibleHeight);
    var centerX = bounds.left + visibleWidth / 2;
    var centerY = bounds.top + visibleHeight / 2;
    image.style.width = Math.round(bounds.canvasWidth * scale) + "px";
    image.style.height = Math.round(bounds.canvasHeight * scale) + "px";
    image.style.left = Math.round(root.offsetWidth / 2 - centerX * scale) + "px";
    image.style.top = Math.round(root.offsetHeight / 2 - centerY * scale) + "px";
  }

  function measurePetBounds(imageUrl) {
    if (image.src !== imageUrl || !image.naturalWidth || !image.naturalHeight) return;
    try {
      var canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      var context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) return;
      context.drawImage(image, 0, 0);
      var pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      var left = canvas.width;
      var top = canvas.height;
      var right = -1;
      var bottom = -1;
      for (var y = 0; y < canvas.height; y += 1) {
        for (var x = 0; x < canvas.width; x += 1) {
          if (pixels[(y * canvas.width + x) * 4 + 3] <= 16) continue;
          if (x < left) left = x;
          if (x > right) right = x;
          if (y < top) top = y;
          if (y > bottom) bottom = y;
        }
      }
      if (right < left || bottom < top) return;
      petBoundsCache[imageUrl] = {
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        left: left,
        top: top,
        right: right,
        bottom: bottom
      };
      if (activePetImageUrl === imageUrl) applyPetBounds(petBoundsCache[imageUrl]);
    } catch (_) {
      image.removeAttribute("style");
    }
  }

  function normalizePetImage(imageUrl) {
    activePetImageUrl = imageUrl;
    if (petBoundsCache[imageUrl]) {
      applyPetBounds(petBoundsCache[imageUrl]);
      return;
    }
    if (image.complete) {
      measurePetBounds(imageUrl);
    } else {
      image.addEventListener("load", function onPetLoad() {
        measurePetBounds(imageUrl);
      }, { once: true });
    }
  }

  function petById(id) {
    for (var i = 0; i < pets.length; i += 1) {
      if (pets[i].dataset.id === id) return pets[i];
    }
    return null;
  }

  var homeUrl = safeImageUrl(homeCfg.dataset.image);
  if (!homeUrl) return;
  homeImage.src = homeUrl;
  homeForegroundImage.src = homeUrl;
  homeActionImage.src = homeUrl;
  homeAction.setAttribute("aria-label", "Send tilde to " + (homeCfg.dataset.label || "her tree home"));

  var day = dateKey(new Date());
  var positionKey = "daily-familiar:position";
  var locationKey = "daily-familiar:location";
  var storedLocation = store.get(locationKey);
  var locationState = storedLocation === "home" || storedLocation === "free" ? storedLocation : (store.get(positionKey) ? "free" : "home");
  var storedPet = petById(store.get("daily-familiar:selected-pet"));
  var hasSelectedPet = Boolean(storedPet);
  var pet = storedPet || dailyPick(pets, day, "pet:");
  var sleepPet = petById("moon");
  var nearHome = false;
  var HOME_ENTER_DISTANCE = 92;
  var HOME_EXIT_DISTANCE = 124;
  var feedingTimer = null;

  function updateLookButtons(activePet) {
    Array.prototype.forEach.call(looks.querySelectorAll("button[data-pet-id]"), function (button) {
      button.setAttribute("aria-pressed", String(button.dataset.petId === activePet.dataset.id));
    });
  }

  function renderPet(nextPet, sleeping) {
    var imageUrl = safeImageUrl(nextPet.dataset.image);
    if (!imageUrl) return false;
    image.src = imageUrl;
    image.hidden = false;
    normalizePetImage(imageUrl);
    root.classList.toggle("daily-familiar--sleeping", sleeping);
    if (sleeping) {
      var sleepMessage = isSleepTime(new Date()) ? "She is sleeping in her tree home until 08:00." : "She is sleeping in her tree home. Drag her away to wake her.";
      trigger.setAttribute("aria-label", "Wake tilde and choose her look. " + sleepMessage);
    } else {
      trigger.setAttribute("aria-label", "Choose tilde's look. Current look: " + (nextPet.dataset.label || nextPet.dataset.id) + ". Drag or use arrow keys to move her.");
    }
    return true;
  }

  function updateSleepState(date) {
    var sleeping = Boolean(sleepPet && picker.hidden && (isSleepTime(date) || locationState === "home"));
    var activePet = sleeping ? sleepPet : pet;
    updateLookButtons(activePet);
    return renderPet(activePet, sleeping);
  }

  function applyPet(nextPet, persist) {
    if (!safeImageUrl(nextPet.dataset.image)) return false;
    pet = nextPet;
    if (persist) {
      hasSelectedPet = true;
      store.set("daily-familiar:selected-pet", pet.dataset.id);
    }
    return updateSleepState(new Date());
  }

  pets.forEach(function (petOption) {
    var imageUrl = safeImageUrl(petOption.dataset.image);
    if (!imageUrl) return;
    var button = document.createElement("button");
    var thumbnail = document.createElement("img");
    button.type = "button";
    button.className = "daily-familiar__look";
    button.dataset.petId = petOption.dataset.id;
    button.setAttribute("aria-label", "Choose " + (petOption.dataset.label || petOption.dataset.id) + " look");
    button.setAttribute("aria-pressed", "false");
    thumbnail.src = imageUrl;
    thumbnail.alt = "";
    thumbnail.loading = "lazy";
    thumbnail.draggable = false;
    button.appendChild(thumbnail);
    button.addEventListener("click", function () {
      applyPet(petOption, true);
    });
    looks.appendChild(button);
  });

  function clearReaction() {
    window.clearTimeout(feedingTimer);
    feedingTimer = null;
    root.classList.remove("daily-familiar--fed");
    while (reaction.firstChild) reaction.removeChild(reaction.firstChild);
  }

  function feed(foodOption) {
    var foodUrl = safeImageUrl(foodOption.dataset.image);
    if (!foodUrl) return;
    clearReaction();
    var foodImage = document.createElement("img");
    foodImage.src = foodUrl;
    foodImage.alt = "";
    foodImage.draggable = false;
    reaction.appendChild(foodImage);
    window.requestAnimationFrame(function () {
      root.classList.add("daily-familiar--fed");
    });
    feedingTimer = window.setTimeout(clearReaction, 1000);
  }

  function toggleFoodTray(open, focusToggle) {
    foodTray.hidden = !open;
    foodToggle.setAttribute("aria-expanded", String(open));
    if (open) {
      var firstFood = foodTray.querySelector("button");
      if (firstFood) firstFood.focus();
    } else if (focusToggle) {
      foodToggle.focus();
    }
  }

  var seenFoodIds = {};
  foods.forEach(function (foodOption, index) {
    var foodId = foodOption.dataset.id;
    var foodUrl = safeImageUrl(foodOption.dataset.image);
    if (!foodId || seenFoodIds[foodId] || !foodUrl) return;
    seenFoodIds[foodId] = true;
    var button = document.createElement("button");
    var thumbnail = document.createElement("img");
    button.type = "button";
    button.className = "daily-familiar__food";
    button.setAttribute("aria-label", "Give tilde " + (foodOption.dataset.label || foodId));
    thumbnail.src = foodUrl;
    thumbnail.alt = "";
    thumbnail.loading = "lazy";
    thumbnail.draggable = false;
    button.appendChild(thumbnail);
    button.addEventListener("click", function () {
      feed(foodOption);
      toggleFoodTray(false, true);
    });
    foodTray.appendChild(button);
    if (index === 0) foodToggleIcon.src = foodUrl;
  });

  if (Object.keys(seenFoodIds).length !== 3) return;

  if (!applyPet(pet, false)) return;

  var dragState = null;
  var suppressClick = false;

  function clamp(value, minimum, maximum) {
    return Math.min(Math.max(value, minimum), Math.max(minimum, maximum));
  }

  function updatePickerDirection() {
    var rect = root.getBoundingClientRect();
    var pickerHeight = picker.hidden ? 56 : picker.offsetHeight;
    root.classList.toggle("daily-familiar--anchor-left", rect.left + rect.width / 2 < window.innerWidth / 2);
    root.classList.toggle("daily-familiar--anchor-below", rect.top < pickerHeight + 16);
  }

  function positionTilde(left, top, persist) {
    var width = root.offsetWidth;
    var height = root.offsetHeight;
    var safeLeft = clamp(left, 8, window.innerWidth - width - 8);
    var safeTop = clamp(top, 8, window.innerHeight - height - 8);
    root.style.left = Math.round(safeLeft) + "px";
    root.style.top = Math.round(safeTop) + "px";
    root.style.right = "auto";
    root.style.bottom = "auto";
    updatePickerDirection();
    if (persist) {
      store.set(positionKey, JSON.stringify({ left: Math.round(safeLeft), top: Math.round(safeTop) }));
    }
  }

  function setLocation(nextLocation, persist) {
    locationState = nextLocation;
    root.classList.toggle("daily-familiar--at-home", locationState === "home");
    homeForeground.classList.toggle("daily-familiar-home-foreground--active", locationState === "home");
    if (persist) store.set(locationKey, locationState);
  }

  function homePosition() {
    var homeRect = home.getBoundingClientRect();
    return {
      left: homeRect.left + homeRect.width * 0.6 - root.offsetWidth / 2,
      top: homeRect.top + homeRect.height * 0.58 - root.offsetHeight / 2
    };
  }

  function homeDistance() {
    var target = homePosition();
    var rect = root.getBoundingClientRect();
    var catCenterX = rect.left + rect.width / 2;
    var catCenterY = rect.top + rect.height / 2;
    var homeCenterX = target.left + root.offsetWidth / 2;
    var homeCenterY = target.top + root.offsetHeight / 2;
    return Math.hypot(catCenterX - homeCenterX, catCenterY - homeCenterY);
  }

  function updateHomeProximity() {
    var distance = homeDistance();
    if (nearHome) {
      if (distance > HOME_EXIT_DISTANCE) nearHome = false;
    } else if (distance <= HOME_ENTER_DISTANCE) {
      nearHome = true;
    }
    root.classList.toggle("daily-familiar--near-home", nearHome);
    home.classList.toggle("daily-familiar-home--ready", nearHome);
    homeForeground.classList.toggle("daily-familiar-home-foreground--active", nearHome || locationState === "home");
    return distance;
  }

  function goHome(persist) {
    var target = homePosition();
    setLocation("home", persist);
    positionTilde(target.left, target.top, persist);
    nearHome = false;
    root.classList.remove("daily-familiar--near-home");
    home.classList.remove("daily-familiar-home--ready");
  }

  function syncTimeState(date) {
    if (isSleepTime(date) && picker.hidden) goHome(true);
    updateSleepState(date);
  }

  function restorePosition() {
    var saved = store.get(positionKey);
    if (!saved) return;
    try {
      var position = JSON.parse(saved);
      if (Number.isFinite(position.left) && Number.isFinite(position.top)) {
        positionTilde(position.left, position.top, false);
      }
    } catch (_) {
      store.remove(positionKey);
    }
  }

  function togglePicker(open, restoreFocus) {
    picker.hidden = !open;
    trigger.setAttribute("aria-expanded", String(open));
    if (!open && !foodTray.hidden) toggleFoodTray(false, false);
    if (open) {
      updateSleepState(new Date());
    } else {
      syncTimeState(new Date());
    }
    if (open) {
      updatePickerDirection();
      var activeLook = looks.querySelector('[aria-pressed="true"]');
      if (activeLook) activeLook.focus();
    }
    if (!open && restoreFocus) trigger.focus();
  }

  homeAction.addEventListener("click", function () {
    goHome(true);
    togglePicker(false, true);
  });

  foodToggle.addEventListener("click", function () {
    toggleFoodTray(foodTray.hidden, false);
  });

  trigger.addEventListener("click", function () {
    if (suppressClick) {
      suppressClick = false;
      return;
    }
    togglePicker(picker.hidden, false);
  });

  trigger.addEventListener("pointerdown", function (event) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (sleepPet && picker.hidden && isSleepTime(new Date())) return;
    var rect = root.getBoundingClientRect();
    dragState = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      left: rect.left,
      top: rect.top,
      moved: false
    };
    root.classList.add("daily-familiar--dragging");
    try { trigger.setPointerCapture(event.pointerId); } catch (_) {}
  });

  trigger.addEventListener("pointermove", function (event) {
    if (!dragState || event.pointerId !== dragState.pointerId) return;
    var deltaX = event.clientX - dragState.startX;
    var deltaY = event.clientY - dragState.startY;
    if (!dragState.moved && Math.hypot(deltaX, deltaY) > 5) dragState.moved = true;
    if (!dragState.moved) return;
    if (locationState === "home") {
      setLocation("free", false);
      updateSleepState(new Date());
    }
    positionTilde(dragState.left + deltaX, dragState.top + deltaY, false);
    updateHomeProximity();
    event.preventDefault();
  });

  function finishDrag(event) {
    if (!dragState || event.pointerId !== dragState.pointerId) return;
    if (dragState.moved) {
      var rect = root.getBoundingClientRect();
      if (nearHome) {
        goHome(true);
      } else {
        setLocation("free", true);
        positionTilde(rect.left, rect.top, true);
      }
      nearHome = false;
      root.classList.remove("daily-familiar--near-home");
      home.classList.remove("daily-familiar-home--ready");
      updateSleepState(new Date());
      suppressClick = true;
    }
    dragState = null;
    root.classList.remove("daily-familiar--dragging");
    try { trigger.releasePointerCapture(event.pointerId); } catch (_) {}
  }

  function cancelDrag(event) {
    if (!dragState || event.pointerId !== dragState.pointerId) return;
    if (dragState.moved) {
      var rect = root.getBoundingClientRect();
      setLocation("free", true);
      positionTilde(rect.left, rect.top, true);
      updateSleepState(new Date());
    }
    nearHome = false;
    root.classList.remove("daily-familiar--near-home");
    home.classList.remove("daily-familiar-home--ready");
    dragState = null;
    root.classList.remove("daily-familiar--dragging");
  }

  trigger.addEventListener("pointerup", finishDrag);
  trigger.addEventListener("pointercancel", cancelDrag);
  trigger.addEventListener("lostpointercapture", cancelDrag);
  trigger.addEventListener("keydown", function (event) {
    var directions = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1]
    };
    var direction = directions[event.key];
    if (!direction) return;
    event.preventDefault();
    if (sleepPet && picker.hidden && isSleepTime(new Date())) return;
    var rect = root.getBoundingClientRect();
    var step = event.shiftKey ? 24 : 10;
    setLocation("free", true);
    positionTilde(rect.left + direction[0] * step, rect.top + direction[1] * step, true);
    updateSleepState(new Date());
  });

  document.addEventListener("pointerdown", function (event) {
    if (!picker.hidden && !root.contains(event.target)) togglePicker(false, false);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;
    if (!foodTray.hidden) {
      toggleFoodTray(false, true);
    } else if (!picker.hidden) {
      togglePicker(false, true);
    }
  });

  var seenToday = store.get("daily-familiar:seen-day") === day;
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!seenToday && !reduceMotion) root.classList.add("daily-familiar--pending");
  home.hidden = false;
  homeForeground.hidden = false;
  root.hidden = false;
  if (petBoundsCache[activePetImageUrl]) applyPetBounds(petBoundsCache[activePetImageUrl]);
  if (locationState === "home") {
    goHome(false);
  } else {
    setLocation("free", false);
    restorePosition();
  }
  syncTimeState(new Date());

  window.addEventListener("resize", function () {
    if (petBoundsCache[activePetImageUrl]) applyPetBounds(petBoundsCache[activePetImageUrl]);
    if (locationState === "home" || (isSleepTime(new Date()) && picker.hidden)) {
      goHome(false);
      return;
    }
    if (!root.style.left || !root.style.top) return;
    var rect = root.getBoundingClientRect();
    positionTilde(rect.left, rect.top, true);
  });

  function scheduleSleepCheck() {
    var now = new Date();
    var delay = 60000 - (now.getSeconds() * 1000 + now.getMilliseconds());
    window.setTimeout(function () {
      var currentDate = new Date();
      var currentDay = dateKey(currentDate);
      if (currentDay !== day) {
        day = currentDay;
        if (!hasSelectedPet) pet = dailyPick(pets, day, "pet:");
      }
      syncTimeState(currentDate);
      scheduleSleepCheck();
    }, delay);
  }

  scheduleSleepCheck();

  if (!seenToday) {
    store.set("daily-familiar:seen-day", day);
    if (!reduceMotion) {
      var entranceDelay = Math.max(0, Math.min(10000, parseInt(cfg.dataset.delayMs, 10) || 0));
      window.setTimeout(function () {
        root.classList.remove("daily-familiar--pending");
        root.classList.add("daily-familiar--entering");
      }, entranceDelay);
    }
  }
}());
