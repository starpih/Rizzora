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
  const profileLink = (c) => `<a class="ip-person" href="#character/${c.id}"><img src="${c.image}" alt="${c.name}" loading="lazy"><div><h3>${c.name}</h3><p>${c.summary}</p><div class="companion-traits">${c.traits.map((t) => `<span>${t}</span>`).join("")}</div></div></a>`;
  const heading = (eyebrow, title, detail = "") => `<header class="ip-page-heading"><p class="eyebrow">${eyebrow}</p><h1 tabindex="-1">${title}</h1>${detail ? `<p>${detail}</p>` : ""}</header>`;
  const benefits = `<ul class="ip-benefits"><li>Text, voice messages, photo messages and voice calls</li><li>60,000 Stamina every month, on every billing cycle</li><li>Monthly Stamina resets; purchased extra Stamina is retained</li><li>All interactions use Stamina; included allowance is used first</li></ul>`;
  function recommendations() {
    const liked = characters.filter((c) => favorites.has(c.id));
    const traits = new Set(liked.flatMap((c) => c.traits));
    const pool = characters.filter((c) => !favorites.has(c.id));
    const ranked = [...pool].sort((a, b) => b.traits.filter((t) => traits.has(t)).length - a.traits.filter((t) => traits.has(t)).length);
    document.querySelector("#recommend-reason").textContent = liked.length ? `BASED ON YOUR SAVED CHARACTERS` : "SELECTED BY RIZZORA";
    document.querySelector("#recommend-title").textContent = liked.length ? "More of your kind." : "A few faces to know.";
    document.querySelector("#recommend-characters").innerHTML = (ranked.length ? ranked : characters).slice(0, 2).map(profileLink).join("");
    document.querySelector("#continue-band").hidden = !signedIn || !chats.length;
    document.querySelector("#continue-characters").innerHTML = chats.map((id) => `<button type="button" data-chat="${id}"><img src="${byId(id).image}" alt=""><span>${byId(id).shortName}</span>${image("message")}</button>`).join("");
  }
  function profile(id) {
    const c = byId(id);
    if (!c) { extra.innerHTML = `${heading("RIZZORA", "Character not found.")}<a class="text-link" href="#discover">Back to Discover${image("arrow")}</a>`; return; }
    extra.innerHTML = `<a class="ip-back" href="#discover">${image("arrow")}Discover</a><div class="ip-profile"><div class="ip-profile-photo"><img src="${c.image}" alt="${c.name}, a virtual AI character"></div><div>${heading("THE RIZZORA CHARACTERS", c.name, c.summary)}<p class="ip-meta">${c.nationality} · ${c.profession}</p><div class="companion-traits">${[...c.traits, ...c.interests].map((t) => `<span>${t}</span>`).join("")}</div><div class="ip-actions"><button class="button button-primary" type="button" data-chat="${c.id}">Say hello${image("message")}</button><button class="icon-button ip-save" type="button" data-save="${c.id}" aria-label="${favorites.has(c.id) ? "Unsave" : "Save"} ${c.shortName}" title="${favorites.has(c.id) ? "Unsave" : "Save"} character" aria-pressed="${favorites.has(c.id)}">${image("heart")}</button></div><nav class="ip-tabs" aria-label="Character sections"><a href="#story-${c.id}">Story</a><a href="#moments-${c.id}">Moments</a></nav><section id="story-${c.id}"><h2>Meet ${c.shortName}.</h2><p class="ip-story">${c.summary} His world brings together ${c.interests.join(" and ").toLowerCase()} and a ${c.traits.join(", ").toLowerCase()} personality.</p><p class="ip-disclosure">A fictional AI character. Profile copy is a creative preview.</p></section></div></div><section class="ip-moments" id="moments-${c.id}"><div class="section-heading"><h2>A moment with ${c.shortName}.</h2><span class="eyebrow">FEATURED CLIP</span></div><video controls playsinline preload="none" poster="${c.image}" src="${c.id === "chris" ? "assets/hero-chris-v1.mp4" : featuredVideos[c.id]}"></video></section>`;
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
  function route() {
    stopMedia();
    stopHeroVoice();
    stopFeaturedPreview();
    const hash = location.hash.slice(1);
    const isHome = !["discover", "membership", "checkout", "account"].includes(hash) && !hash.startsWith("character/") && !hash.startsWith("story-") && !hash.startsWith("moments-");
    const localProfileAnchor = hash.startsWith("story-") || hash.startsWith("moments-");
    if (localProfileAnchor) {
      if (!document.getElementById(hash)) {
        profile(hash.replace(/^(story|moments)-/, ""));
        document.querySelector("#home-view").hidden = true;
        document.querySelector("#discover-view").hidden = true;
        extra.hidden = false;
        document.body.dataset.view = "ip";
      }
      window.RizzoraHero?.sync();
      document.getElementById(hash)?.scrollIntoView(); return;
    }
    document.querySelector("#home-view").hidden = !isHome;
    document.querySelector("#discover-view").hidden = hash !== "discover";
    extra.hidden = isHome || hash === "discover";
    document.body.dataset.view = isHome ? "home" : hash === "discover" ? "discover" : "ip";
    document.querySelectorAll("[data-nav]").forEach((a) => { if (a.dataset.nav === (isHome ? "home" : hash)) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
    if (hash.startsWith("character/")) { const id = hash.split("/")[1]; profile(id); document.title = `${byId(id)?.name || "Character"} | Rizzora`; }
    else if (hash === "membership") { membershipPage(); document.title = "VIP Membership | Rizzora"; }
    else if (hash === "checkout") { checkout(); document.title = "Checkout Preview | Rizzora"; }
    else if (hash === "account") { account(); document.title = "My Account | Rizzora"; }
    else if (hash === "discover") { recommendations(); document.title = "Discover Characters | Rizzora"; }
    else document.title = "Rizzora | Characters. Stories. Connection.";
    closeMenu();
    if (isHome && hash && hash !== "home") document.getElementById(hash)?.scrollIntoView();
    else window.scrollTo({ top: 0, behavior: "instant" });
    window.RizzoraHero?.sync();
  }
  window.RizzoraIP = {
    route,
    afterLogin() { if (!resumeCheckout) return false; resumeCheckout = false; pendingChat = false; closeDialog(); location.hash = "checkout"; route(); return true; },
    rememberChat(id) { if (!chats.includes(id)) chats.unshift(id); },
  };
  const voiceSlot = document.querySelector("#voice-selector-slot");
  voiceSlot.append(document.querySelector("#hero-voice-selector"));
  // Keep the existing audio controls; replace only their homepage presentation.
  voiceSlot.querySelectorAll("[data-hero-voice]").forEach((button) => {
    const symbol = document.createElement("span");
    symbol.className = "voice-play-symbol";
    symbol.setAttribute("aria-hidden", "true");
    button.replaceChildren(symbol, document.createTextNode(button.dataset.voiceName));
  });
  dialog.addEventListener("close", () => { if (!signedIn) resumeCheckout = false; });
  document.addEventListener("click", (event) => {
    const button = event.target.closest("button, a");
    if (!button) return;
    if (button.dataset.profile) location.hash = `character/${button.dataset.profile}`;
    if (button.dataset.save) { const id = button.dataset.save; if (!byId(id)) return; if (favorites.has(id)) favorites.delete(id); else favorites.add(id); saveFavorites(); profile(id); }
    if (button.hasAttribute("data-checkout-login")) { resumeCheckout = true; showLogin(); }
    if (button.hasAttribute("data-payment-retry")) { checkoutState = "review"; checkout(); }
    if (button.hasAttribute("data-payment-fail")) { checkoutState = "failed"; checkout(); }
    if (button.hasAttribute("data-payment-cancel")) { checkoutState = "cancelled"; checkout(); }
    if (button.hasAttribute("data-renewal") && membership) { membership.renewal = !membership.renewal; account(); }
    if (button.hasAttribute("data-signout")) { membership = null; chats.length = 0; resumeCheckout = false; if (location.hash === "#account") account(); }
  });
  document.addEventListener("submit", (event) => {
    if (event.target.id === "plan-form") { event.preventDefault(); cycle = new FormData(event.target).get("cycle"); if (!cycles[cycle]) cycle = "monthly"; checkoutState = "review"; location.hash = "checkout"; route(); }
    if (event.target.id === "payment-form") { event.preventDefault(); if (!signedIn || !event.target.checkValidity()) return; membership = { cycle, renewal: true }; checkoutState = "success"; checkout(); }
  });
  recommendations();
  route();
})();
