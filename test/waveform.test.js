const test = require('node:test');
const assert = require('node:assert/strict');
const A = require('../waveform.js');

test('computeBars: peaks per slice, normalised 0..1', () => {
  // 8 samples, 4 bars: slices [0,0.5], [1,0.25], [0,0], [0.75,0.5]
  const bars = A.computeBars([0, 0.5, 1, 0.25, 0, 0, 0.75, 0.5], 4);
  assert.deepEqual(bars, [0.5, 1, 0, 0.75]);
});

test('computeBars: negative samples use absolute value', () => {
  assert.deepEqual(A.computeBars([-0.8, 0.2], 1), [0.8]);
});

test('computeBars: empty input gives all-zero bars', () => {
  assert.deepEqual(A.computeBars([], 3), [0, 0, 0]);
  assert.deepEqual(A.computeBars(null, 3), [0, 0, 0]);
});

test('computeBars: bar count is clamped to MAX_BARS', () => {
  const bars = A.computeBars(new Array(1000).fill(0.5), 9999);
  assert.equal(bars.length, A.MAX_BARS);
  assert.ok(bars.every((b) => b === 0.5));
});

test('computeBars: a flat tone gives near-flat bars', () => {
  const samples = new Float32Array(44100).map((_, i) => Math.sin(2 * Math.PI * 220 * i / 44100) * 0.9);
  const bars = A.computeBars(samples, 160);
  assert.equal(bars.length, 160);
  assert.ok(bars.every((b) => b > 0.8 && b <= 1), 'flat tone should fill every bar');
});

test('formatTime: mm:ss with zero padding', () => {
  assert.equal(A.formatTime(0), '0:00');
  assert.equal(A.formatTime(7), '0:07');
  assert.equal(A.formatTime(65), '1:05');
  assert.equal(A.formatTime(3599), '59:59');
  assert.equal(A.formatTime(60.9), '1:00'); // floors
});

test('formatTime: bad input clamps to 0:00', () => {
  assert.equal(A.formatTime(-5), '0:00');
  assert.equal(A.formatTime(NaN), '0:00');
  assert.equal(A.formatTime(undefined), '0:00');
});

test('capDuration: clips over 60 s are capped, shorter ones unchanged', () => {
  assert.equal(A.capDuration(120), 60);
  assert.equal(A.capDuration(60), 60);
  assert.equal(A.capDuration(45), 45);
  assert.equal(A.capDuration(0), 0);
  assert.equal(A.capDuration(-3), 0);
});

test('capDuration: custom max is honoured', () => {
  assert.equal(A.capDuration(90, 30), 30);
  assert.equal(A.capDuration(20, 30), 20);
});

test('exportFilename: fixed pattern with date and .webm', () => {
  const name = A.exportFilename(new Date(2026, 10, 25, 8, 40, 5));
  assert.equal(name, 'audiogram-20261125-084005.webm');
  assert.match(A.exportFilename(), /^audiogram-\d{8}-\d{6}\.webm$/);
});

test('playheadProgress: clamps to 0..1', () => {
  assert.equal(A.playheadProgress(30, 60), 0.5);
  assert.equal(A.playheadProgress(0, 60), 0);
  assert.equal(A.playheadProgress(90, 60), 1);
  assert.equal(A.playheadProgress(-5, 60), 0);
  assert.equal(A.playheadProgress(10, 0), 0);
});
