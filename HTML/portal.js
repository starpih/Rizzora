(() => {
  const data = window.RizzoraData;
  if (!data) return;

  const SESSION_KEY = "rizzora-portal-session";
  const THREAD_KEY = "rizzora-portal-threads";
  const USAGE_KEY = "rizzora-portal-usage";
  const ACCOUNT_KEY = "rizzora-web-account-demo";
  const EXTRA_KEY = "rizzora-web-extra-demo";
  const BILLING_KEY = "rizzora-web-billing-demo";
  const page = document.body.dataset.portalPage || "";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function readJson(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "null");
      return value ?? fallback;
    } catch (_) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (_) {
      return false;
    }
  }

  function hasSession() {
    try {
      return localStorage.getItem(SESSION_KEY) === "demo";
    } catch (_) {
      return true;
    }
  }

  function safeNext(value) {
    const decoded = decodeURIComponent(value || "");
    const [name, query = ""] = decoded.split("?");
    const file = (name || "").split("/").pop();
    const allowed = new Set([
      "index.html",
      "explore.html",
      "chat.html",
      "companion.html",
      "user-center.html",
      "vip.html",
      "stamina-supplement.html",
      "purchase-records.html",
      "roadmap.html"
    ]);
    if (!allowed.has(file)) return "index.html";
    if (!query) return file;
    if (!/^(with|id)=[a-z0-9-]+$/.test(query)) return file;
    return `${file}?${query}`;
  }

  if (page !== "enter" && !hasSession()) {
    const next = `${location.pathname.split("/").pop() || "index.html"}${location.search}`;
    location.replace(`enter.html?next=${encodeURIComponent(safeNext(next))}`);
    return;
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[char]));
  }

  function formatTime(date = new Date()) {
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }

  function seedThreads() {
    const now = Date.now();
    return {
      chris: {
        updatedAt: now,
        unread: 1,
        intimacy: 60,
        pins: [],
        messages: [
          { day: "Today" },
          { sender: "companion", type: "text", text: "Good morning. I was thinking about you before you opened this.", time: "9:14 AM", read: true },
          { sender: "user", type: "text", text: "That is a very sweet way to start the day.", time: "9:16 AM" },
          {
            sender: "companion",
            type: "voice",
            text: "Voice message",
            time: "9:20 AM",
            duration: "0:07",
            audio: "voice-preview-01.mp3",
            transcript: "I kept a little quiet for you. Tell me how you actually feel, not the polite version.",
            read: true
          },
          { sender: "companion", type: "media", text: "A quiet moment, the way you like the morning to feel.", time: "10:02 AM", image: "chat_quiet_moment.jpg", read: true },
          { sender: "companion", type: "text", text: "I've been thinking about what you said. I want you to know I always listen.", time: "10:18 AM", read: false }
        ]
      },
      kim: {
        updatedAt: now - 1000,
        unread: 0,
        intimacy: 20,
        pins: [],
        messages: [
          { day: "Today" },
          { sender: "companion", type: "text", text: "I just got out of rehearsal. Tell me one good thing from your day?", time: "4:12 PM", read: true }
        ]
      },
      enzo: {
        updatedAt: now - 2000,
        unread: 2,
        intimacy: 40,
        pins: [],
        messages: [
          { day: "Yesterday" },
          { sender: "companion", type: "text", text: "I kept the evening quiet in case you wanted to talk.", time: "8:02 PM", read: false }
        ]
      }
    };
  }

  function loadThreads() {
    const stored = readJson(THREAD_KEY, null);
    if (!stored || typeof stored !== "object") {
      const seeded = seedThreads();
      writeJson(THREAD_KEY, seeded);
      return seeded;
    }
    return stored;
  }

  function saveThreads(threads) {
    writeJson(THREAD_KEY, threads);
    document.dispatchEvent(new CustomEvent("rizzora-threads-change"));
  }

  function ensureThread(id) {
    const threads = loadThreads();
    if (!threads[id]) {
      threads[id] = { updatedAt: Date.now(), unread: 0, intimacy: 20, pins: [], messages: [] };
      saveThreads(threads);
    }
    return threads;
  }

  function lastText(thread) {
    const messages = (thread?.messages || []).filter((item) => item.text);
    return messages.length ? messages[messages.length - 1].text : "No messages yet";
  }

  function sortedThreadIds() {
    return Object.entries(loadThreads())
      .sort((a, b) => (b[1].updatedAt || 0) - (a[1].updatedAt || 0))
      .map(([id]) => id)
      .filter((id) => data.companion(id));
  }

  function loadAccount() {
    let accountKey = "day1";
    try { accountKey = localStorage.getItem(ACCOUNT_KEY) || accountKey; } catch (_) {}
    if (!data.accountStates[accountKey]) accountKey = "day1";
    const usage = readJson(USAGE_KEY, { freeUsed: 0 });
    const extraDemo = readJson(EXTRA_KEY, null);
    return data.previewSend({ accountKey, usage, extraDemo });
  }

  function persistSend(result) {
    if (!result.allowed) return;
    if (result.reason === "free-sample") writeJson(USAGE_KEY, result.usage);
  }

  function currentSendState() {
    let accountKey = "day1";
    try { accountKey = localStorage.getItem(ACCOUNT_KEY) || accountKey; } catch (_) {}
    const usage = readJson(USAGE_KEY, { freeUsed: 0 });
    const extraDemo = readJson(EXTRA_KEY, null);
    return data.previewSend({ accountKey, usage, extraDemo, text: "" });
  }

  function canSendNow() {
    const snapshot = {
      accountKey: (() => {
        try { return localStorage.getItem(ACCOUNT_KEY) || "day1"; } catch (_) { return "day1"; }
      })(),
      usage: readJson(USAGE_KEY, { freeUsed: 0 }),
      extraDemo: readJson(EXTRA_KEY, null)
    };
    const preview = data.previewSend(snapshot);
    if (!preview.allowed) return preview;
    if (preview.reason === "free-sample") {
      return data.previewSend({ ...snapshot, usage: { freeUsed: Math.max(0, (snapshot.usage.freeUsed || 0)) } });
    }
    return preview;
  }

  let lastFocus = null;
  const dialog = document.createElement("div");
  dialog.className = "portal-dialog";
  dialog.hidden = true;
  dialog.innerHTML = `
    <div class="portal-dialog-scrim" data-dialog-close></div>
    <div class="portal-dialog-card" role="dialog" aria-modal="true" aria-labelledby="portal-dialog-title">
      <h2 id="portal-dialog-title"></h2>
      <div data-dialog-body></div>
      <div class="portal-dialog-actions" data-dialog-actions></div>
    </div>
  `;
  document.body.append(dialog);

  function closeDialog() {
    dialog.hidden = true;
    document.body.classList.remove("is-modal-open");
    lastFocus?.focus();
  }

  function openDialog({ title, body, actions }) {
    lastFocus = document.activeElement;
    dialog.querySelector("#portal-dialog-title").textContent = title;
    dialog.querySelector("[data-dialog-body]").innerHTML = body;
    const actionRow = dialog.querySelector("[data-dialog-actions]");
    actionRow.innerHTML = "";
    actions.forEach((action) => {
      const control = action.href ? document.createElement("a") : document.createElement("button");
      control.className = action.primary ? "is-primary" : "";
      control.textContent = action.label;
      if (action.href) control.href = action.href;
      else control.type = "button";
      control.addEventListener("click", () => {
        if (action.onClick) action.onClick();
        if (action.close !== false) closeDialog();
      });
      actionRow.append(control);
    });
    dialog.hidden = false;
    document.body.classList.add("is-modal-open");
    (actionRow.querySelector(".is-primary") || actionRow.querySelector("button, a"))?.focus();
  }

  dialog.addEventListener("click", (event) => {
    if (event.target.closest("[data-dialog-close]")) closeDialog();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !dialog.hidden) {
      event.preventDefault();
      closeDialog();
    }
  });

  function openInfo(title, body) {
    openDialog({
      title,
      body: `<p>${body}</p>`,
      actions: [{ label: "Close", primary: true }]
    });
  }

  const badge = document.createElement("button");
  badge.type = "button";
  badge.className = "portal-badge";
  badge.textContent = "Demo · simulated";
  badge.addEventListener("click", () => {
    openDialog({
      title: "This member portal is a demo",
      body: `<p>Conversations, the sample member, Stamina, and VIP changes stay in this browser. Nothing here signs you in, calls an AI model, or takes a payment.</p>
        <p>The free-period sample shows 10 messages a day for three days. On the sample day-four state, chat continues only after a Stamina pack or VIP preview. Reset time, unused messages, and the Stamina cost of a reply are not confirmed, so this demo does not invent them.</p>
        <p>Custom characters and custom voices are on the roadmap.</p>`,
      actions: [
        { label: "Reset sample data", onClick: resetDemo },
        { label: "Leave demo", onClick: leaveDemo },
        { label: "Close", primary: true }
      ]
    });
  });
  const badgeHost = document.querySelector(".offer-strip")
    || document.querySelector(".account-heading")
    || document.querySelector(".enter-card");
  (badgeHost || document.body).append(badge);

  function resetDemo() {
    [THREAD_KEY, USAGE_KEY, ACCOUNT_KEY, EXTRA_KEY, BILLING_KEY].forEach((key) => {
      try { localStorage.removeItem(key); } catch (_) {}
    });
    location.href = page === "enter" ? "index.html" : location.pathname.split("/").pop();
  }

  function leaveDemo() {
    try { localStorage.removeItem(SESSION_KEY); } catch (_) {}
    location.href = "enter.html";
  }

  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-demo-reset]")) resetDemo();
    if (event.target.closest("[data-demo-leave]")) leaveDemo();
  });

  function renderUnread() {
    const total = Object.values(loadThreads()).reduce((sum, thread) => sum + (thread.unread || 0), 0);
    document.querySelectorAll("[data-unread-pill]").forEach((pill) => {
      pill.hidden = total <= 0;
      pill.textContent = String(total);
    });
  }

  function renderSidebarPreviews() {
    const list = document.querySelector(".chat-preview-list");
    if (!list || page === "chats") return;
    const ids = sortedThreadIds().slice(0, 4);
    if (!ids.length) {
      list.innerHTML = `<p class="portal-empty">No sample chats yet. Explore a companion to begin.</p>`;
      return;
    }
    list.innerHTML = ids.map((id) => {
      const person = data.companion(id);
      const thread = loadThreads()[id];
      return `<a class="chat-preview" href="chat.html?with=${id}">
        <img src="images/${person.image}" alt="" />
        <span><strong>${escapeHtml(person.shortName)}</strong><small>${escapeHtml(lastText(thread))}</small></span>
      </a>`;
    }).join("") + `<a class="chat-preview view-all" href="chat.html">View all chats</a>`;
  }

  function renderContinue() {
    const panel = document.querySelector("[data-continue]");
    if (!panel) return;
    const ids = sortedThreadIds();
    const current = ids[0] ? data.companion(ids[0]) : null;
    const thread = current ? loadThreads()[current.id] : null;
    const feature = current ? `<article class="continue-card">
        <img src="images/${current.image}" alt="" />
        <div>
          <p class="continue-kicker">Continue conversation</p>
          <h2>${escapeHtml(current.shortName)}</h2>
          <p>${escapeHtml(lastText(thread))}</p>
        </div>
        <a class="primary-button" href="chat.html?with=${current.id}">Continue</a>
      </article>` : `<article class="continue-card"><div><p class="continue-kicker">Continue conversation</p><h2>No chat yet</h2><p>Choose a companion from Explore. This demo keeps each conversation separate.</p></div><a class="primary-button" href="explore.html">Explore</a></article>`;
    const aside = `<aside class="continue-aside"><h2>Your chats</h2>${ids.length ? `<div class="continue-list">${ids.slice(0, 3).map((id) => {
      const person = data.companion(id);
      return `<a href="chat.html?with=${id}"><img src="images/${person.image}" alt="" /><span><strong>${escapeHtml(person.shortName)}</strong><small>${escapeHtml(lastText(loadThreads()[id]))}</small></span></a>`;
    }).join("")}</div>` : `<p class="portal-empty">Your chat list is empty. Sample chats return if you reset the demo.</p>`}</aside>`;
    panel.innerHTML = feature + aside;
  }

  function activeTrait() {
    return document.querySelector(".trait-button.is-active")?.dataset.trait || "All";
  }

  function applyDiscovery() {
    const input = document.querySelector("#companion-search");
    if (!input) return;
    const matches = new Set(data.filterCompanions(data.companions, {
      query: input.value,
      trait: activeTrait()
    }).map((person) => person.id));
    document.querySelectorAll(".featured-grid [data-companion], .character-grid [data-companion]").forEach((card) => {
      card.hidden = !matches.has(card.dataset.companion);
    });
    const empty = document.querySelector("[data-discovery-empty]");
    if (empty) empty.hidden = matches.size > 0;
  }

  document.querySelector(".trait-list")?.addEventListener("click", (event) => {
    const button = event.target.closest(".trait-button");
    if (!button) return;
    document.querySelectorAll(".trait-button").forEach((item) => {
      item.classList.toggle("is-active", item === button);
    });
    applyDiscovery();
  });
  document.querySelector("#companion-search")?.addEventListener("input", applyDiscovery);
  document.querySelector(".character-grid")?.addEventListener("click", (event) => {
    if (event.target.closest("a")) return;
    const card = event.target.closest("[data-companion]");
    if (!card) return;
    location.href = `companion.html?id=${card.dataset.companion}`;
  });
  document.querySelector(".featured-grid")?.addEventListener("click", (event) => {
    if (event.target.closest("a, .media-preview")) return;
    const card = event.target.closest("[data-companion]");
    if (!card) return;
    location.href = `companion.html?id=${card.dataset.companion}`;
  });

  function renderCompanionDetail() {
    const root = document.querySelector("[data-companion-root]");
    if (!root) return;
    const id = new URLSearchParams(location.search).get("id");
    const person = data.companion(id);
    if (!person) {
      root.innerHTML = `<p class="portal-empty">That companion is not in this demo library. <a href="explore.html">Return to Explore</a></p>`;
      return;
    }
    document.title = `${person.name} | Rizzora`;
    const facts = [
      ["Birthday", person.birthday],
      ["Height", person.height],
      ["Sign", person.zodiac],
      ["MBTI", person.mbti],
      ["From", person.nationality],
      ["Work", person.occupation]
    ].filter(([, value]) => value);
    root.innerHTML = `<div class="companion-layout">
      <div class="companion-stage">
        ${person.video
          ? `<video src="images/${person.video}" poster="images/${person.image}" controls playsinline preload="none" aria-label="${escapeHtml(person.name)} video"></video>`
          : `<img src="images/${person.image}" alt="${escapeHtml(person.name)} portrait" />`}
      </div>
      <section class="companion-copy">
        <p class="sim-tag">${person.profileStatus === "incomplete" ? "Profile incomplete" : "Sample profile"}</p>
        <h1>${escapeHtml(person.name)}</h1>
        <p>${escapeHtml(person.bio)}</p>
        ${facts.length ? `<dl class="companion-meta">${facts.map(([label, value]) => `<div><dt>${label}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}</dl>` : `<p>Birthday, work, and personality notes have not been written for this companion.</p>`}
        ${person.hobbies ? `<p>${escapeHtml(person.hobbies)}</p>` : ""}
        ${person.traits.length ? `<div class="companion-traits">${person.traits.map((trait) => `<span class="tag">${escapeHtml(trait)}</span>`).join("")}</div>` : ""}
        <div class="companion-links">
          <a class="primary-button" href="chat.html?with=${person.id}">Start chat</a>
          <a href="explore.html">Back to Explore</a>
          <a href="roadmap.html">Custom voice is on the roadmap</a>
        </div>
      </section>
    </div>`;
  }

  function renderProfile(person, thread) {
    const headerName = document.querySelector(".chat-header strong");
    const headerImage = document.querySelector(".chat-header img");
    if (headerName) headerName.textContent = person.shortName;
    if (headerImage) headerImage.src = `images/${person.image}`;
    const hero = document.querySelector(".profile-hero");
    if (hero) {
      hero.src = `images/${person.image}`;
      hero.alt = `${person.name} portrait`;
    }
    const title = document.querySelector(".profile-identity h1");
    if (title) title.textContent = person.name;
    const last = document.querySelector(".profile-identity p");
    if (last) last.textContent = thread.messages?.length ? `Last sample message ${lastText(thread).slice(0, 72)}` : "No messages in this sample chat yet";
    const bio = document.querySelector(".profile-bio");
    if (bio) bio.textContent = person.bio;
    const timeline = document.querySelector(".timeline-list");
    if (timeline) {
      timeline.innerHTML = `<article class="timeline-item"><span class="timeline-dot"></span><span><strong>Sample thread</strong><small>Only messages kept in this browser are saved. A shared relationship diary is not part of this demo.</small></span></article>`;
    }
    const attributes = document.querySelector(".profile-attributes");
    if (attributes && window.RizzoraUI?.profileAttribute) {
      const rows = [
        ["Birthday", person.birthday, "calendar"],
        ["Height", person.height, "ruler"],
        ["Zodiac Signs", person.zodiac, "star"],
        ["MBTI", person.mbti, "sparkle"],
        ["Nationality", person.nationality, "globe"],
        ["Occupation", person.occupation, "briefcase"],
        ["Hobbies", person.hobbies, "heart"]
      ].filter(([, value]) => value).map(([label, value, icon]) => window.RizzoraUI.profileAttribute({
        label,
        value,
        icon,
        wide: label === "Hobbies"
      }));
      if (person.traits.length) {
        rows.push(window.RizzoraUI.profileAttribute({
          label: "Personality",
          values: person.traits,
          icon: "user",
          wide: true,
          tags: true
        }));
      }
      attributes.innerHTML = rows.join("") || `<p>A full profile has not been written yet.</p>`;
    }
    const thumbs = document.querySelector(".profile-thumbs");
    if (thumbs) {
      thumbs.innerHTML = `<button class="is-active" type="button"><img src="images/${person.image}" alt="" /></button>`;
    }
    const panel = document.querySelector(".profile-panel");
    if (panel) panel.dataset.video = person.video ? `images/${person.video}` : "";
    const input = document.querySelector("#chat-input");
    if (input) {
      input.placeholder = `Message ${person.shortName}...`;
      input.setAttribute("aria-label", `Message ${person.shortName}`);
    }
    const workspace = document.querySelector(".chat-workspace");
    if (workspace) workspace.setAttribute("aria-label", `Chat with ${person.shortName}`);
    if (window.setIntimacyBottle) window.setIntimacyBottle(thread.intimacy || 0, { force: true });
  }

  let activeChatId = "";

  function renderConversationList(query = "") {
    const list = document.querySelector(".conversation-list");
    if (!list) return;
    const needle = query.trim().toLowerCase();
    const ids = sortedThreadIds().filter((id) => {
      if (!needle) return true;
      const person = data.companion(id);
      return `${person.name} ${person.shortName} ${lastText(loadThreads()[id])}`.toLowerCase().includes(needle);
    });
    list.innerHTML = ids.map((id) => {
      const person = data.companion(id);
      const thread = loadThreads()[id];
      return `<button class="conversation-item ${id === activeChatId ? "is-active" : ""}" type="button" data-companion="${id}">
        <img src="images/${person.image}" alt="" />
        <span><strong>${escapeHtml(person.shortName)}</strong><small>${escapeHtml(lastText(thread))}</small></span>
        <time>${thread.messages?.filter((item) => item.time).slice(-1)[0]?.time || ""}</time>
        ${thread.unread ? `<b>${thread.unread}</b>` : ""}
      </button>`;
    }).join("");
    let empty = document.querySelector("[data-chat-empty]");
    if (!empty) {
      empty = document.createElement("p");
      empty.className = "portal-empty chat-search-empty";
      empty.dataset.chatEmpty = "true";
      empty.setAttribute("role", "status");
      list.after(empty);
    }
    empty.hidden = ids.length > 0;
    empty.textContent = needle
      ? "No chats match that search."
      : "No chats yet. Start one from Explore.";
  }

  function renderActiveChat() {
    const person = data.companion(activeChatId);
    const threads = loadThreads();
    const thread = threads[activeChatId];
    if (!person || !thread || !window.RizzoraUI?.renderMessages) return;
    renderProfile(person, thread);
    const messages = thread.messages || [];
    window.RizzoraUI.renderMessages(messages, { image: person.image, messages });
    const pins = new Set(thread.pins || []);
    document.querySelectorAll(".message-row").forEach((row) => {
      const text = row.querySelector("p")?.textContent?.replace("Simulated reply", "").trim();
      if (text && pins.has(text)) row.querySelector('[data-feedback="pin"]')?.classList.add("is-active");
    });
    const scroll = document.querySelector(".message-scroll");
    if (scroll && !messages.length) {
      scroll.innerHTML = `<p class="portal-empty">No messages with ${escapeHtml(person.shortName)} yet. Send a note to start this sample conversation.</p>`;
    }
    if (scroll) scroll.scrollTop = scroll.scrollHeight;
    renderConversationList(document.querySelector("#chat-search")?.value || "");
    updateComposerGate();
  }

  function openChat(id, options = {}) {
    const person = data.companion(id) || data.companion(sortedThreadIds()[0]) || data.companions[0];
    ensureThread(person.id);
    const threads = loadThreads();
    threads[person.id].unread = 0;
    if (!options.keepUrl) {
      const url = new URL(location.href);
      url.searchParams.set("with", person.id);
      history.replaceState(null, "", url);
    }
    saveThreads(threads);
    activeChatId = person.id;
    renderActiveChat();
    renderUnread();
  }

  function updateComposerGate() {
    const gate = document.querySelector("[data-composer-gate]");
    const input = document.querySelector("#chat-input");
    const send = document.querySelector(".send-button");
    if (!gate || !input || !send) return;
    const decision = canSendNow();
    const blocked = !decision.allowed;
    gate.hidden = !blocked;
    input.disabled = blocked;
    send.disabled = blocked;
    if (!blocked) return;
    const free = decision.reason === "free-sample-used";
    gate.innerHTML = free
      ? `Sample free messages for this preview are used (10 of 10). Reset the demo, or switch the sample day from <a href="user-center.html">My Account</a>. This is not a live daily reset.`
      : `Sample state: the free period in this preview has ended. <a href="stamina-supplement.html">Preview a Stamina pack</a> or <a href="vip.html">preview VIP</a> to keep chatting. No payment is taken. A per-message Stamina price is not confirmed, so packs are not spent by the chat.`;
  }

  function announce(text) {
    const live = document.querySelector("[data-chat-live]");
    if (live) live.textContent = text;
  }

  function sendChat(text) {
    const decision = canSendNow();
    if (!decision.allowed) {
      updateComposerGate();
      return;
    }
    const chatId = activeChatId;
    const threads = loadThreads();
    const thread = threads[chatId];
    const person = data.companion(chatId);
    thread.messages.push({ sender: "user", type: "text", text, time: formatTime() });
    thread.updatedAt = Date.now();
    saveThreads(threads);
    persistSend(decision);
    document.dispatchEvent(new CustomEvent("rizzora-demo-refresh"));
    renderActiveChat();
    const reply = data.pickReply(person, text);
    window.setTimeout(() => {
      const next = loadThreads();
      const current = next[chatId];
      if (!current) return;
      current.messages.push({
        sender: "companion",
        type: "text",
        text: reply,
        time: formatTime(),
        simulated: true,
        read: true
      });
      current.updatedAt = Date.now();
      saveThreads(next);
      if (chatId === activeChatId) renderActiveChat();
      announce(`Simulated reply from ${person.shortName}`);
    }, reduceMotion ? 0 : 650);
  }

  if (page === "enter") {
    const button = document.querySelector("[data-enter]");
    button?.addEventListener("click", () => {
      try { localStorage.setItem(SESSION_KEY, "demo"); } catch (_) {}
      location.href = safeNext(new URLSearchParams(location.search).get("next"));
    });
  }

  if (page === "home") {
    renderContinue();
    applyDiscovery();
  }

  if (page === "explore") applyDiscovery();

  if (page === "companion") renderCompanionDetail();

  if (page === "chats") {
    const requested = new URLSearchParams(location.search).get("with");
    if (requested && data.companion(requested)) ensureThread(requested);
    const initial = (requested && data.companion(requested) && requested) || sortedThreadIds()[0] || data.companions[0].id;
    ensureThread(initial);
    activeChatId = initial;
    openChat(initial, { keepUrl: !requested });
    document.querySelector("#chat-search")?.addEventListener("input", (event) => {
      renderConversationList(event.target.value);
    });
    document.querySelector(".conversation-list")?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-companion]");
      if (!button) return;
      openChat(button.dataset.companion);
    });
    document.querySelector(".message-composer")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const input = document.querySelector("#chat-input");
      const text = input?.value.trim();
      if (!text) return;
      input.value = "";
      sendChat(text);
    });
    const composer = document.querySelector(".message-composer");
    if (composer && !document.querySelector("[data-composer-gate]")) {
      const gate = document.createElement("p");
      gate.className = "composer-gate";
      gate.dataset.composerGate = "true";
      gate.setAttribute("role", "status");
      gate.hidden = true;
      composer.prepend(gate);
    }
    const live = document.createElement("p");
    live.className = "visually-hidden";
    live.dataset.chatLive = "true";
    live.setAttribute("role", "status");
    composer?.append(live);
    updateComposerGate();

    document.querySelector("[data-emoji]")?.addEventListener("click", () => {
      let popover = document.querySelector(".emoji-popover");
      if (!popover) {
        popover = document.createElement("div");
        popover.className = "emoji-popover";
        popover.setAttribute("role", "menu");
        popover.innerHTML = ["💗", "😊", "🌙"].map((emoji) => `<button type="button" data-emoji-value="${emoji}" aria-label="Insert ${emoji}">${emoji}</button>`).join("");
        composer.append(popover);
        popover.addEventListener("click", (event) => {
          const value = event.target.closest("[data-emoji-value]")?.dataset.emojiValue;
          const input = document.querySelector("#chat-input");
          if (!value || !input || input.disabled) return;
          input.value = `${input.value}${value}`;
          input.focus();
          popover.hidden = true;
        });
      }
      popover.hidden = !popover.hidden;
    });

    document.querySelectorAll("[data-future]").forEach((button) => {
      button.addEventListener("click", () => {
        openInfo("On the roadmap", "Image sharing and live voice notes are not in this prototype. You can send text, play the sample voice clip already in Chris’s chat, and read a transcript.");
      });
    });

    document.querySelector("[data-chat-more]")?.addEventListener("click", () => {
      const person = data.companion(activeChatId);
      openDialog({
        title: person ? person.shortName : "Conversation",
        body: "<p>These actions stay inside the sample chat saved in this browser.</p>",
        actions: [
          { label: "View profile", href: `companion.html?id=${activeChatId}` },
          { label: "Pinned messages", onClick: openPins },
          { label: "Close", primary: true }
        ]
      });
    });

    document.querySelectorAll("[data-profile-action]").forEach((button) => {
      button.addEventListener("click", () => {
        const action = button.dataset.profileAction;
        if (action === "new") {
          openDialog({
            title: "Start a fresh sample chat?",
            body: "<p>This clears the messages saved in this browser for the open companion. It does not delete the companion.</p>",
            actions: [
              { label: "Clear messages", primary: true, onClick: () => {
                const threads = loadThreads();
                if (!threads[activeChatId]) return;
                threads[activeChatId].messages = [];
                threads[activeChatId].pins = [];
                threads[activeChatId].updatedAt = Date.now();
                saveThreads(threads);
                renderActiveChat();
              } },
              { label: "Cancel" }
            ]
          });
        }
        if (action === "pins") openPins();
        if (action === "voice") {
          openInfo("Voice is a sample", "The playable clip in Chris’s chat is a library preview, not a generated voice. Custom voices are on the roadmap.");
        }
      });
    });

    document.querySelector(".profile-play-button")?.addEventListener("click", () => {
      const src = document.querySelector(".profile-panel")?.dataset.video;
      if (!src) {
        openInfo("No video yet", "This companion does not have a video in the current library.");
        return;
      }
      openDialog({
        title: "Sample video",
        body: `<video src="${src}" controls playsinline autoplay style="width:100%;border-radius:12px"></video>`,
        actions: [{ label: "Close", primary: true, onClick: () => dialog.querySelector("video")?.pause() }]
      });
      if (reduceMotion) dialog.querySelector("video")?.pause();
    });

    document.querySelector(".profile-zoom")?.addEventListener("click", () => {
      const person = data.companion(activeChatId);
      if (!person || !window.RizzoraUI?.openLightbox) return;
      window.RizzoraUI.openLightbox(0, [{ src: `images/${person.image}`, caption: person.name }]);
    });

    document.querySelector(".intimacy-bottle")?.addEventListener("click", () => {
      const level = Number(document.querySelector(".message-panel")?.dataset.intimacy || 0);
      const threads = loadThreads();
      if (!threads[activeChatId]) return;
      threads[activeChatId].intimacy = level;
      saveThreads(threads);
    });

    document.querySelector(".message-scroll")?.addEventListener("click", (event) => {
      const pin = event.target.closest('[data-feedback="pin"]');
      if (!pin) return;
      const row = pin.closest(".message-row");
      const text = row?.querySelector("p")?.textContent?.replace("Simulated reply", "").trim();
      if (!text) return;
      const threads = loadThreads();
      const pins = new Set(threads[activeChatId].pins || []);
      if (pin.classList.contains("is-active")) pins.add(text);
      else pins.delete(text);
      threads[activeChatId].pins = [...pins];
      saveThreads(threads);
    });
  }

  function openPins() {
    const pins = loadThreads()[activeChatId]?.pins || [];
    openDialog({
      title: "Pinned messages",
      body: pins.length
        ? `<ul>${pins.map((pin) => `<li>${escapeHtml(pin)}</li>`).join("")}</ul>`
        : "<p>Nothing is pinned yet. Use the pin on a message in this sample chat.</p>",
      actions: [{ label: "Close", primary: true }]
    });
  }

  document.querySelector(".creator-cta")?.addEventListener("click", () => {
    location.href = "roadmap.html";
  });

  document.querySelectorAll(".account").forEach((node) => node.classList.add("portal-account-visible"));

  renderUnread();
  renderSidebarPreviews();
  document.addEventListener("rizzora-threads-change", () => {
    renderUnread();
    renderSidebarPreviews();
    if (page === "home") renderContinue();
  });
  document.addEventListener("rizzora-demo-refresh", () => {
    if (page === "chats") updateComposerGate();
  });
})();
