(() => {
  const main = document.querySelector("#main");
  const extra = document.createElement("div");
  extra.id = "ip-view";
  extra.className = "ip-view section-wrap";
  extra.hidden = true;
  main.append(extra);
  let cycle = "monthly";
  let resumeCheckout = false;
  let checkoutState = "review";
  let membership = null;
  const chats = [];
  const cycles = { monthly: { label: "Monthly", period: "1 month" }, quarterly: { label: "Quarterly", period: "3 months" }, yearly: { label: "Yearly", period: "12 months" } };
  const storageKey = "rizzora.ip.favorites";
  const favorites = new Set();
  try {
    const storedFavorites = sessionStorage.getItem(storageKey);
    const saved = JSON.parse(storedFavorites || "[]");
    if (Array.isArray(saved)) saved.forEach((id) => { if (characters.some((c) => c.id === id)) favorites.add(id); });
    const choices = JSON.parse(sessionStorage.getItem("rizzora.spark.discovery.v1") || "[]");
    if (storedFavorites === null && Array.isArray(choices)) choices.forEach((choice) => { if (choice?.decision === "like" && characters.some((c) => c.id === choice.id)) favorites.add(choice.id); });
  } catch { /* Private browsing may disable session storage. */ }
  function saveFavorites() { try { sessionStorage.setItem(storageKey, JSON.stringify([...favorites])); } catch { /* Keep in-memory preferences. */ } }
  const image = (name) => `<img class="icon" src="assets/${name}.svg" alt="">`;
  const byId = (id) => characters.find((c) => c.id === id);
  const deck = document.querySelector(".spark-deck");
  const deckStage = deck.querySelector(".deck-stage");
  let deckIndex = 0;
  function positionDeck() {
    const slides = [...deckStage.children];
    const count = slides.length;
    slides.forEach((slide, index) => {
      const distance = (index - deckIndex + count) % count;
      slide.dataset.offset = distance > count / 2 ? distance - count : distance;
      slide.inert = index !== deckIndex;
    });
    deck.querySelector(".deck-status").textContent = `${slides[deckIndex].dataset.name}, ${deckIndex + 1} of ${count}`;
  }
  function stepDeck(direction) {
    const count = deckStage.children.length;
    deckIndex = (deckIndex + direction + count) % count;
    positionDeck();
  }
  deck.querySelector(".deck-prev").addEventListener("click", () => stepDeck(-1));
  deck.querySelector(".deck-next").addEventListener("click", () => stepDeck(1));
  deck.addEventListener("keydown", event => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const onCard = deckStage.contains(event.target);
    stepDeck(event.key === "ArrowLeft" ? -1 : 1);
    if (onCard) deckStage.children[deckIndex].focus();
  });
  const heading = (eyebrow, title, detail = "") => `<header class="ip-page-heading"><p class="eyebrow">${eyebrow}</p><h1 tabindex="-1">${title}</h1>${detail ? `<p>${detail}</p>` : ""}</header>`;
  const benefits = `<ul class="ip-benefits"><li>Text, voice messages, photo messages and voice calls</li><li>60,000 Stamina every month, on every billing cycle</li><li>Monthly Stamina resets; purchased extra Stamina is retained</li><li>All interactions use Stamina; included allowance is used first</li></ul>`;
  function recommendations() {
    const liked = characters.filter((c) => favorites.has(c.id));
    const traits = new Set(liked.flatMap((c) => c.traits));
    const pool = characters.filter((c) => !favorites.has(c.id));
    const ranked = [...pool].sort((a, b) => b.traits.filter((t) => traits.has(t)).length - a.traits.filter((t) => traits.has(t)).length);
    const lineup = [...ranked, ...liked].slice(0, 5);
    const orderChanged = lineup.some((c, index) => deckStage.children[index]?.dataset.id !== c.id);
    if (orderChanged) deckIndex = 0;
    deckStage.innerHTML = lineup.map(c => {
      const scene = document.querySelector(`[data-hero-character="${c.id}"]`);
      return `<a class="deck-card" data-id="${c.id}" data-name="${c.name}" href="#character/${c.id}" aria-label="Meet ${c.name}">
        <img src="${scene?.getAttribute("src") || c.image}" alt="" decoding="async">
        <span class="deck-caption"><strong>${c.name}</strong><span>${c.profession || c.interests[0]}</span></span>
      </a>`;
    }).join("");
    positionDeck();
    document.querySelector("#continue-band").hidden = !signedIn || !chats.length;
    document.querySelector("#continue-characters").innerHTML = chats.map((id) => `<button type="button" data-chat="${id}"><img src="${byId(id).image}" alt=""><span>${byId(id).shortName}</span>${image("message")}</button>`).join("");
  }
  function profile(id) {
    const c = byId(id);
    if (!c) { extra.innerHTML = `${heading("RIZZORA", "Character not found.")}<a class="text-link" href="#discover">Back to Discover${image("arrow")}</a>`; return; }
    const meta = [c.nationality, c.profession].filter(Boolean).join(" · ");
    const scene = document.querySelector(`[data-hero-character="${c.id}"]`);
    const story = scene?.dataset.story || (c.id === "chris" ? "The song you sent is still playing when you arrive. Chris moves his sweater off the sofa. “I saved you the good spot.”" : c.summary);
    const clip = c.id === "chris" ? "assets/hero-chris-v1.mp4" : featuredVideos[c.id];
    const saved = favorites.has(c.id);
    extra.innerHTML = `<nav class="ip-profile-breadcrumbs" aria-label="Profile navigation"><a class="ip-back" href="#home">${image("arrow")}Home</a><a class="ip-back" href="#discover">Discover characters</a></nav>
      <div class="ip-profile"><div class="ip-profile-photo"><img src="${c.image}" alt="${c.name}, a virtual AI character"></div><div>
        ${heading("THE RIZZORA CHARACTERS", c.name, c.summary)}
        ${meta ? `<p class="ip-meta">${meta}</p>` : ""}
        <div class="companion-traits">${[...c.traits, ...c.interests].map((t) => `<span>${t}</span>`).join("")}</div>
        <div class="ip-actions"><button class="button button-primary" type="button" data-chat="${c.id}">Say hello${image("message")}</button><button class="icon-button ip-save" type="button" data-save="${c.id}" aria-label="${saved ? "Unsave" : "Save"} ${c.shortName}" title="${saved ? "Unsave" : "Save"} character" aria-pressed="${saved}">${image("heart")}</button></div>
        <nav class="ip-tabs" aria-label="Character sections"><button type="button" data-profile-section="story-${c.id}" aria-controls="story-${c.id}">Story</button><button type="button" data-profile-section="moments-${c.id}" aria-controls="moments-${c.id}">Moments</button></nav>
        <section id="story-${c.id}" class="ip-profile-section" tabindex="-1" aria-labelledby="story-title-${c.id}"><h2 id="story-title-${c.id}">Meet ${c.shortName}.</h2><p class="ip-story">${story}</p><p class="ip-disclosure">A fictional AI character. Profile copy is a creative preview.</p></section>
      </div></div>
      <section class="ip-moments ip-profile-section" id="moments-${c.id}" tabindex="-1" aria-labelledby="moments-title-${c.id}"><div class="section-heading"><h2 id="moments-title-${c.id}">A moment with ${c.shortName}.</h2><span class="eyebrow">${clip ? "FEATURED CLIP" : "A QUIET MOMENT"}</span></div>
        ${clip ? `<video controls playsinline preload="none" poster="${c.image}" src="${clip}" aria-label="A moment with ${c.shortName}"></video>` : `<figure class="ip-profile-still"><img src="${scene?.getAttribute("src") || c.image}" alt="Hayes reading in a softly lit bookshop" loading="lazy"><figcaption>${story}</figcaption></figure>`}
        <button class="button button-primary ip-moment-hello" type="button" data-chat="${c.id}">Say hello to ${c.shortName}${image("message")}</button>
      </section>`;
  }
  function membershipPage() {
    extra.innerHTML = `${heading("RIZZORA MEMBERSHIP", "One VIP. Your kind of connection.", "Choose the billing rhythm that works for you.")}<div class="ip-membership-layout"><section><h2>Rizzora VIP</h2>${benefits}<p class="ip-disclosure">Future short dramas and member videos are not included in the current offer. Prices and renewal terms are pending approval.</p></section><form id="plan-form"><fieldset class="ip-plans"><legend>Billing cycle</legend>${Object.entries(cycles).map(([id, c]) => `<label class="ip-plan"><input type="radio" name="cycle" value="${id}" ${id === cycle ? "checked" : ""}><span><strong>${c.label}</strong><small>Billed every ${c.period}</small></span><span class="ip-price">Price to be confirmed</span></label>`).join("")}</fieldset><p class="ip-disclosure">Payment preview · no money is charged.</p><button class="button button-primary" type="submit">Continue${image("arrow")}</button></form></div>`;
  }
  function checkout() {
    if (!signedIn) {
      extra.innerHTML = `${heading("RIZZORA VIP", "A little closer.", "Sign in to continue with your selected plan.")}<button class="button button-primary" type="button" data-checkout-login>Log in & continue${image("arrow")}</button><a class="ip-back" href="#membership">Change plan</a>`;
      return;
    }
    if (checkoutState !== "review") {
      const labels = { success: ["VIP is active.", "Your demo membership is ready. No payment was made."], failed: ["Payment declined.", "Simulated payment failure. Your membership has not changed."], cancelled: ["Payment cancelled.", "No payment was made. Your membership has not changed."] };
      const [title, detail] = labels[checkoutState];
      extra.innerHTML = `${heading("PAYMENT PREVIEW", title, detail)}<div class="ip-actions">${checkoutState === "success" ? '<a class="button button-primary" href="#account">My account</a>' : '<button class="button button-primary" type="button" data-payment-retry>Try again</button>'}<a class="text-link" href="#membership">Membership plans${image("arrow")}</a></div>`;
      return;
    }
    extra.innerHTML = `${heading("CHECKOUT · PREVIEW", "Your VIP membership.")}<div class="ip-membership-layout"><section><h2>Rizzora VIP · ${cycles[cycle].label}</h2>${benefits}</section><form id="payment-form"><dl class="ip-order"><div><dt>Billing period</dt><dd>${cycles[cycle].period}</dd></div><div><dt>Due today</dt><dd>Price to be confirmed</dd></div><div><dt>Renewal amount</dt><dd>Pending approval</dd></div><div><dt>Included allowance</dt><dd>60,000 Stamina / month</dd></div></dl><p class="ip-disclosure">Simulation only. No card or billing information is collected.</p><label class="ip-consent"><input type="checkbox" id="payment-consent" required>I understand this is a payment preview with no charge.</label><div class="ip-actions"><button class="button button-primary" type="submit">Simulate payment${image("arrow")}</button><button class="text-link" type="button" data-payment-fail>Simulate failure</button><button class="text-link" type="button" data-payment-cancel>Cancel</button></div></form></div>`;
  }
  function account() {
    if (!signedIn) { extra.innerHTML = `${heading("YOUR RIZZORA", "Welcome back.")}<button class="button button-primary" type="button" data-open="login">Log in</button>`; return; }
    extra.innerHTML = `${heading("DEMO ACCOUNT", "Your Rizzora.")}<div class="ip-account-grid"><section><h2>Membership</h2><p>${membership ? `VIP · ${cycles[membership.cycle].label}` : "Free account"}</p><p class="ip-disclosure">${membership ? (membership.renewal ? "Demo renewal enabled. No automatic payment is scheduled." : "Demo renewal disabled. No payment is scheduled.") : "No active VIP subscription."}</p><a class="text-link" href="#membership">${membership ? "Change plan" : "Explore VIP"}${image("arrow")}</a>${membership ? '<button class="text-link" type="button" data-renewal>' + (membership.renewal ? "Turn off demo renewal" : "Enable demo renewal") + '</button>' : ""}</section><section><h2>Your characters</h2><p>${favorites.size} saved</p><div class="ip-saved-list">${characters.filter((c) => favorites.has(c.id)).map((c) => `<a href="#character/${c.id}">${c.name}${image("arrow")}</a>`).join("") || '<a href="#discover">Explore the characters</a>'}</div></section></div><section class="ip-order-history"><h2>Payment history</h2><p>${membership ? `Demo order · Rizzora VIP · ${cycles[membership.cycle].label} · No charge` : "No payments."}</p></section><button class="text-link" type="button" data-signout>Sign out of demo</button>`;
  }
  function stopMedia() { document.querySelectorAll("#ip-view video").forEach((v) => v.pause()); }
  function route({ initialLoad = false } = {}) {
    // A history/navigation change cancels the old dialog's intended destination.
    if (dialog.open) {
      pendingChat = false; resumeCheckout = false; returnFocus = null;
      portalAuth.close(); closeDialog();
    }
    stopMedia();
    stopFeaturedPreview();
    window.RizzoraChat?.leave();
    const hash = location.hash.slice(1);
    const localProfileAnchor = hash.startsWith("story-") || hash.startsWith("moments-");
    const isChat = hash === "chat" || hash.startsWith("chat/");
    const isHome = !isChat && !["discover", "membership", "checkout", "account"].includes(hash) && !hash.startsWith("character/") && !localProfileAnchor;
    document.querySelector("#home-view").hidden = !isHome;
    document.querySelector("#discover-view").hidden = hash !== "discover";
    extra.hidden = isHome || hash === "discover";
    document.body.dataset.view = isHome ? "home" : hash === "discover" ? "discover" : isChat ? "chat" : "ip";
    document.querySelectorAll("[data-nav]").forEach((a) => { if (a.dataset.nav === (isHome ? "home" : isChat ? "chat" : hash)) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
    if (hash.startsWith("character/") || localProfileAnchor) {
      const id = localProfileAnchor ? hash.replace(/^(story|moments)-/, "") : hash.split("/")[1];
      profile(id);
      if (byId(id)) selectedCharacter = byId(id);
      document.title = `${byId(id)?.name || "Character"} | Rizzora`;
    }
    else if (isChat) window.RizzoraChat.render(extra, hash.split("/")[1]);
    else if (hash === "membership") { membershipPage(); document.title = "VIP Membership | Rizzora"; }
    else if (hash === "checkout") { checkout(); document.title = "Checkout Preview | Rizzora"; }
    else if (hash === "account") { account(); document.title = "My Account | Rizzora"; }
    else if (hash === "discover") { recommendations(); document.title = "Discover Characters | Rizzora"; }
    else document.title = "Rizzora | Characters. Stories. Connection.";
    closeMenu();
    const focusTarget = localProfileAnchor ? document.getElementById(hash) : isHome ? document.querySelector(".hero h1") : hash === "discover" ? document.querySelector("#discover-title") : extra.querySelector("h1");
    if (focusTarget && (!initialLoad || localProfileAnchor)) {
      focusTarget.setAttribute("tabindex", "-1");
      focusTarget.focus({ preventScroll: true });
    }
    if (localProfileAnchor || (isHome && hash && hash !== "home")) document.getElementById(hash)?.scrollIntoView();
    else window.scrollTo({ top: 0, behavior: "instant" });
    window.RizzoraHero?.sync();
  }
  window.RizzoraIP = {
    route,
    afterLogin() { if (!resumeCheckout) return false; resumeCheckout = false; pendingChat = false; closeDialog(); navigateTo("checkout"); return true; },
    rememberChat(id) { if (!chats.includes(id)) chats.unshift(id); },
  };
  dialog.addEventListener("close", () => { if (!signedIn) resumeCheckout = false; });
  document.addEventListener("click", (event) => {
    const button = event.target.closest("button, a");
    if (!button) return;
    if (button.dataset.profileSection) {
      const section = document.getElementById(button.dataset.profileSection);
      section?.focus({ preventScroll: true }); section?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
    }
    if (button.dataset.profile) location.hash = `character/${button.dataset.profile}`;
    if (button.dataset.save) { const id = button.dataset.save; if (!byId(id)) return; if (favorites.has(id)) favorites.delete(id); else favorites.add(id); saveFavorites(); button.setAttribute("aria-pressed", String(favorites.has(id))); button.setAttribute("aria-label", `${favorites.has(id) ? "Unsave" : "Save"} ${byId(id).shortName}`); button.title = `${favorites.has(id) ? "Unsave" : "Save"} character`; }
    if (button.hasAttribute("data-checkout-login")) { resumeCheckout = true; showLogin(); }
    if (button.hasAttribute("data-payment-retry")) { checkoutState = "review"; checkout(); }
    if (button.hasAttribute("data-payment-fail")) { checkoutState = "failed"; checkout(); }
    if (button.hasAttribute("data-payment-cancel")) { checkoutState = "cancelled"; checkout(); }
    if (button.hasAttribute("data-renewal") && membership) { membership.renewal = !membership.renewal; account(); }
    if (button.hasAttribute("data-signout")) { membership = null; chats.length = 0; resumeCheckout = false; window.RizzoraChat?.clear(); if (location.hash === "#account") account(); }
  });
  document.addEventListener("submit", (event) => {
    if (event.target.id === "plan-form") { event.preventDefault(); cycle = new FormData(event.target).get("cycle"); if (!cycles[cycle]) cycle = "monthly"; checkoutState = "review"; navigateTo("checkout"); }
    if (event.target.id === "payment-form") { event.preventDefault(); if (!signedIn || !event.target.checkValidity()) return; membership = { cycle, renewal: true }; checkoutState = "success"; checkout(); }
  });
  recommendations();
  route({ initialLoad: true });
})();
