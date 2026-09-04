(function () {
  "use strict";

  var root = document.getElementById("daily-familiar");
  var bank = document.getElementById("daily-familiar-bank");
  if (!root || !bank) return;

  var cfg = bank.querySelector("[data-familiar-config]");
  var pets = Array.prototype.slice.call(bank.querySelectorAll("[data-familiar-pet]"));
  var trigger = root.querySelector(".daily-familiar__trigger");
  var picker = root.querySelector(".daily-familiar__picker");
  var image = root.querySelector(".daily-familiar__image");
  var looks = root.querySelector(".daily-familiar__looks");
  if (!cfg || !pets.length || !trigger || !picker || !image || !looks) return;

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

  function petById(id) {
    for (var i = 0; i < pets.length; i += 1) {
      if (pets[i].dataset.id === id) return pets[i];
    }
    return null;
  }

  var day = dateKey(new Date());
  var storedPet = petById(store.get("daily-familiar:selected-pet"));
  var hasSelectedPet = Boolean(storedPet);
  var pet = storedPet || dailyPick(pets, day, "pet:");
  var sleepPet = petById("moon");

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
    root.classList.toggle("daily-familiar--sleeping", sleeping);
    if (sleeping) {
      trigger.setAttribute("aria-label", "Wake tilde and choose her look. She is sleeping until 08:00. Drag or use arrow keys to move her.");
    } else {
      trigger.setAttribute("aria-label", "Choose tilde's look. Current look: " + (nextPet.dataset.label || nextPet.dataset.id) + ". Drag or use arrow keys to move her.");
    }
    return true;
  }

  function updateSleepState(date) {
    var sleeping = Boolean(sleepPet && picker.hidden && isSleepTime(date));
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

  if (!applyPet(pet, false)) return;

  var positionKey = "daily-familiar:position";
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
    updateSleepState(new Date());
    if (open) {
      updatePickerDirection();
      var activeLook = looks.querySelector('[aria-pressed="true"]');
      if (activeLook) activeLook.focus();
    }
    if (!open && restoreFocus) trigger.focus();
  }

  trigger.addEventListener("click", function () {
    if (suppressClick) {
      suppressClick = false;
      return;
    }
    togglePicker(picker.hidden, false);
  });

  trigger.addEventListener("pointerdown", function (event) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
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
    positionTilde(dragState.left + deltaX, dragState.top + deltaY, false);
    event.preventDefault();
  });

  function finishDrag(event) {
    if (!dragState || event.pointerId !== dragState.pointerId) return;
    if (dragState.moved) {
      var rect = root.getBoundingClientRect();
      positionTilde(rect.left, rect.top, true);
      suppressClick = true;
    }
    dragState = null;
    root.classList.remove("daily-familiar--dragging");
    try { trigger.releasePointerCapture(event.pointerId); } catch (_) {}
  }

  trigger.addEventListener("pointerup", finishDrag);
  trigger.addEventListener("pointercancel", finishDrag);
  trigger.addEventListener("lostpointercapture", finishDrag);
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
    var rect = root.getBoundingClientRect();
    var step = event.shiftKey ? 24 : 10;
    positionTilde(rect.left + direction[0] * step, rect.top + direction[1] * step, true);
  });

  document.addEventListener("pointerdown", function (event) {
    if (!picker.hidden && !root.contains(event.target)) togglePicker(false, false);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !picker.hidden) togglePicker(false, true);
  });

  var seenToday = store.get("daily-familiar:seen-day") === day;
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!seenToday && !reduceMotion) root.classList.add("daily-familiar--pending");
  root.hidden = false;
  restorePosition();

  window.addEventListener("resize", function () {
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
      updateSleepState(currentDate);
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
