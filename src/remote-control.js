/* remote-control.js — Presenter-side remote control (ntfy.sh relay)
 * Injected into output/index.html by build.cjs
 * CDN dep loaded before this script: qrcodejs
 *
 * Uses ntfy.sh as an HTTP/SSE pub-sub relay so the remote works on any
 * network — including mobile 4G — without WebRTC or TURN servers.
 *
 * Two password-derived topics (SHA-256 hex prefixes):
 *   <base>-s  presenter publishes slide state → mobile subscribes
 *   <base>-r  mobile publishes commands       → presenter subscribes
 */
/* global QRCode, __REMOTE_BASE__ */
(function () {
  'use strict';

  var NTFY = 'https://ntfy.sh';
  var MAX_NOTES = 2000;

  var overlay = document.createElement('div');
  overlay.id = 'rc-overlay';
  overlay.innerHTML =
    '<div id="rc-modal">' +
      '<button id="rc-close-btn" title="Close">&#x2715;</button>' +
      '<div id="rc-modal-title">Remote Control</div>' +
      '<div id="rc-setup-panel">' +
        '<label for="rc-pw-input">Session Password</label>' +
        '<input id="rc-pw-input" type="password" placeholder="Choose a password\u2026" autocomplete="off">' +
        '<div id="rc-setup-error" style="display:none"></div>' +
        '<button id="rc-start-btn">Start Remote Session</button>' +
      '</div>' +
      '<div id="rc-active-panel" style="display:none">' +
        '<div id="rc-status">Waiting for connection\u2026</div>' +
        '<div id="rc-qr-wrap">' +
          '<div id="rc-qr-canvas"></div>' +
          '<button id="rc-url-btn" title="Click to copy">\u2014</button>' +
        '</div>' +
        '<div id="rc-count">0 device(s) connected</div>' +
        '<button id="rc-stop-btn">Stop Session</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(overlay);

  var rcBtn = document.createElement('button');
  rcBtn.id = 'rc-btn';
  rcBtn.title = 'Remote Control';
  rcBtn.textContent = 'Remote';
  document.body.appendChild(rcBtn);

  var slideTopic  = null;
  var remoteTopic = null;
  var cmdSource   = null;
  var notesMap    = {};
  var remoteCount = 0;

  function buildNotesMap() {
    var result = {};
    document.querySelectorAll('.step').forEach(function (step) {
      var walker = document.createTreeWalker(step, NodeFilter.SHOW_COMMENT);
      var node;
      while ((node = walker.nextNode())) {
        var m = node.textContent.match(/\s*SPEAKER NOTES\s*([\s\S]*)/);
        if (m) { result[step.id] = m[1].trim(); break; }
      }
    });
    return result;
  }

  function currentSlideInfo() {
    var steps = Array.from(document.querySelectorAll('.step'));
    var active = document.querySelector('.step.active');
    if (!active) return null;
    var activeIndex = steps.indexOf(active);
    var nextStep = steps[(activeIndex + 1) % steps.length];
    var titleEl = active.querySelector('h1, h2, h3');
    var nextTitleEl = nextStep ? nextStep.querySelector('h1, h2, h3') : null;
    var notes = notesMap[active.id] || '';
    if (notes.length > MAX_NOTES) notes = notes.slice(0, MAX_NOTES) + '\u2026';
    return {
      type:  'slide',
      id:    active.id,
      index: activeIndex + 1,
      total: steps.length,
      title: titleEl ? titleEl.textContent.trim() : '',
      nextTitle: nextTitleEl ? nextTitleEl.textContent.trim() : '',
      notes: notes
    };
  }

  function toTopicIds(password) {
    var data = new TextEncoder().encode('openclaw-rc-v1:' + password);
    return crypto.subtle.digest('SHA-256', data).then(function (buf) {
      var hex = Array.from(new Uint8Array(buf))
        .map(function (b) { return b.toString(16).padStart(2, '0'); })
        .join('');
      var base = 'ocl-' + hex.slice(0, 32);
      return { slide: base + '-s', remote: base + '-r' };
    });
  }

  function publish(topic, data) {
    fetch(NTFY + '/' + topic, {
      method:  'POST',
      headers: { 'Content-Type': 'text/plain' },
      body:    JSON.stringify(data)
    }).catch(function () {});
  }

  function broadcastSlide() {
    if (!slideTopic) return;
    var info = currentSlideInfo();
    if (info) publish(slideTopic, info);
  }

  function setCount(n) {
    remoteCount = n;
    var countEl  = document.getElementById('rc-count');
    var statusEl = document.getElementById('rc-status');
    if (countEl)  countEl.textContent = n + ' device(s) connected';
    if (statusEl) {
      if (n > 0) {
        statusEl.textContent = 'Connected \u2014 ' + n + ' device(s)';
        statusEl.className   = 'rc-connected';
      } else {
        statusEl.textContent = 'Waiting for connection\u2026';
        statusEl.className   = '';
      }
    }
    rcBtn.classList.toggle('rc-active', n > 0);
  }

  function startSession(password) {
    var errorEl = document.getElementById('rc-setup-error');
    errorEl.style.display = 'none';
    document.getElementById('rc-start-btn').disabled = true;

    toTopicIds(password).then(function (topics) {
      slideTopic  = topics.slide;
      remoteTopic = topics.remote;

      if (cmdSource) { cmdSource.close(); cmdSource = null; }

      cmdSource = new EventSource(NTFY + '/' + remoteTopic + '/sse');
      cmdSource.onmessage = function (e) {
        var envelope, data;
        try { envelope = JSON.parse(e.data); } catch (ex) { return; }
        if (!envelope || envelope.event !== 'message') return;
        try { data = JSON.parse(envelope.message); } catch (ex) { return; }
        if (!data || !data.type) return;

        if (data.type === 'request_slide') {
          broadcastSlide();
          if (remoteCount === 0) {
            setCount(1);
            overlay.classList.remove('rc-open');
          }
          return;
        }

        if (data.type === 'cmd') {
          var api = window.impress && window.impress();
          if (!api) return;
          if (data.cmd === 'next') {
            var info = currentSlideInfo();
            if (info && info.index >= info.total && info.nextStepId) api.goto(info.nextStepId);
            else api.next();
          }
          else if (data.cmd === 'prev')              api.prev();
          else if (data.cmd === 'goto' && data.step) api.goto(data.step);
        }
      };

      document.getElementById('rc-setup-panel').style.display = 'none';
      document.getElementById('rc-active-panel').style.display  = 'block';
      document.getElementById('rc-start-btn').disabled = false;

      var remoteBase = (typeof __REMOTE_BASE__ !== 'undefined' && __REMOTE_BASE__)
        ? __REMOTE_BASE__.replace(/\/$/, '')
        : (window.location.origin + window.location.pathname).replace(/\/[^\/]*$/, '');
      var remoteUrl = remoteBase + '/remote.html?pw=' + encodeURIComponent(password);

      var qrEl = document.getElementById('rc-qr-canvas');
      qrEl.innerHTML = '';
      new QRCode(qrEl, {
        text:         remoteUrl,
        width:        160,
        height:       160,
        colorDark:    '#000000',
        colorLight:   '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
      });

      var urlBtn = document.getElementById('rc-url-btn');
      urlBtn.textContent = remoteUrl;
      urlBtn.onclick = function () {
        navigator.clipboard.writeText(remoteUrl).then(function () {
          urlBtn.textContent = 'Copied!';
          setTimeout(function () { urlBtn.textContent = remoteUrl; }, 1600);
        });
      };

      document.addEventListener('impress:stepenter', function () {
        broadcastSlide();
      });
    });
  }

  function stopSession() {
    if (cmdSource) { cmdSource.close(); cmdSource = null; }
    slideTopic = remoteTopic = null;
    setCount(0);
    document.getElementById('rc-setup-panel').style.display = 'block';
    document.getElementById('rc-active-panel').style.display  = 'none';
    rcBtn.classList.remove('rc-active');
  }

  rcBtn.addEventListener('click', function () {
    notesMap = buildNotesMap();
    overlay.classList.add('rc-open');
  });

  document.getElementById('rc-close-btn').addEventListener('click', function () {
    overlay.classList.remove('rc-open');
  });

  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) overlay.classList.remove('rc-open');
  });

  document.getElementById('rc-start-btn').addEventListener('click', function () {
    var pw = document.getElementById('rc-pw-input').value.trim();
    if (!pw) { document.getElementById('rc-pw-input').focus(); return; }
    startSession(pw);
  });

  document.getElementById('rc-pw-input').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') document.getElementById('rc-start-btn').click();
  });

  document.getElementById('rc-stop-btn').addEventListener('click', stopSession);
})();
