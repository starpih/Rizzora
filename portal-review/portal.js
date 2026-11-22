const characters = window.RizzoraCharacters;

const dialog = document.querySelector("#portal-dialog");
const dialogContent = document.querySelector("#dialog-content");
const mainNav = document.querySelector("#site-nav");
const menuButton = document.querySelector(".menu-button");
let signedIn = false;
let unreadCount = 0;
let selectedCharacter = characters[0];
let pendingChat = false;
let returnFocus = null;

const icon = (name) => `<img class="icon" src="assets/${name}.svg" alt="">`;
const featuredVideos = {
  chris: "assets/featured-previews/chris.mp4",
  kim: "assets/featured-previews/kim.mp4",
  enzo: "assets/featured-previews/enzo.mp4",
  julian: "assets/featured-previews/julian.mp4",
};

function characterCard(character, discovery = false) {
  const action = `data-profile="${character.id}"`;
  const preview = !discovery && featuredVideos[character.id];
  return `<article class="companion-card">
    ${preview ? `<div class="portrait-preview" data-character-preview="${character.id}">` : ""}
    <button type="button" class="portrait-link" ${action} aria-label="${discovery ? "Say hello to" : "Discover"} ${character.name}">
      <img src="${character.image}" alt="${character.name}, a virtual AI companion" loading="lazy">
      ${preview ? `<video class="portrait-video" data-src="${preview}" poster="${character.image}" preload="none" playsinline loop aria-hidden="true"></video>` : '<span class="portrait-badge">AI companion</span>'}
      <span class="portrait-arrow">${icon("external")}</span>
    </button>
    ${preview ? `<button class="preview-sound" type="button" data-preview-sound aria-label="Mute preview" title="Mute preview" aria-pressed="true">${icon("volume")}</button></div>` : ""}
    <div class="companion-caption"><h3>${character.name}</h3><p>${character.summary}</p><div class="companion-traits">${character.traits.map((trait) => `<span>${trait}</span>`).join("")}</div>
    ${discovery ? `<button class="inline-link" type="button" data-chat="${character.id}">Say hello ${icon("arrow")}</button>` : ""}</div>
  </article>`;
}

// Legacy featured cards may still be used by other portal layouts.
const featuredCharacters = document.querySelector("#featured-characters");
if (featuredCharacters) featuredCharacters.innerHTML = characters.map((c) => characterCard(c)).join("");

function initChatPreview() {
  const preview = document.querySelector(".chat-preview");
  if (!preview) return;
  const replies = {
    tired: "Then you don't have to start from the beginning. Would you like to vent, or talk about something light first?",
    happy: "I'd love to hear it. What happened? We can celebrate the little things, too.",
    casual: "Of course. No big topic needed. What's one small thing that made you smile today?",
  };
  const conversation = preview.querySelector("#chat-preview-conversation");
  const options = [...preview.querySelectorAll("[data-chat-preview]")];
  options.forEach((button) => button.addEventListener("click", () => {
    options.forEach((option) => option.setAttribute("aria-pressed", String(option === button)));
    const messages = [["You", button.textContent], ["AI companion · sample", replies[button.dataset.chatPreview]]];
    conversation.replaceChildren(...messages.map(([speaker, text], index) => {
      const bubble = document.createElement("p");
      bubble.className = `chat-preview-bubble${index === 0 ? " chat-preview-bubble-user" : ""}`;
      const label = document.createElement("span");
      label.className = "chat-preview-speaker";
      label.textContent = speaker;
      bubble.append(label, document.createTextNode(text));
      return bubble;
    }));
  }));
}
initChatPreview();

const filterFields = {
  nationality: (c) => [c.nationality],
  personality: (c) => c.traits,
  language: (c) => [c.language],
  profession: (c) => [c.profession],
  interest: (c) => c.interests,
};
for (const [key, getValues] of Object.entries(filterFields)) {
  const select = document.querySelector(`#filter-${key}`);
  const values = [...new Set(characters.flatMap(getValues))].sort();
  values.forEach((value) => select.add(new Option(value, value)));
  select.addEventListener("change", renderDiscovery);
}

function renderDiscovery() {
  const search = document.querySelector("#character-search").value.trim().toLowerCase();
  const matches = characters.filter((character) => {
    const searchable = [character.name, character.summary, character.nationality, character.profession, ...character.traits, ...character.interests].join(" ").toLowerCase();
    return (!search || searchable.includes(search)) && Object.entries(filterFields).every(([key, getValues]) => {
      const selection = document.querySelector(`#filter-${key}`).value;
      return !selection || getValues(character).includes(selection);
    });
  });
  document.querySelector("#discover-characters").innerHTML = matches.map((c) => characterCard(c, true)).join("");
  document.querySelector("#result-count").textContent = `${matches.length} ${matches.length === 1 ? "companion" : "companions"}`;
  document.querySelector("#empty-results").hidden = matches.length > 0;
}
document.querySelector("#character-search").addEventListener("input", renderDiscovery);
document.querySelector("#reset-filters").addEventListener("click", () => {
  document.querySelector("#character-search").value = "";
  Object.keys(filterFields).forEach((key) => { document.querySelector(`#filter-${key}`).value = ""; });
  renderDiscovery();
});

function closeMenu() {
  mainNav.classList.remove("is-open");
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.setAttribute("aria-label", "Open menu");
}
menuButton.addEventListener("click", () => {
  const expanded = mainNav.classList.toggle("is-open");
  menuButton.setAttribute("aria-expanded", String(expanded));
  menuButton.setAttribute("aria-label", expanded ? "Close menu" : "Open menu");
});

function route() {
  if (window.RizzoraIP) { window.RizzoraIP.route(); return; }
  const discover = location.hash === "#discover";
  document.querySelector("#home-view").hidden = discover;
  document.querySelector("#discover-view").hidden = !discover;
  document.body.dataset.view = discover ? "discover" : "home";
  document.querySelectorAll("[data-nav]").forEach((link) => {
    if (link.dataset.nav === (discover ? "discover" : "home")) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  document.title = discover ? "Discover AI companions | Rizzora" : "Rizzora | For Every Lonely Soul.";
  if (discover || location.hash === "#home") window.scrollTo({ top: 0, behavior: "instant" });
  else if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
  closeMenu();
}
window.addEventListener("hashchange", route);
const requestedCharacter = characters.find((character) => character.id === new URLSearchParams(location.search).get("companion"));
if (requestedCharacter) document.querySelector("#character-search").value = requestedCharacter.name;
renderDiscovery();
route();

function initScrollParallax() {
  const home = document.querySelector("#home-view");
  const hero = document.querySelector(".hero");
  const scene = document.querySelector(".conversation-scene");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let frame = null;

  function update() {
    frame = null;
    if (reducedMotion.matches || home.hidden) {
      hero.style.removeProperty("--hero-offset");
      scene.style.removeProperty("--scene-offset");
      return;
    }
    const heroRect = hero.getBoundingClientRect();
    const sceneRect = scene.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const mobile = window.innerWidth <= 760;
    // Overscan in CSS exceeds these offsets so scrolling never exposes an edge.
    if (heroRect.bottom > 0 && heroRect.top < viewportHeight) {
      const offset = Math.max(0, Math.min(mobile ? 60 : 100, -heroRect.top * 0.18));
      hero.style.setProperty("--hero-offset", `${offset.toFixed(2)}px`);
    }
    if (sceneRect.bottom > 0 && sceneRect.top < viewportHeight) {
      const distance = viewportHeight / 2 - (sceneRect.top + sceneRect.height / 2);
      const limit = mobile ? 18 : 32;
      const offset = Math.max(-limit, Math.min(limit, distance * 0.08));
      scene.style.setProperty("--scene-offset", `${offset.toFixed(2)}px`);
    }
  }
  function schedule() {
    if (frame === null) frame = window.requestAnimationFrame(update);
  }
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  window.addEventListener("hashchange", schedule);
  window.addEventListener("pageshow", schedule);
  reducedMotion.addEventListener("change", schedule);
  schedule();
}
initScrollParallax();

function initHeroVoices() {
  const buttons = document.querySelectorAll("[data-hero-voice]");
  const audio = new Audio();
  audio.preload = "none";
  let activeButton = null;
  let interaction = null;
  let revision = 0;

  function stop() {
    revision += 1;
    audio.pause();
    if (activeButton) {
      activeButton.classList.remove("is-playing");
      activeButton.setAttribute("aria-pressed", "false");
      activeButton.setAttribute("aria-label", `Play ${activeButton.dataset.voiceName}'s voice`);
    }
    activeButton = null;
    interaction = null;
  }
  async function play(button, fromClick = false) {
    document.querySelector("#hero-video")?.pause();
    stopFeaturedPreview();
    if (activeButton === button && !audio.paused) {
      if (fromClick && interaction === "click") stop();
      else if (fromClick) interaction = "click";
      return;
    }
    stop();
    activeButton = button;
    interaction = fromClick ? "click" : "hover";
    const request = revision;
    audio.src = `assets/hero-companions/${button.dataset.heroVoice}.mp3`;
    try {
      // Call play directly in the click handler to retain browser user activation.
      await audio.play();
      if (request !== revision) return;
      button.classList.add("is-playing");
      button.setAttribute("aria-pressed", "true");
      button.setAttribute("aria-label", `Stop ${button.dataset.voiceName}'s voice`);
    } catch (error) {
      if (request !== revision) return;
      stop();
      button.setAttribute("aria-label", error.name === "NotAllowedError"
        ? `Click to hear ${button.dataset.voiceName}` : "Voice unavailable. Try again.");
    }
  }
  buttons.forEach((button) => {
    button.addEventListener("pointerenter", (event) => {
      if (event.pointerType === "mouse") play(button);
    });
    button.addEventListener("pointerleave", (event) => {
      if (event.pointerType === "mouse" && activeButton === button) stop();
    });
    button.addEventListener("click", () => play(button, true));
    button.addEventListener("blur", () => { if (activeButton === button) stop(); });
    button.addEventListener("keydown", (event) => {
      if (event.key === "Escape") stop();
    });
  });
  audio.addEventListener("ended", stop);
  audio.addEventListener("error", () => {
    const button = activeButton;
    stop();
    if (button) button.setAttribute("aria-label", "Voice unavailable. Try again.");
  });
  window.addEventListener("hashchange", stop);
  window.addEventListener("pagehide", stop);
  document.addEventListener("visibilitychange", () => { if (document.hidden) stop(); });
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(([entry]) => { if (!entry.isIntersecting) stop(); });
    observer.observe(document.querySelector("#hero-voice-selector"));
  }
  return stop;
}
const stopHeroVoice = initHeroVoices();

function initFeaturedPreviews() {
  const cards = [...document.querySelectorAll("[data-character-preview]")];
  let active = null;
  let wantsSound = true;
  let revision = 0;

  function updateSound(card, failed = false) {
    const video = card.querySelector("video");
    const button = card.querySelector("[data-preview-sound]");
    const soundOn = !failed && (active === card ? !video.muted : wantsSound);
    const label = failed ? "Retry video preview" : soundOn ? "Mute preview" : "Unmute preview";
    button.setAttribute("aria-label", label);
    button.setAttribute("title", label);
    button.setAttribute("aria-pressed", String(soundOn));
    button.querySelector("img").src = `assets/${soundOn ? "volume" : "volume-off"}.svg`;
  }
  function stop() {
    revision += 1;
    if (!active) return;
    const card = active;
    const video = card.querySelector("video");
    active = null;
    video.pause();
    video.currentTime = 0;
    card.classList.remove("is-previewing");
    updateSound(card);
  }
  async function start(card) {
    document.querySelector("#hero-video")?.pause();
    if (active === card) return;
    stop();
    stopHeroVoice();
    active = card;
    const request = revision;
    const video = card.querySelector("video");
    if (!video.getAttribute("src")) video.src = video.dataset.src;
    else if (video.error) video.load();
    video.muted = !wantsSound;
    updateSound(card);
    try {
      try {
        await video.play();
      } catch (error) {
        if (request !== revision || error.name !== "NotAllowedError" || video.muted) throw error;
        video.muted = true;
        updateSound(card);
        await video.play();
      }
      if (request !== revision) return;
      card.classList.add("is-previewing");
      updateSound(card);
    } catch (error) {
      if (request !== revision) return;
      stop();
      updateSound(card, true);
    }
  }
  cards.forEach((card) => {
    const video = card.querySelector("video");
    card.addEventListener("pointerenter", (event) => {
      if (event.pointerType === "mouse") start(card);
    });
    card.addEventListener("pointerleave", (event) => {
      if (event.pointerType === "mouse" && active === card) stop();
    });
    card.addEventListener("focusin", (event) => {
      if (!event.target.closest("[data-preview-sound]")) start(card);
    });
    card.addEventListener("focusout", (event) => {
      if (!card.contains(event.relatedTarget) && active === card) stop();
    });
    card.addEventListener("keydown", (event) => { if (event.key === "Escape") stop(); });
    card.querySelector("[data-preview-sound]").addEventListener("click", async (event) => {
      event.stopPropagation();
      if (active !== card) {
        wantsSound = true;
        start(card);
        return;
      }
      wantsSound = video.muted;
      video.muted = !wantsSound;
      updateSound(card);
      if (!video.paused) return;
      const request = revision;
      try {
        await video.play();
        if (request === revision) card.classList.add("is-previewing");
      } catch (error) {
        if (request !== revision) return;
        stop();
        updateSound(card, true);
      }
    });
    video.addEventListener("error", () => {
      if (active !== card) return;
      stop();
      updateSound(card, true);
    });
  });
  window.addEventListener("hashchange", stop);
  window.addEventListener("pagehide", stop);
  document.addEventListener("visibilitychange", () => { if (document.hidden) stop(); });
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.target === active && !entry.isIntersecting)) stop();
    });
    cards.forEach((card) => observer.observe(card));
  }
  return stop;
}
const stopFeaturedPreview = initFeaturedPreviews();

function showDialog(markup, options = {}) {
  document.querySelector("#hero-video")?.pause();
  stopHeroVoice();
  stopFeaturedPreview();
  closeMenu();
  if (!options.auth) portalAuth.close();
  dialog.classList.toggle("auth-dialog", Boolean(options.auth));
  dialogContent.innerHTML = markup;
  if (!dialog.open) {
    returnFocus = document.activeElement;
    dialog.showModal();
  }
  dialog.scrollTop = 0;
  dialog.querySelector(options.focusSelector || ".dialog-close")?.focus();
}
function closeDialog() { dialog.close(); }
dialog.querySelector(".dialog-close").addEventListener("click", closeDialog);
dialog.addEventListener("click", (event) => { if (event.target === dialog) {
  const rect = dialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeDialog();
} });
dialog.addEventListener("close", () => {
  portalAuth.close();
  pendingChat = false;
  if (returnFocus?.isConnected) returnFocus.focus();
});

const portalAuth = window.createRizzoraPortalAuth({ content: dialogContent, show: showDialog, onAuthenticated: finishDemoLogin });
function updateUnreadCount(count) {
  unreadCount = Number.isSafeInteger(count) && count > 0 ? count : 0;
  const badge = document.querySelector("#chat-unread");
  badge.hidden = !signedIn || unreadCount === 0;
  badge.textContent = unreadCount > 99 ? "99+" : String(unreadCount);
  document.querySelector("#nav-chat").setAttribute("aria-label", signedIn && unreadCount > 0 ? `Chat, ${unreadCount} unread messages` : "Chat");
}
function showLogin() {
  if (signedIn && !pendingChat) return showAccount();
  portalAuth.open({ character: pendingChat ? selectedCharacter.shortName : "" });
}
function finishDemoLogin(user = {}) {
  signedIn = true;
  updateUnreadCount(user.unreadCount ?? 3);
  document.querySelector(".login-button > img")?.setAttribute("hidden", "");
  if (!document.querySelector(".account-avatar")) {
    const avatar = document.createElement("span");
    avatar.className = "account-avatar";
    avatar.setAttribute("aria-hidden", "true");
    avatar.textContent = typeof user.name === "string" && user.name.trim() ? Array.from(user.name.trim())[0].toUpperCase() : "E";
    document.querySelector(".login-button").prepend(avatar);
  }
  document.querySelector("#account-label").textContent = "My account";
  if (window.RizzoraIP?.afterLogin()) return;
  if (pendingChat) showChat();
  else showAccount();
}
function showAccount() {
  if (window.RizzoraIP) { location.hash = "account"; window.RizzoraIP.route(); return; }
  showDialog(`<p class="eyebrow">DEMO ACCOUNT</p><h2 id="dialog-title">Hello, explorer.</h2><p>Your account gives you a place to return to your conversations.</p><p class="demo-label">This preview uses a temporary demo session. No personal information or purchase history is stored.</p><div class="dialog-stack"><button type="button" data-open="subscription">Explore VIP benefits</button><button type="button" data-open="chat">Open a demo conversation</button><button type="button" data-signout>Sign out of demo</button></div>`);
}
function showChat() {
  window.RizzoraIP?.rememberChat(selectedCharacter.id);
  pendingChat = false;
  updateUnreadCount(0);
  showDialog(`<p class="eyebrow">DEMO CONVERSATION</p><h2 id="dialog-title">${selectedCharacter.shortName}</h2><p class="demo-label">Illustrative local messages. No AI or media service is connected.</p><div class="demo-chat"><div class="demo-chat-log" role="log" aria-live="polite"><p>${selectedCharacter.greeting}</p></div><form id="demo-chat-form"><input aria-label="Message" placeholder="Say hello..." autocomplete="off" maxlength="500" required><button type="submit" aria-label="Send message">${icon("arrow")}</button></form></div>`);
}
function showSubscription() {
  if (window.RizzoraIP) { location.hash = "membership"; window.RizzoraIP.route(); return; }
  showDialog(`<p class="eyebrow">RIZZORA VIP</p><h2 id="dialog-title">More ways to connect.</h2><p>VIP unlocks photo messages, voice messages, and voice calls. All chats, including VIP interactions, use Stamina.</p><ul class="dialog-list"><li>60,000 Stamina issued every month on monthly, quarterly, or yearly billing.</li><li>Included monthly Stamina resets; unused monthly Stamina does not carry over.</li><li>Purchased extra Stamina is retained and is used after your included monthly Stamina.</li><li>You can purchase Stamina for text chat without a VIP subscription.</li></ul><p>New accounts receive 10 free messages a day for the first 3 days. From day 4, continuing requires a Stamina purchase or VIP.</p><p class="demo-label">Prices and VIP trial terms are still being finalized. No checkout or payment is available in this preview.</p>`);
}

const legalTitles = { terms: "Terms of use", privacy: "Privacy policy", membership: "Membership & renewal" };
function showSafety(legal) {
  if (legal) {
    showDialog(`<p class="eyebrow">SAFETY CENTER</p><h2 id="dialog-title">${legalTitles[legal]}</h2><p>The approved policy text has not been supplied yet. This is a reserved entry for the final document, not a published legal agreement.</p><button class="button button-light" type="button" data-open="safety">Back to Safety</button>`);
    return;
  }
  showDialog(`<p class="eyebrow">CARE & CLARITY</p><h2 id="dialog-title">AI companions, explained.</h2><p>Rizzora companions are AI-generated virtual characters. They are not real people, and their messages are generated experiences.</p><p>Rizzora does not offer explicit or nude content. Conversations are subject to content moderation.</p><div class="dialog-stack"><button type="button" data-legal="terms">Terms of use</button><button type="button" data-legal="privacy">Privacy policy</button><button type="button" data-legal="membership">Membership & auto-renewal</button></div><p class="demo-label">Final policy documents are pending.</p>`);
}

document.addEventListener("click", (event) => {
  const target = event.target.closest("button, a");
  if (!target) return;
  if (target.dataset.discover) {
    document.querySelector("#character-search").value = characters.find((c) => c.id === target.dataset.discover).name;
    Object.keys(filterFields).forEach((key) => { document.querySelector(`#filter-${key}`).value = ""; });
    renderDiscovery();
    location.hash = "discover";
    route();
  }
  if (target.dataset.chat) {
    selectedCharacter = characters.find((c) => c.id === target.dataset.chat);
    pendingChat = !signedIn;
    if (signedIn) showChat(); else showLogin();
  }
  if (target.dataset.open === "login") showLogin();
  if (target.dataset.open === "subscription") showSubscription();
  if (target.dataset.open === "chat") {
    pendingChat = !signedIn;
    if (signedIn) showChat(); else showLogin();
  }
  if (target.dataset.open === "safety") showSafety();
  if (target.dataset.legal) showSafety(target.dataset.legal);
  if (target.dataset.open === "app") showDialog(`<p class="eyebrow">THE RIZZORA APP</p><h2 id="dialog-title">Not on the stores just yet.</h2><p>App Store and Google Play availability have not been confirmed. You can explore Rizzora's web experience in the meantime.</p><button class="button button-primary" type="button" data-go-discover>Discover companions ${icon("arrow")}</button>`);
  if (target.dataset.social) {
    showDialog(`<p class="eyebrow">STAY A LITTLE CLOSER</p><h2 id="dialog-title">Rizzora on ${target.dataset.social}</h2><p>The official channel link hasn't been supplied yet. This entry is reserved for Rizzora's verified profile.</p>`);
  }
  if (target.hasAttribute("data-go-discover")) { closeDialog(); location.hash = "discover"; }
  if (target.hasAttribute("data-signout")) {
    signedIn = false;
    updateUnreadCount(0);
    document.querySelector(".account-avatar")?.remove();
    document.querySelector(".login-button > img")?.removeAttribute("hidden");
    document.querySelector("#account-label").textContent = "Log in";
    closeDialog();
  }
});
document.addEventListener("submit", (event) => {
  if (event.target.id !== "demo-chat-form") return;
  event.preventDefault();
  const input = event.target.querySelector("input");
  const value = input.value.trim();
  if (!value) return;
  const log = dialog.querySelector(".demo-chat-log");
  const userMessage = document.createElement("p");
  userMessage.className = "demo-user";
  userMessage.textContent = value;
  const reply = document.createElement("p");
  reply.textContent = "This is a preview of your conversation space. Your real conversation will begin when the service is connected.";
  log.append(userMessage, reply);
  input.value = "";
  log.scrollTop = log.scrollHeight;
});
