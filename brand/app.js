(() => {
  const data = window.RizzoraBrand;
  if (!data) return;

  const KEY = "rizzora-brand-v1";
  const page = document.body.dataset.page || "";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function load() {
    const empty = data.emptyDemo();
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || "null");
      return saved && typeof saved === "object" ? { ...empty, ...saved, threads: saved.threads || {} } : empty;
    } catch (_) {
      return empty;
    }
  }

  function save(state) {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (_) {}
  }

  let state = load();

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[char]));
  }

  function billingState() {
    return {
      membership: state.membership,
      billing: state.billing,
      autoRenew: state.autoRenew,
      freeDay: state.freeDay,
      freeUsed: state.freeUsed,
      monthlyStamina: state.monthlyStamina,
      purchasedStamina: state.purchasedStamina
    };
  }

  function applyBilling(next) {
    Object.assign(state, next);
    save(state);
  }

  const modal = document.createElement("div");
  modal.className = "modal";
  modal.hidden = true;
  modal.innerHTML = `<div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title"><h2 id="modal-title"></h2><div data-modal-body></div><div class="inline-actions" data-modal-actions></div></div>`;
  document.body.append(modal);
  let lastFocus = null;

  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove("is-modal-open");
    lastFocus?.focus();
  }

  function openModal({ title, body, actions }) {
    lastFocus = document.activeElement;
    modal.querySelector("#modal-title").textContent = title;
    modal.querySelector("[data-modal-body]").innerHTML = body;
    const row = modal.querySelector("[data-modal-actions]");
    row.innerHTML = "";
    (actions || [{ label: "Close", close: true }]).forEach((action) => {
      const control = document.createElement("button");
      control.type = "button";
      control.className = action.gold ? "btn-gold" : action.ghost ? "btn-ghost" : "btn";
      control.textContent = action.label;
      control.addEventListener("click", () => {
        if (action.onClick) action.onClick();
        if (action.close !== false) closeModal();
      });
      row.append(control);
    });
    modal.hidden = false;
    (modal.querySelector("[data-auth]") || row.querySelector("button"))?.focus();
  }

  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden) closeModal();
  });

  function signIn(provider) {
    state.session = { provider };
    if (!state.nickname) state.nickname = "Demo member";
    if (!state.avatar) state.avatar = data.avatars[0].id;
    const intent = state.intent;
    state.intent = null;
    save(state);
    if (intent?.type === "chat" && intent.characterId) {
      location.href = `chat.html?with=${encodeURIComponent(intent.characterId)}`;
      return;
    }
    if (intent?.type === "subscribe") {
      location.href = `subscription.html?plan=${encodeURIComponent(intent.plan || "monthly")}&ready=1`;
      return;
    }
    if (page === "chat" || page === "account") location.reload();
    else renderAccountSlot();
    closeModal();
  }

  function openAuth(intent) {
    if (intent) {
      state.intent = intent;
      save(state);
    }
    const who = intent?.characterId ? data.character(intent.characterId)?.shortName : "";
    openModal({
      title: who ? `Say hello to ${who}` : "Demo sign-in",
      body: `<p>This is a simulated sign-in. Google, Facebook, and email are buttons only. Nothing is sent, and there is no password.</p>
        <p class="demo-note">Every demo sign-in on this browser opens the same local preview. The sample inbox is you@example.com and the sample code is 483921. It is shown here, not delivered.</p>
        <div class="stack">
          <button class="btn" type="button" data-auth="google">Continue with Google</button>
          <button class="btn" type="button" data-auth="facebook">Continue with Facebook</button>
          <button class="btn-ghost" type="button" data-auth="email">Continue with demo email</button>
        </div>`,
      actions: [{ label: "Not now", ghost: true }]
    });
    modal.querySelectorAll("[data-auth]").forEach((button) => {
      button.addEventListener("click", () => signIn(button.dataset.auth));
    });
  }

  function avatarUrl() {
    const avatar = data.avatars.find((item) => item.id === state.avatar) || data.avatars[0];
    return data.imageUrl(avatar.image);
  }

  function renderAccountSlot() {
    const slot = document.querySelector("[data-account-slot]");
    if (!slot) return;
    if (!state.session) {
      slot.innerHTML = `<button class="sign-button" type="button" data-open-auth>Sign in</button>`;
      slot.querySelector("[data-open-auth]").addEventListener("click", () => openAuth(null));
      return;
    }
    slot.innerHTML = `<button class="avatar-button" type="button" aria-haspopup="menu" aria-expanded="false" data-avatar-menu>
      <img src="${avatarUrl()}" alt="" />
      <span>${escapeHtml(state.nickname || "Demo member")}</span>
    </button>
    <div class="menu" role="menu" hidden data-account-menu>
      <a href="account.html" role="menuitem">Personal center</a>
      <button type="button" role="menuitem" data-sign-out>Sign out</button>
    </div>`;
    const trigger = slot.querySelector("[data-avatar-menu]");
    const menu = slot.querySelector("[data-account-menu]");
    trigger.addEventListener("click", () => {
      menu.hidden = !menu.hidden;
      trigger.setAttribute("aria-expanded", String(!menu.hidden));
    });
    slot.querySelector("[data-sign-out]").addEventListener("click", () => {
      state.session = null;
      state.intent = null;
      save(state);
      location.href = "index.html";
    });
  }

  document.querySelectorAll("[data-nav]").forEach((link) => {
    if (link.dataset.nav === page) link.setAttribute("aria-current", "page");
  });

  const toggle = document.querySelector(".nav-toggle");
  toggle?.addEventListener("click", () => {
    const header = document.querySelector(".site-header");
    const open = header.classList.toggle("is-nav-open");
    toggle.setAttribute("aria-expanded", String(open));
  });

  document.querySelectorAll("[data-notice]").forEach((button) => {
    button.addEventListener("click", () => {
      const kind = button.dataset.notice;
      openModal({
        title: kind === "app" ? "App download is not live" : "Social profile not linked",
        body: kind === "app"
          ? "<p>App Store and Google Play addresses are not in this repository. This button is a preview notice, not a store listing.</p>"
          : "<p>Instagram, TikTok, and X icons are in the project, but no official profile URLs were provided. This does not open another site.</p>"
      });
    });
  });

  function renderHome() {
    const grid = document.querySelector("[data-featured]");
    if (!grid) return;
    grid.innerHTML = data.characters.filter((person) => person.featured).map((person) => `
      <a class="character-card" href="character.html?id=${person.id}">
        <img src="${data.imageUrl(person.image)}" alt="${escapeHtml(person.name)}" />
        <strong>${escapeHtml(person.name)}</strong>
        <span>${escapeHtml((person.nationality[0] || "Profile incomplete") + (person.professions[0] ? ` · ${person.professions[0]}` : ""))}</span>
      </a>`).join("");
  }

  function selectedFilters() {
    const selected = { nationality: [], personality: [], language: [], profession: [], hobby: [] };
    document.querySelectorAll(".chip[aria-pressed='true']").forEach((chip) => {
      selected[chip.dataset.group]?.push(chip.dataset.tag);
    });
    return selected;
  }

  function renderDiscover() {
    const root = document.querySelector("[data-discover]");
    if (!root) return;
    const groups = [
      ["nationality", "Nationality", "nationality"],
      ["personality", "Personality", "personalities"],
      ["language", "Language", "languages"],
      ["profession", "Profession", "professions"],
      ["hobby", "Hobby", "hobbies"]
    ];
    root.querySelector("[data-filter-groups]").innerHTML = groups.map(([group, label, key]) => `
      <div class="filter-group">
        <p>${label}</p>
        <div class="filter-row">${data.uniqueTags(data.characters, key).map((tag) => `<button class="chip" type="button" data-group="${group}" data-tag="${escapeHtml(tag)}" aria-pressed="false">${escapeHtml(tag)}</button>`).join("")}</div>
      </div>`).join("");
    const apply = () => {
      const matches = data.filterCharacters(data.characters, {
        query: root.querySelector("#character-search").value,
        ...selectedFilters()
      });
      root.querySelector("[data-results]").innerHTML = matches.length
        ? matches.map((person) => `
          <a class="character-card" href="character.html?id=${person.id}">
            <img src="${data.imageUrl(person.image)}" alt="${escapeHtml(person.name)}" />
            <strong>${escapeHtml(person.name)}</strong>
            <span>${escapeHtml(person.profileStatus === "incomplete" ? "Profile not written yet" : person.nationality.join(", "))}</span>
          </a>`).join("")
        : `<p class="empty" role="status">No characters match. Reset the search and tags to see the full library.</p>`;
      root.querySelector("[data-count]").textContent = `${matches.length} shown`;
    };
    root.addEventListener("click", (event) => {
      const chip = event.target.closest(".chip");
      if (chip) {
        chip.setAttribute("aria-pressed", String(chip.getAttribute("aria-pressed") !== "true"));
        apply();
      }
      if (event.target.closest("[data-reset-filters]")) {
        root.querySelector("#character-search").value = "";
        root.querySelectorAll(".chip").forEach((chip) => chip.setAttribute("aria-pressed", "false"));
        apply();
      }
    });
    root.querySelector("#character-search").addEventListener("input", apply);
    apply();
  }

  function renderCharacter() {
    const root = document.querySelector("[data-character]");
    if (!root) return;
    const person = data.character(new URLSearchParams(location.search).get("id"));
    if (!person) {
      root.innerHTML = `<p class="empty">That character is not in this preview. <a href="discover.html">Return to Discover</a></p>`;
      return;
    }
    document.title = `${person.name} | Rizzora`;
    const tags = [...person.personalities, ...person.hobbies, ...person.languages, ...person.professions];
    root.innerHTML = `<article class="profile-hero">
      <img class="portrait" src="${data.imageUrl(person.image)}" alt="${escapeHtml(person.name)}" />
      <div>
        <p class="kicker">${person.profileStatus === "incomplete" ? "Profile incomplete" : "Virtual companion"}</p>
        <h1>${escapeHtml(person.name)}</h1>
        <p class="lede">${escapeHtml(person.bio)}</p>
        <div class="tag-list">${tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("") || "<span class='meta'>No tags have been written.</span>"}</div>
        <div class="inline-actions">
          <button class="btn" type="button" data-greet>Say hello</button>
          <a class="btn-ghost" href="discover.html">Back to Discover</a>
        </div>
        <p class="demo-note">Saying hello opens chat after the demo sign-in. There is no matching step.</p>
      </div>
    </article>`;
    root.querySelector("[data-greet]").addEventListener("click", () => {
      if (!state.session) openAuth({ type: "chat", characterId: person.id });
      else location.href = `chat.html?with=${person.id}`;
    });
  }

  function ensureThread(id) {
    if (!state.threads[id]) state.threads[id] = { messages: [] };
    save(state);
  }

  function staminaLine() {
    const bill = billingState();
    if (bill.membership !== "vip" && bill.freeDay !== "day4") {
      const left = Math.max(0, data.FREE_DAILY_MESSAGES - bill.freeUsed);
      return `Sample · ${left} of ${data.FREE_DAILY_MESSAGES} free text messages · ${bill.freeDay.replace("day", "Day ")} of 3. Monthly Stamina ${bill.monthlyStamina.toLocaleString()} · Purchased ${bill.purchasedStamina.toLocaleString()}.`;
    }
    return `Sample · Monthly Stamina ${bill.monthlyStamina.toLocaleString()} · Purchased ${bill.purchasedStamina.toLocaleString()}. Text spends monthly balance first. The 1-unit cost is illustrative, not a confirmed rate.`;
  }

  let activeId = "";
  let callStatus = "idle";

  function renderMessages(person) {
    const list = document.querySelector("[data-messages]");
    const thread = state.threads[person.id];
    if (!thread.messages.length) {
      list.innerHTML = `<p class="empty">No messages with ${escapeHtml(person.shortName)} yet. Say hello to start this sample conversation.</p>`;
      return;
    }
    list.innerHTML = thread.messages.map((message) => {
      const mine = message.sender === "user";
      const tag = message.simulated ? `<span class="sim-tag">Simulated reply</span>` : "";
      let body = `<p>${tag}${escapeHtml(message.text || "")}</p>`;
      if (message.type === "image") body = `${tag}<img src="${message.image}" alt="Sample photo from the library" />`;
      if (message.type === "voice") body = `${tag}<audio controls preload="none" src="${data.AUDIO_ROOT}${message.audio}"></audio><p>${escapeHtml(message.transcript || "Sample voice")}</p>`;
      return `<article class="bubble ${mine ? "is-user" : "is-companion"}">${body}<time>${escapeHtml(message.time || "")}</time></article>`;
    }).join("");
    list.scrollTop = list.scrollHeight;
  }

  function renderThreadList() {
    const list = document.querySelector("[data-thread-list]");
    const ids = Object.keys(state.threads).filter((id) => data.character(id));
    list.innerHTML = ids.length ? ids.map((id) => {
      const person = data.character(id);
      const last = [...(state.threads[id].messages || [])].reverse().find((message) => message.text || message.type);
      return `<button class="thread ${id === activeId ? "is-active" : ""}" type="button" data-open-thread="${id}">
        <img src="${data.imageUrl(person.image)}" alt="" />
        <span><strong>${escapeHtml(person.shortName)}</strong><small>${escapeHtml(last?.text || last?.type || "No messages yet")}</small></span>
      </button>`;
    }).join("") : `<p class="empty">No conversations yet. <a href="discover.html">Discover characters</a> and say hello.</p>`;
  }

  function renderCall(person) {
    const panel = document.querySelector("[data-call]");
    if (!panel) return;
    const labels = {
      idle: "Sample call has not started. No microphone is used.",
      connected: `Sample call with ${person.shortName} is connected.`,
      muted: "Sample call is muted in this preview.",
      ended: "Sample call ended."
    };
    panel.classList.toggle("is-live", callStatus === "connected" || callStatus === "muted");
    panel.querySelector("[data-call-status]").textContent = labels[callStatus];
    panel.querySelector("[data-call-mute]").textContent = callStatus === "muted" ? "Unmute" : "Mute";
    panel.querySelector("[data-call-mute]").setAttribute("aria-pressed", String(callStatus === "muted"));
  }

  function refuseOrSpend(kind) {
    const result = data.spendIllustrative(billingState(), { kind });
    if (!result.allowed) {
      if (result.channel === "vip-only") {
        openModal({
          title: "Sample VIP unlocks this",
          body: "<p>Text is available without VIP, using free messages or purchased Stamina. Images, voice messages, and the sample call open with the sample VIP state. No file or microphone is requested.</p>",
          actions: [{ label: "View sample plans", onClick: () => { location.href = "subscription.html"; }, close: false }, { label: "Close", ghost: true }]
        });
      } else {
        openModal({
          title: "Sample Stamina is empty",
          body: "<p>This preview has no monthly or purchased Stamina left. A per-message price is not confirmed. The 1-unit spend is only here so monthly balance is used before a purchased pack. Reset time, time zone, and a mid-call cutoff are not defined.</p>",
          actions: [{ label: "Sample Stamina packs", onClick: () => { location.href = "account.html#stamina"; }, close: false }, { label: "Close", ghost: true }]
        });
      }
      return null;
    }
    applyBilling(result.state);
    return result;
  }

  function pushMessage(id, message) {
    ensureThread(id);
    state.threads[id].messages.push({ ...message, time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) });
    save(state);
  }

  function renderChatPage() {
    const root = document.querySelector("[data-chat]");
    if (!root) return;
    if (!state.session) {
      const requested = new URLSearchParams(location.search).get("with");
      openAuth(requested ? { type: "chat", characterId: requested } : { type: "chat" });
      root.innerHTML = `<p class="empty">Chat opens after the demo sign-in. You can close the dialog and come back from Discover.</p>`;
      return;
    }
    const requested = new URLSearchParams(location.search).get("with");
    if (requested && data.character(requested)) ensureThread(requested);
    activeId = (requested && data.character(requested) && requested) || Object.keys(state.threads)[0] || "";
    root.innerHTML = `<div class="layout-2">
      <div data-thread-list></div>
      <section class="panel" data-conversation>
        <p class="empty">Choose a character from Discover and say hello.</p>
      </section>
    </div>`;
    if (!activeId) {
      renderThreadList();
      return;
    }
    showConversation(activeId);
    root.addEventListener("click", (event) => {
      const opener = event.target.closest("[data-open-thread]");
      if (!opener) return;
      const url = new URL(location.href);
      url.searchParams.set("with", opener.dataset.openThread);
      history.pushState(null, "", url);
      showConversation(opener.dataset.openThread);
    });
  }

  function showConversation(id) {
    const person = data.character(id);
    if (!person) return;
    activeId = id;
    callStatus = "idle";
    ensureThread(id);
    const conversation = document.querySelector("[data-conversation]");
    conversation.innerHTML = `
      <h2>${escapeHtml(person.name)}</h2>
      <p class="status" data-stamina-line></p>
      <div class="message-list" data-messages aria-live="polite"></div>
      <div class="call-panel" data-call hidden>
        <div class="call-aura" aria-hidden="true"></div>
        <p data-call-status></p>
        <p class="demo-note">A call rate and a mid-call cutoff are not defined, so connecting spends 1 illustrative unit and the timer does not keep charging. No microphone is opened.</p>
        <div class="inline-actions">
          <button class="btn" type="button" data-call-start>Start sample call</button>
          <button class="btn-ghost" type="button" data-call-mute aria-pressed="false">Mute</button>
          <button class="btn-ghost" type="button" data-call-hangup>Hang up</button>
          <button class="btn-ghost" type="button" data-call-sample>Play sample voice</button>
        </div>
        <audio data-call-audio preload="none" src="${data.AUDIO_ROOT}voice-preview-01.mp3"></audio>
      </div>
      <form class="composer">
        <p class="demo-note">Replies are scripted. Images and voice use files already in the library.</p>
        <div class="tool-row">
          <button class="btn-ghost" type="button" data-send-image>Sample image</button>
          <button class="btn-ghost" type="button" data-send-voice>Sample voice</button>
          <button class="btn-ghost" type="button" data-open-call>Sample call</button>
        </div>
        <div>
          <label class="visually-hidden" for="chat-input">Message ${escapeHtml(person.shortName)}</label>
          <input id="chat-input" name="message" autocomplete="off" placeholder="Message ${escapeHtml(person.shortName)}" />
          <button class="btn" type="submit">Send</button>
        </div>
      </form>`;
    conversation.querySelector("[data-stamina-line]").textContent = staminaLine();
    renderThreadList();
    renderMessages(person);
    const form = conversation.querySelector("form");
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const input = form.querySelector("input");
      const text = input.value.trim();
      if (!text) return;
      const spent = refuseOrSpend("text");
      if (!spent) return;
      input.value = "";
      pushMessage(person.id, { sender: "user", type: "text", text });
      renderMessages(person);
      conversation.querySelector("[data-stamina-line]").textContent = staminaLine();
      window.setTimeout(() => {
        pushMessage(person.id, { sender: "companion", type: "text", text: data.pickReply(person, text), simulated: true });
        if (activeId === person.id) {
          renderMessages(person);
          renderThreadList();
        }
      }, reduceMotion ? 0 : 500);
    });
    conversation.querySelector("[data-send-image]").addEventListener("click", () => {
      const spent = refuseOrSpend("image");
      if (!spent) return;
      pushMessage(person.id, { sender: "user", type: "image", image: data.imageUrl(person.image), text: "Sample image" });
      pushMessage(person.id, { sender: "companion", type: "image", image: data.imageUrl("chat_quiet_moment.jpg"), text: "Sample image", simulated: true });
      renderMessages(person);
      conversation.querySelector("[data-stamina-line]").textContent = staminaLine();
    });
    conversation.querySelector("[data-send-voice]").addEventListener("click", () => {
      const spent = refuseOrSpend("voice");
      if (!spent) return;
      pushMessage(person.id, { sender: "user", type: "voice", audio: "voice-preview-02.mp3", transcript: "A sample voice note from the library, not a recording.", text: "Sample voice" });
      pushMessage(person.id, { sender: "companion", type: "text", text: data.pickReply(person, "voice"), simulated: true });
      renderMessages(person);
      conversation.querySelector("[data-stamina-line]").textContent = staminaLine();
    });
    const call = conversation.querySelector("[data-call]");
    conversation.querySelector("[data-open-call]").addEventListener("click", () => {
      if (state.membership !== "vip") {
        refuseOrSpend("call");
        return;
      }
      call.hidden = false;
      renderCall(person);
    });
    conversation.querySelector("[data-call-start]").addEventListener("click", () => {
      if (callStatus === "connected" || callStatus === "muted") return;
      const spent = refuseOrSpend("call");
      if (!spent) return;
      callStatus = data.nextCall("idle", "start");
      renderCall(person);
      conversation.querySelector("[data-stamina-line]").textContent = staminaLine();
    });
    conversation.querySelector("[data-call-mute]").addEventListener("click", () => {
      callStatus = data.nextCall(callStatus, callStatus === "muted" ? "unmute" : "mute");
      renderCall(person);
    });
    conversation.querySelector("[data-call-hangup]").addEventListener("click", () => {
      callStatus = data.nextCall(callStatus, "hangup");
      conversation.querySelector("[data-call-audio]").pause();
      renderCall(person);
    });
    conversation.querySelector("[data-call-sample]").addEventListener("click", () => {
      const audio = conversation.querySelector("[data-call-audio]");
      if (audio.paused) audio.play().catch(() => {});
      else audio.pause();
    });
  }

  function renderSubscription() {
    const root = document.querySelector("[data-subscription]");
    if (!root) return;
    const params = new URLSearchParams(location.search);
    const requested = params.get("plan");
    if (requested && root.querySelector(`input[value="${requested}"]`)) {
      root.querySelector(`input[value="${requested}"]`).checked = true;
    }
    const status = root.querySelector("[data-plan-status]");
    if (params.get("ready") === "1" && state.session) {
      status.textContent = "Demo sign-in is done. Nothing has been purchased yet. Apply the sample plan when you want the local VIP state.";
    }
    root.querySelector("[data-apply-plan]").addEventListener("click", () => {
      const plan = root.querySelector("input[name='plan']:checked")?.value || "monthly";
      if (!state.session) {
        openAuth({ type: "subscribe", plan });
        return;
      }
      applyBilling(data.grantVip(billingState(), plan));
      state.records.unshift({
        title: `Sample ${plan} VIP`,
        detail: "Illustrative reference offer. No payment was taken.",
        when: new Date().toLocaleString("en-US")
      });
      save(state);
      status.textContent = "Sample VIP state saved in this browser. Monthly Stamina is 60,000. Purchased Stamina was kept. The 7-day trial does not add a separate balance, because that amount is not defined.";
    });
  }

  function renderVibe() {
    const root = document.querySelector("[data-vibe]");
    if (!root) return;
    const view = data.vibeView(state.vibeMode);
    root.innerHTML = `
      <p class="kicker">${view.status}</p>
      <h2>${view.headline}</h2>
      <p>${view.detail}</p>
      <p class="demo-note">${view.lit.length} of ${view.total} stars lit. One profile follows every character. This is not a psychological score.</p>
      <div class="stars">${data.vibeDimensions.map((item) => `<button class="star ${view.lit.includes(item.id) ? "is-lit" : ""}" type="button" data-star="${item.id}" aria-pressed="${view.lit.includes(item.id)}">${item.name}</button>`).join("")}</div>
      <p data-star-copy class="quiet">Choose a star to read its demo explanation.</p>
      <div class="inline-actions">
        <button class="btn-ghost" type="button" data-vibe="analyzing">Analyzing</button>
        <button class="btn-ghost" type="button" data-vibe="lit">Preview a lit sky</button>
      </div>`;
    if (root.dataset.bound === "true") return;
    root.dataset.bound = "true";
    root.addEventListener("click", (event) => {
      const star = event.target.closest("[data-star]");
      if (star) {
        const item = data.vibeDimensions.find((entry) => entry.id === star.dataset.star);
        root.querySelector("[data-star-copy]").textContent = `${item.name}: ${item.explanation}`;
      }
      const mode = event.target.closest("[data-vibe]")?.dataset.vibe;
      if (mode) {
        state.vibeMode = mode;
        save(state);
        renderVibe();
      }
    });
  }

  function renderAccount() {
    const root = document.querySelector("[data-account]");
    if (!root) return;
    if (!state.session) {
      openAuth(null);
      root.innerHTML = `<p class="empty">Personal center opens after the demo sign-in.</p>`;
      return;
    }
    const avatar = data.avatars.find((item) => item.id === state.avatar) || data.avatars[0];
    root.querySelector("[data-nickname]").value = state.nickname || "Demo member";
    root.querySelector("[data-avatar-choices]").innerHTML = data.avatars.map((item) => `
      <label class="avatar-choice"><input type="radio" name="avatar" value="${item.id}" ${item.id === avatar.id ? "checked" : ""} /><img src="${data.imageUrl(item.image)}" alt="${item.label}" /></label>`).join("");
    root.querySelector("[data-membership]").textContent = state.membership === "vip"
      ? `Sample VIP · ${state.billing || "monthly"} · auto-renew ${state.autoRenew ? "on" : "off"}`
      : "Sample free state · not VIP";
    root.querySelector("[data-monthly]").textContent = Number(state.monthlyStamina || 0).toLocaleString();
    root.querySelector("[data-purchased]").textContent = Number(state.purchasedStamina || 0).toLocaleString();
    root.querySelector("[data-free-line]").textContent = state.membership === "vip"
      ? "VIP text uses Stamina. The 3-day free messages are a separate non-VIP allowance."
      : `Free messages ${Math.max(0, data.FREE_DAILY_MESSAGES - (state.freeUsed || 0))} of ${data.FREE_DAILY_MESSAGES} · ${state.freeDay}.`;
    root.querySelector("[data-packs]").innerHTML = data.staminaPacks.map((pack) => `
      <button class="btn-ghost" type="button" data-pack="${pack.id}">${pack.name} · ${pack.price} · ${pack.amount}</button>`).join("");
    root.querySelector("[data-records]").innerHTML = state.records.length
      ? state.records.map((record) => `<article class="balance-line"><span>${escapeHtml(record.title)}<br /><small>${escapeHtml(record.detail)}</small></span><span>${escapeHtml(record.when)}</span></article>`).join("")
      : `<p class="quiet">No sample purchases yet.</p>`;
    renderVibe();
  }

  document.querySelector("[data-save-profile]")?.addEventListener("click", () => {
    const name = document.querySelector("[data-nickname]").value.trim().slice(0, 32);
    state.nickname = name || "Demo member";
    state.avatar = document.querySelector("input[name='avatar']:checked")?.value || state.avatar;
    save(state);
    renderAccountSlot();
    document.querySelector("[data-profile-status]").textContent = "Display name and sample portrait saved in this browser only.";
  });

  document.querySelector("[data-account]")?.addEventListener("click", (event) => {
    const packId = event.target.closest("[data-pack]")?.dataset.pack;
    if (packId) {
      const pack = data.staminaPacks.find((item) => item.id === packId);
      applyBilling(data.buyPack(billingState(), pack.amount));
      state.records.unshift({ title: pack.name, detail: `${pack.price} illustrative pack. Added to purchased Stamina. No payment was taken.`, when: new Date().toLocaleString("en-US") });
      save(state);
      renderAccount();
    }
    const preset = event.target.closest("[data-preset]")?.dataset.preset;
    if (preset) {
      const presets = {
        "free-day1": { membership: "free", billing: null, autoRenew: false, freeDay: "day1", freeUsed: 0, monthlyStamina: 0, purchasedStamina: 0 },
        "free-day4": { membership: "free", billing: null, autoRenew: false, freeDay: "day4", freeUsed: 10, monthlyStamina: 0, purchasedStamina: 0 },
        "free-pack": { membership: "free", billing: null, autoRenew: false, freeDay: "day4", freeUsed: 10, monthlyStamina: 0, purchasedStamina: 500 },
        "vip-full": data.grantVip({ ...billingState(), purchasedStamina: state.purchasedStamina || 0 }, "monthly"),
        "vip-pack": { membership: "vip", billing: "yearly", autoRenew: true, freeDay: "day4", freeUsed: 10, monthlyStamina: 0, purchasedStamina: 200 }
      };
      applyBilling(presets[preset]);
      renderAccount();
    }
  });

  document.querySelector("[data-cancel-renew]")?.addEventListener("click", () => {
    state.autoRenew = !state.autoRenew;
    save(state);
    renderAccount();
    document.querySelector("[data-profile-status]").textContent = state.autoRenew
      ? "Sample auto-renew is on. No real subscription changed."
      : "Sample auto-renew is off. No real subscription changed.";
  });

  document.querySelector("[data-delete-account]")?.addEventListener("click", () => {
    openModal({
      title: "Delete this demo profile?",
      body: "<p>This clears the preview stored in this browser, including chats, Stamina, and the display name. It does not contact a server.</p>",
      actions: [
        { label: "Delete demo data", onClick: () => { localStorage.removeItem(KEY); location.href = "index.html"; } },
        { label: "Keep it", ghost: true }
      ]
    });
  });

  document.querySelector("[data-reset-demo]")?.addEventListener("click", () => {
    const session = state.session;
    state = data.emptyDemo();
    state.session = session;
    save(state);
    renderAccount();
    renderAccountSlot();
  });

  renderAccountSlot();
  if (page === "home") renderHome();
  if (page === "discover") renderDiscover();
  if (page === "character") renderCharacter();
  if (page === "chat") renderChatPage();
  if (page === "subscription") renderSubscription();
  if (page === "account") renderAccount();

  window.addEventListener("popstate", () => {
    if (page === "chat" && state.session) {
      const id = new URLSearchParams(location.search).get("with");
      if (id) showConversation(id);
    }
  });
})();
