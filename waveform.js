// Pure logic for the Podcast Audiogram Maker.
// No DOM, no browser APIs here — so Node can test it directly.
// The page loads this file with a plain <script> tag; Node loads it via require().
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.Audiogram = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var MAX_CLIP_SECONDS = 60;
  var MAX_BARS = 240;

  // Turn raw PCM samples (Float32Array / number[]) into `barCount` bar heights
  // in the range 0..1, one per waveform bar. Each bar is the peak amplitude of
  // its slice of the audio. Empty input gives all-zero bars.
  function computeBars(samples, barCount) {
    var n = Math.max(1, Math.min(MAX_BARS, Math.floor(barCount) || 0));
    var bars = new Array(n).fill(0);
    if (!samples || samples.length === 0) return bars;
    var perBar = Math.max(1, Math.floor(samples.length / n));
    for (var b = 0; b < n; b++) {
      var start = b * perBar;
      var end = Math.min(samples.length, start + perBar);
      var peak = 0;
      for (var i = start; i < end; i++) {
        var v = Math.abs(samples[i]);
        if (v > peak) peak = v;
      }
      bars[b] = Math.min(1, peak);
    }
    return bars;
  }

  // "0:07", "1:05", "59:59". Negative or non-finite input clamps to 0:00.
  function formatTime(seconds) {
    var s = Math.floor(Number(seconds));
    if (!isFinite(s) || s < 0) s = 0;
    var m = Math.floor(s / 60);
    var r = s % 60;
    return m + ':' + (r < 10 ? '0' : '') + r;
  }

  // Clips longer than the cap are trimmed to the cap; shorter clips unchanged.
  function capDuration(durationSeconds, maxSeconds) {
    var max = (typeof maxSeconds === 'number' && maxSeconds > 0) ? maxSeconds : MAX_CLIP_SECONDS;
    var d = Number(durationSeconds);
    if (!isFinite(d) || d <= 0) return 0;
    return Math.min(d, max);
  }

  // "audiogram-20261125-084000.webm". Pass a Date for deterministic output.
  function exportFilename(when) {
    var d = when instanceof Date ? when : new Date();
    function p(n) { return (n < 10 ? '0' : '') + n; }
    return 'audiogram-' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) +
      '-' + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds()) + '.webm';
  }

  // Progress 0..1 of the playhead across the clip.
  function playheadProgress(elapsedSeconds, clipSeconds) {
    if (!clipSeconds || clipSeconds <= 0) return 0;
    var p = elapsedSeconds / clipSeconds;
    if (p < 0) return 0;
    if (p > 1) return 1;
    return p;
  }

  return {
    MAX_CLIP_SECONDS: MAX_CLIP_SECONDS,
    MAX_BARS: MAX_BARS,
    computeBars: computeBars,
    formatTime: formatTime,
    capDuration: capDuration,
    exportFilename: exportFilename,
    playheadProgress: playheadProgress
  };
});
