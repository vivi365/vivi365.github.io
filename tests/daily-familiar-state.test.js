"use strict";

var test = require("node:test");
var assert = require("node:assert/strict");
var state = require("../assets/js/daily-familiar-state.js");

var TIMEZONE = "Europe/Stockholm";

test("night schedule starts at 22:30 Stockholm time", function () {
  assert.equal(state.isSleepTime(new Date("2026-09-08T20:29:00Z"), TIMEZONE), false);
  assert.equal(state.isSleepTime(new Date("2026-09-08T20:30:00Z"), TIMEZONE), true);
  assert.equal(state.isSleepTime(new Date("2026-09-08T22:00:00Z"), TIMEZONE), true);
});

test("night schedule ends at 08:30 Stockholm time", function () {
  assert.equal(state.isSleepTime(new Date("2026-09-09T06:29:00Z"), TIMEZONE), true);
  assert.equal(state.isSleepTime(new Date("2026-09-09T06:30:00Z"), TIMEZONE), false);
});

test("crib entry sleeps and crib exit wakes", function () {
  assert.equal(state.isSleepingAtLocation("home", true), true);
  assert.equal(state.isSleepingAtLocation("free", true), false);
  assert.equal(state.isSleepingAtLocation("home", false), false);
});

test("schedule remains DST-aware", function () {
  assert.equal(state.isSleepTime(new Date("2026-01-15T21:30:00Z"), TIMEZONE), true);
  assert.equal(state.isSleepTime(new Date("2026-07-15T20:30:00Z"), TIMEZONE), true);
  assert.equal(state.isSleepTime(new Date("2026-10-25T07:29:00Z"), TIMEZONE), true);
  assert.equal(state.isSleepTime(new Date("2026-10-25T07:30:00Z"), TIMEZONE), false);
});

test("detects that a closed page crossed the scheduled wake boundary", function () {
  var lastSeen = new Date("2026-09-09T05:45:00Z").getTime();
  assert.equal(state.crossedScheduledWake(lastSeen, new Date("2026-09-09T06:30:00Z"), TIMEZONE), true);
  assert.equal(state.crossedScheduledWake(lastSeen, new Date("2026-09-09T06:29:00Z"), TIMEZONE), false);
  assert.equal(state.crossedScheduledWake(new Date("2026-09-08T12:00:00Z").getTime(), new Date("2026-09-09T08:00:00Z"), TIMEZONE), true);
});

test("does not treat ordinary daytime activity as a scheduled wake", function () {
  var lastSeen = new Date("2026-09-09T07:00:00Z").getTime();
  assert.equal(state.crossedScheduledWake(lastSeen, new Date("2026-09-09T08:00:00Z"), TIMEZONE), false);
});

test("validates stored positions without trusting their viewport bounds", function () {
  assert.deepEqual(state.parseStoredPosition('{"left":123,"top":456}'), { left: 123, top: 456 });
  assert.equal(state.parseStoredPosition('{"left":"123","top":456}'), null);
  assert.equal(state.parseStoredPosition('{"left":null,"top":456}'), null);
  assert.equal(state.parseStoredPosition("not json"), null);
  assert.equal(state.parseStoredPosition("[]"), null);
});

test("validates stored timestamps", function () {
  var now = new Date("2026-09-09T12:00:00Z").getTime();
  var valid = String(now - 1000);
  assert.equal(state.parseStoredTimestamp(valid, now), Number(valid));
  assert.equal(state.parseStoredTimestamp("-1", now), null);
  assert.equal(state.parseStoredTimestamp("NaN", now), null);
  assert.equal(state.parseStoredTimestamp(String(now + 10 * 60 * 1000), now), null);
});
