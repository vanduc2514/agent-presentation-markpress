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
/* global QRCode */
(() => {
  "use strict";

  const NTFY = "https://ntfy.sh";
  const MAX_NOTES = 2000;

  const overlay = Object.assign(document.createElement("div"), {
    id: "rc-overlay",
    innerHTML: `
      <div id="rc-modal">
        <button id="rc-close-btn" title="Close">&#x2715;</button>
        <div id="rc-modal-title">Remote Control</div>
        <div id="rc-setup-panel">
          <label for="rc-pw-input">Session Password</label>
          <input id="rc-pw-input" type="password" placeholder="Choose a password\u2026" autocomplete="off">
          <div id="rc-setup-error" style="display:none"></div>
          <button id="rc-start-btn">Start Remote Session</button>
        </div>
        <div id="rc-active-panel" style="display:none">
          <div id="rc-status">Waiting for connection\u2026</div>
          <div id="rc-qr-wrap">
            <div id="rc-qr-canvas"></div>
            <button id="rc-url-btn" title="Click to copy">\u2014</button>
          </div>
          <div id="rc-count">0 device(s) connected</div>
          <button id="rc-stop-btn">Stop Session</button>
        </div>
      </div>
    `,
  });
  document.body.append(overlay);

  const rcBtn = Object.assign(document.createElement("button"), {
    id: "rc-btn",
    title: "Remote Control",
    textContent: "Remote",
  });
  document.body.append(rcBtn);

  let slideTopic = null;
  let remoteTopic = null;
  let cmdSource = null;
  let notesMap = {};
  let remoteCount = 0;
  let onStepEnter = null;

  const buildNotesMap = () => {
    const result = {};
    document.querySelectorAll(".step").forEach((step) => {
      const walker = document.createTreeWalker(step, NodeFilter.SHOW_COMMENT);
      let node;
      while ((node = walker.nextNode())) {
        const m = node.textContent.match(/\s*SPEAKER NOTES\s*([\s\S]*)/);
        if (m) {
          result[step.id] = m[1].trim();
          break;
        }
      }
    });
    return result;
  }

  const currentSlideInfo = () => {
    const steps = [...document.querySelectorAll(".step")];
    const active = document.querySelector(".step.active");
    if (!active) return null;
    const activeIndex = steps.indexOf(active);
    const nextStep = steps[(activeIndex + 1) % steps.length];
    const titleEl = active.querySelector("h1, h2, h3");
    const nextTitleEl = nextStep?.querySelector("h1, h2, h3") ?? null;
    let notes = notesMap[active.id] || "";
    if (notes.length > MAX_NOTES) notes = notes.slice(0, MAX_NOTES) + "\u2026";
    return {
      type: "slide",
      id: active.id,
      index: activeIndex + 1,
      total: steps.length,
      title: titleEl?.textContent.trim() || "",
      nextTitle: nextTitleEl?.textContent.trim() || "",
      notes,
    };
  }

  const toTopicIds = async (password) => {
    const data = new TextEncoder().encode(`pres-rc-v1:${password}`);
    const buf = await crypto.subtle.digest("SHA-256", data);
    const hex = [...new Uint8Array(buf)]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const base = `ocl-${hex.slice(0, 32)}`;
    return { slide: `${base}-s`, remote: `${base}-r` };
  }

  const publish = (topic, data) => {
    fetch(`${NTFY}/${topic}`, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(data),
    }).catch(() => {});
  };

  const broadcastSlide = () => {
    if (!slideTopic) return;
    const info = currentSlideInfo();
    if (info) publish(slideTopic, info);
  };

  const setCount = (n) => {
    remoteCount = n;
    const countEl = document.getElementById("rc-count");
    const statusEl = document.getElementById("rc-status");
    if (countEl) countEl.textContent = `${n} device(s) connected`;
    if (statusEl) {
      if (n > 0) {
        statusEl.textContent = `Connected \u2014 ${n} device(s)`;
        statusEl.className = "rc-connected";
      } else {
        statusEl.textContent = "Waiting for connection\u2026";
        statusEl.className = "";
      }
    }
    rcBtn.classList.toggle("rc-active", n > 0);
  };

  const startSession = async (password) => {
    document.getElementById("rc-setup-error").style.display = "none";
    document.getElementById("rc-start-btn").disabled = true;

    const topics = await toTopicIds(password);
    slideTopic = topics.slide;
    remoteTopic = topics.remote;

    if (cmdSource) {
      cmdSource.close();
      cmdSource = null;
    }

    cmdSource = new EventSource(`${NTFY}/${remoteTopic}/sse`);
    cmdSource.onmessage = (e) => {
      let envelope, data;
      try {
        envelope = JSON.parse(e.data);
      } catch {
        return;
      }
      if (!envelope || envelope.event !== "message") return;
      try {
        data = JSON.parse(envelope.message);
      } catch {
        return;
      }
      if (!data?.type) return;

      if (data.type === "request_slide") {
        broadcastSlide();
        if (remoteCount === 0) {
          setCount(1);
          overlay.classList.remove("rc-open");
        }
        return;
      }

      if (data.type === "cmd") {
        const api = window.impress?.();
        if (!api) return;
        const steps = [...document.querySelectorAll(".step")];
        const active = document.querySelector(".step.present, .step.active");
        const idx = active ? steps.indexOf(active) : -1;
        if (data.cmd === "next" && idx >= 0 && idx < steps.length - 1) {
          api.goto(steps[idx + 1].id);
        } else if (data.cmd === "prev" && idx > 0) {
          api.goto(steps[idx - 1].id);
        } else if (data.cmd === "goto" && data.step) {
          api.goto(data.step);
        }
        // Fallback broadcast in case impress:stepenter event didn't fire
        setTimeout(broadcastSlide, 250);
      }
    };

    document.getElementById("rc-setup-panel").style.display = "none";
    document.getElementById("rc-active-panel").style.display = "block";
    document.getElementById("rc-start-btn").disabled = false;

    const remoteUrl = new URL(
      `./remote.html?pw=${encodeURIComponent(password)}`,
      window.location.href,
    ).href;

    const qrEl = document.getElementById("rc-qr-canvas");
    qrEl.innerHTML = "";
    new QRCode(qrEl, {
      text: remoteUrl,
      width: 160,
      height: 160,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.M,
    });

    const urlBtn = document.getElementById("rc-url-btn");
    urlBtn.textContent = remoteUrl;
    urlBtn.onclick = () => {
      navigator.clipboard.writeText(remoteUrl).then(() => {
        urlBtn.textContent = "Copied!";
        setTimeout(() => {
          urlBtn.textContent = remoteUrl;
        }, 1600);
      });
    };

    if (onStepEnter)
      document.removeEventListener("impress:stepenter", onStepEnter);
    onStepEnter = () => {
      broadcastSlide();
    };
    document.addEventListener("impress:stepenter", onStepEnter);
  }

  const stopSession = () => {
    cmdSource?.close();
    cmdSource = null;
    if (onStepEnter) {
      document.removeEventListener("impress:stepenter", onStepEnter);
      onStepEnter = null;
    }
    slideTopic = remoteTopic = null;
    setCount(0);
    document.getElementById("rc-setup-panel").style.display = "block";
    document.getElementById("rc-active-panel").style.display = "none";
    rcBtn.classList.remove("rc-active");
  };

  rcBtn.addEventListener("click", () => {
    notesMap = buildNotesMap();
    overlay.classList.add("rc-open");
  });

  document.getElementById("rc-close-btn").addEventListener("click", () => {
    overlay.classList.remove("rc-open");
  });

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.classList.remove("rc-open");
  });

  document.getElementById("rc-start-btn").addEventListener("click", () => {
    const pw = document.getElementById("rc-pw-input").value.trim();
    if (!pw) {
      document.getElementById("rc-pw-input").focus();
      return;
    }
    startSession(pw);
  });

  document.getElementById("rc-pw-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") document.getElementById("rc-start-btn").click();
  });

  document.getElementById("rc-stop-btn").addEventListener("click", stopSession);
})();
