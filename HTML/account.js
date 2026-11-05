(() => {
  const key = "rizzora-web-account-demo";
  const states = {
    day1: { plan: "Free Account", free: "10 of 10 messages", detail: "Day 1 of 3", monthly: null, extra: 0 },
    day2: { plan: "Free Account", free: "10 of 10 messages", detail: "Day 2 of 3", monthly: null, extra: 0 },
    day3: { plan: "Free Account", free: "10 of 10 messages", detail: "Day 3 of 3", monthly: null, extra: 0 },
    day4: { plan: "Free Account", free: "No free messages left", detail: "Free period ended", monthly: null, extra: 0 },
    extra: { plan: "Free Account", free: "Free period ended", detail: "Extra Stamina available", monthly: null, extra: 60 },
    vip: { plan: "Premium", free: "Free period ended", detail: "Premium account", monthly: 4532, extra: 0 },
    vip_extra: { plan: "Premium", free: "Free period ended", detail: "Premium account", monthly: 6000, extra: 60 }
  };
  let selected = "day1";
  try { selected = localStorage.getItem(key) || selected; } catch (_) {}
  if (!states[selected]) selected = "day1";

  function balanceMarkup(state) {
    const total = (state.monthly || 0) + state.extra;
    return `<div class="account-balance"><div><span>Available Stamina</span><strong>${total.toLocaleString()}</strong></div><div class="account-balance-row"><span>Free messages</span><span>${state.free}</span></div><div class="account-balance-row"><span>Free period</span><span>${state.detail}</span></div>${state.monthly !== null ? `<div class="account-balance-row"><span>Monthly Stamina</span><span>${state.monthly.toLocaleString()}</span></div>` : ""}<div class="account-balance-row"><span>Extra Stamina</span><span>${state.extra.toLocaleString()}</span></div></div>`;
  }

  const toggle = document.querySelector(".account-toggle");
  let menu;
  if (toggle) {
    menu = document.createElement("div");
    menu.className = "account-popover";
    menu.hidden = true;
    toggle.closest(".account").append(menu);
    toggle.setAttribute("aria-controls", "account-popover");
    menu.id = "account-popover";
    toggle.addEventListener("click", () => {
      menu.hidden = !menu.hidden;
      toggle.setAttribute("aria-expanded", String(!menu.hidden));
    });
    document.addEventListener("click", (event) => {
      if (!toggle.closest(".account").contains(event.target)) {
        menu.hidden = true;
        toggle.setAttribute("aria-expanded", "false");
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !menu.hidden) {
        menu.hidden = true;
        toggle.setAttribute("aria-expanded", "false");
        toggle.focus();
      }
    });
  }

  function render() {
    const state = { ...states[selected] };
    let capacity = 150;
    if (state.extra > 0) {
      try {
        const saved = JSON.parse(localStorage.getItem("rizzora-web-extra-demo") || "null");
        if (Number.isFinite(saved?.balance) && Number.isFinite(saved?.capacity) && saved.balance >= 0 && saved.capacity > 0) {
          state.extra = saved.balance;
          capacity = saved.capacity;
        }
      } catch (_) {}
    }
    let billing = "quarterly";
    try { billing = localStorage.getItem("rizzora-web-billing-demo") || billing; } catch (_) {}
    const billingLabel = { monthly: "Monthly", quarterly: "Quarterly", yearly: "Yearly" }[billing] || "Quarterly";
    if (menu) menu.innerHTML = `<div class="account-popover-head"><strong>Mumu</strong><span>${state.plan} · Demo</span></div>${balanceMarkup(state)}<a href="user-center.html">Account &amp; Stamina →</a>`;
    const plan = document.querySelector("[data-account-plan]");
    if (plan) {
      plan.textContent = state.plan;
      plan.classList.toggle("is-premium", state.plan === "Premium");
    }
    const balance = document.querySelector("[data-account-balance]");
    if (balance) balance.innerHTML = balanceMarkup(state);
    const membership = document.querySelector("[data-membership-copy]");
    if (membership) {
      const isVip = state.plan === "Premium";
      const pack = state.extra > 0 ? `<div class="stamina-line"><div><span>Stamina Pack</span><strong>⚡ ${state.extra.toLocaleString()}/${capacity.toLocaleString()}</strong></div><div class="stamina-track"><span style="width: ${Math.min(100, state.extra / capacity * 100)}%"></span></div><small>Expiry terms to be confirmed</small></div>` : "";
      const monthly = isVip ? `<div class="stamina-line"><div><span>Monthly Stamina</span><strong>⚡ ${state.monthly}/6000</strong></div><div class="stamina-track is-gold"><span style="width: ${state.monthly / 6000 * 100}%"></span></div><small>Reset date shown in your plan</small></div>` : "";
      membership.innerHTML = `<div class="reference-membership-head"><span>Membership</span>${isVip ? `<div><strong>VIP plan</strong> <small>${billingLabel} Billing</small></div>` : '<b>Free Plan</b>'}</div>${pack || monthly ? `<div class="stamina-panel">${pack}${monthly}</div>` : ""}<a class="reference-gold-action" href="vip.html">${isVip ? 'View Plan' : 'Become VIP, get 6000 st/month'}</a><a class="reference-supplement" href="stamina-supplement.html"><img src="images/gifts/coffee-soft.png" alt="" /> Stamina Supplement</a>${pack || isVip ? '<a class="reference-record" href="purchase-records.html#records">Purchase Record ›</a>' : ''}`;
    }
    const select = document.querySelector("#account-demo-state");
    if (select) select.value = selected;
    const chatStatus = document.querySelector(".chat-stamina-status");
    if (chatStatus) chatStatus.textContent = selected.startsWith("day") && selected !== "day4" ? `${state.free} · ${state.detail}` : `Stamina: ${((state.monthly || 0) + state.extra).toLocaleString()} · shared across companions`;
  }

  const select = document.querySelector("#account-demo-state");
  function setState(next) {
    selected = next;
    try { localStorage.setItem(key, selected); } catch (_) {}
    render();
  }
  select?.addEventListener("change", () => {
    setState(select.value);
  });
  document.querySelectorAll("[data-demo-action]").forEach((button) => {
    button.addEventListener("click", () => setState(button.dataset.demoAction));
  });
  const profile = document.querySelector(".account-profile-button");
  const stateMenu = document.querySelector("#state-menu");
  profile?.addEventListener("click", () => {
    stateMenu.hidden = !stateMenu.hidden;
    profile.setAttribute("aria-expanded", String(!stateMenu.hidden));
  });
  stateMenu?.querySelectorAll("[data-state]").forEach((button) => button.addEventListener("click", () => {
    try { localStorage.removeItem("rizzora-web-extra-demo"); } catch (_) {}
    setState(button.dataset.state);
    stateMenu.hidden = true;
    profile.setAttribute("aria-expanded", "false");
    profile.focus();
  }));
  const composer = document.querySelector(".message-composer");
  if (composer) {
    const status = document.createElement("a");
    status.className = "chat-stamina-status";
    status.href = "user-center.html";
    composer.prepend(status);
  }
  render();
})();
