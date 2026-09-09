"use strict";

var test = require("node:test");
var assert = require("node:assert/strict");
var introduction = require("../assets/js/daily-familiar-introduction.js");

function element() {
  var listeners = {};
  return {
    hidden: true,
    textContent: "",
    attributes: {},
    addEventListener: function (type, listener) { listeners[type] = listener; },
    dispatch: function (type, event) { listeners[type](event || {}); },
    setAttribute: function (name, value) { this.attributes[name] = value; },
    removeAttribute: function (name) { delete this.attributes[name]; }
  };
}

function controller() {
  var bubble = element();
  var message = element();
  var close = element();
  var keyboard = element();
  var scheduled = null;
  var api = introduction.create({
    bubble: bubble,
    message: message,
    close: close,
    keyboardTarget: keyboard,
    schedule: function (callback, delay) { scheduled = { callback: callback, delay: delay }; return scheduled; },
    cancel: function () { scheduled = null; }
  });
  return { api: api, bubble: bubble, message: message, close: close, keyboard: keyboard, timer: function () { return scheduled; } };
}

test("shows one text-safe startup greeting and auto-dismisses after five seconds", function () {
  var fixture = controller();
  assert.equal(fixture.api.show(false), true);
  assert.equal(fixture.bubble.hidden, false);
  assert.equal(fixture.message.textContent, "Hi, I'm tilde!");
  assert.equal(fixture.timer().delay, 5000);
  fixture.timer().callback();
  assert.equal(fixture.bubble.hidden, true);
});

test("click, close control, and Escape each dismiss the greeting", function () {
  ["click", "close", "escape"].forEach(function (method) {
    var fixture = controller();
    fixture.api.show(false);
    if (method === "click") fixture.bubble.dispatch("click");
    if (method === "close") fixture.close.dispatch("click");
    if (method === "escape") fixture.keyboard.dispatch("keydown", { key: "Escape" });
    assert.equal(fixture.bubble.hidden, true, method);
  });
});

test("does not reappear during same-page interactions", function () {
  var fixture = controller();
  fixture.api.show(false);
  fixture.api.dismiss();
  assert.equal(fixture.api.show(false), false);
  assert.equal(fixture.bubble.hidden, true);
});

test("uses a quiet greeting without changing a sleeping cat", function () {
  var fixture = controller();
  fixture.api.show(true);
  assert.equal(fixture.message.textContent, "tilde is sleeping. Say hi later.");
});

test("flips the speech bubble away from narrow viewport edges", function () {
  assert.deepEqual(introduction.placementFor({ left: 8, width: 100, top: 20 }, 64, 390), { anchorLeft: true, anchorBelow: true });
  assert.deepEqual(introduction.placementFor({ left: 900, width: 100, top: 300 }, 64, 1200), { anchorLeft: false, anchorBelow: false });
});
