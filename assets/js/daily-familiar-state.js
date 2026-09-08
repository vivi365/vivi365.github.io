(function (globalScope, factory) {
  "use strict";

  var api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    globalScope.DailyFamiliarState = api;
  }
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var DEFAULT_TIMEZONE = "Europe/Stockholm";
  var SLEEP_START_MINUTES = 22 * 60 + 30;
  var WAKE_MINUTES = 8 * 60 + 30;

  function validDate(date) {
    return date instanceof Date && Number.isFinite(date.getTime());
  }

  function zonedParts(date, timezone, options) {
    if (!validDate(date)) return {};
    var formatterOptions = Object.assign({
      timeZone: timezone || DEFAULT_TIMEZONE
    }, options);
    var formatter;
    try {
      formatter = new Intl.DateTimeFormat("en", formatterOptions);
    } catch (_) {
      formatterOptions.timeZone = DEFAULT_TIMEZONE;
      formatter = new Intl.DateTimeFormat("en", formatterOptions);
    }
    var values = {};
    formatter.formatToParts(date).forEach(function (part) {
      if (part.type !== "literal") values[part.type] = part.value;
    });
    return values;
  }

  function dateKey(date, timezone) {
    var values = zonedParts(date, timezone, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
    return values.year && values.month && values.day ? values.year + "-" + values.month + "-" + values.day : "";
  }

  function minutesOfDay(date, timezone) {
    var values = zonedParts(date, timezone, {
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
    });
    var hours = Number(values.hour);
    var minutes = Number(values.minute);
    return Number.isFinite(hours) && Number.isFinite(minutes) ? hours * 60 + minutes : null;
  }

  function isSleepTime(date, timezone) {
    var minutes = minutesOfDay(date, timezone);
    return minutes !== null && (minutes >= SLEEP_START_MINUTES || minutes < WAKE_MINUTES);
  }

  function isSleepingAtLocation(location, sleepPetAvailable) {
    return Boolean(sleepPetAvailable && location === "home");
  }

  function parseStoredPosition(rawValue) {
    if (typeof rawValue !== "string" || rawValue.length > 160) return null;
    try {
      var position = JSON.parse(rawValue);
      if (!position || typeof position !== "object" || Array.isArray(position)) return null;
      if (!Number.isFinite(position.left) || !Number.isFinite(position.top)) return null;
      return { left: position.left, top: position.top };
    } catch (_) {
      return null;
    }
  }

  function parseStoredTimestamp(rawValue, now) {
    if (typeof rawValue !== "string" || !/^\d{1,13}$/.test(rawValue)) return null;
    var timestamp = Number(rawValue);
    var currentTime = Number.isFinite(now) ? now : Date.now();
    if (!Number.isSafeInteger(timestamp) || timestamp < 0 || timestamp > currentTime + 5 * 60 * 1000) return null;
    return timestamp;
  }

  function crossedScheduledWake(lastSeenAt, currentDate, timezone) {
    if (!Number.isFinite(lastSeenAt) || !validDate(currentDate) || lastSeenAt >= currentDate.getTime()) return false;
    if (isSleepTime(currentDate, timezone)) return false;
    var currentMinutes = minutesOfDay(currentDate, timezone);
    if (currentMinutes === null || currentMinutes < WAKE_MINUTES) return false;
    var previousDate = new Date(lastSeenAt);
    if (dateKey(previousDate, timezone) !== dateKey(currentDate, timezone)) return true;
    var previousMinutes = minutesOfDay(previousDate, timezone);
    return previousMinutes !== null && previousMinutes < WAKE_MINUTES;
  }

  return {
    dateKey: dateKey,
    isSleepTime: isSleepTime,
    isSleepingAtLocation: isSleepingAtLocation,
    parseStoredPosition: parseStoredPosition,
    parseStoredTimestamp: parseStoredTimestamp,
    crossedScheduledWake: crossedScheduledWake,
    sleepStartMinutes: SLEEP_START_MINUTES,
    wakeMinutes: WAKE_MINUTES
  };
}));
