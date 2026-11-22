window.createRizzoraPortalAuth = ({ content, show, onAuthenticated, service = window.RizzoraAuthService }) => {
  const isDemo = !service;
  const adapter = service || {
    async requestEmailCode() { return { expiresInSeconds: 300, resendAfterSeconds: 30 }; },
    async verifyEmailCode(email, code) {
      if (code !== "123456") throw new Error("That code doesn't match. Try again.");
      return { name: "Explorer", unreadCount: 3, isDemo: true };
    },
  };
  let active = false;
  let step = "methods";
  let email = "";
  let error = "";
  let busy = false;
  let revision = 0;
  let request = null;
  let popupAttempt = null;
  let timer = null;
  let expiresAt = 0;
  let resendAt = 0;
  let characterName = "";
  const escape = (value) => {
    const span = document.createElement("span");
    span.textContent = value;
    return span.innerHTML;
  };
  const icon = (name) => `<img class="icon" src="assets/${name}.svg" alt="">`;
  const demoNotice = () => isDemo ? '<p class="auth-demo-notice">Preview mode · no real account is connected.</p>' : "";

  function clearTimer() { if (timer !== null) window.clearInterval(timer); timer = null; }
  function clearAttempt() {
    if (popupAttempt) {
      const button = content.querySelector(`[data-auth="${popupAttempt.provider}"]`);
      if (button) {
        button.removeAttribute("aria-busy");
        button.querySelector("span").textContent = `Continue with ${popupAttempt.provider === "google" ? "Google" : "Facebook"}`;
      }
    }
    if (popupAttempt?.popup && !popupAttempt.popup.closed) popupAttempt.popup.close();
    popupAttempt = null;
  }
  function cancelAuthorization(message) {
    revision += 1;
    request?.abort();
    clearAttempt();
    clearTimer();
    setBusy(false);
    announceError(message);
  }
  function close() {
    active = false;
    busy = false;
    revision += 1;
    request?.abort();
    request = null;
    clearTimer();
    clearAttempt();
  }
  function announceError(message) {
    error = message;
    const node = content.querySelector("#auth-error");
    if (node) { node.textContent = error; node.hidden = !error; }
  }
  function setBusy(value, pendingLabel) {
    busy = value;
    content.querySelectorAll(".auth-form button, .auth-form input, [data-auth], [data-auth-back]").forEach((node) => { node.disabled = value; });
    const primary = content.querySelector(".auth-submit");
    if (primary) {
      primary.setAttribute("aria-busy", String(value));
      primary.querySelector("span").textContent = value ? (pendingLabel || (step === "email" ? "Sending..." : "Verifying...")) : (step === "email" ? "Send code" : "Verify & continue");
    }
    updateCountdown();
  }
  function updateCountdown() {
    const resend = content.querySelector("[data-auth-resend]");
    if (!resend) return;
    const seconds = Math.max(0, Math.ceil((resendAt - Date.now()) / 1000));
    resend.disabled = busy || seconds > 0;
    resend.textContent = seconds ? `Resend in ${seconds}s` : "Resend code";
  }
  function render(focus = true) {
    clearTimer();
    const heading = step === "methods" ? (characterName ? `Say hello to ${escape(characterName)}.` : "Welcome to Rizzora.")
      : step === "email" ? "What's your email?" : "Check your inbox.";
    const back = step !== "methods" ? `<button class="auth-back" type="button" data-auth-back aria-label="Back">${icon("arrow")}</button>` : "";
    let body = "";
    if (step === "methods") {
      body = `<p class="auth-subtitle">Your next conversation starts here.</p><div class="auth-providers">
        <button class="auth-provider" type="button" data-auth="google">${icon("google")}<span>Continue with Google</span>${icon("external")}</button>
        <button class="auth-provider" type="button" data-auth="facebook">${icon("facebook")}<span>Continue with Facebook</span>${icon("external")}</button>
        </div><div class="auth-divider"><span>or</span></div>
        <button class="auth-provider" type="button" data-auth="email">${icon("mail")}<span>Continue with email</span>${icon("arrow")}</button>`;
    } else if (step === "email") {
      body = `<form class="auth-form" id="auth-email-form" novalidate><label for="auth-email">Email address</label><div class="auth-input">${icon("mail")}<input id="auth-email" type="email" name="email" autocomplete="email" maxlength="254" placeholder="you@example.com" required aria-describedby="auth-error"></div><button class="auth-submit" type="submit"><span>Send code</span>${icon("arrow")}</button></form>`;
    } else {
      body = `<p class="auth-subtitle">${isDemo ? "Code for" : "Enter the code sent to"} <strong>${escape(email)}</strong></p>
        <form class="auth-form" id="auth-code-form" novalidate><label for="auth-code">Verification code</label><input class="auth-code" id="auth-code" name="code" type="text" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" placeholder="000000" required aria-describedby="auth-error${isDemo ? " auth-demo-code" : ""}"><button class="auth-submit" type="submit"><span>Verify & continue</span>${icon("arrow")}</button></form>
        <div class="auth-code-actions"><button type="button" data-auth-resend>Resend code</button><button type="button" data-auth-change>Change email</button></div>
        ${isDemo ? '<p class="auth-demo-code" id="auth-demo-code">Demo code: <strong>123456</strong> · No email is sent.</p>' : ""}`;
    }
    show(`<div class="auth-content">${back}<img class="auth-brand" src="assets/logo.svg" alt="" width="32" height="32"><h2 id="dialog-title">${heading}</h2>${body}<p class="auth-error" id="auth-error" role="alert" ${error ? "" : "hidden"}>${escape(error)}</p>${demoNotice()}<div class="auth-legal"><button type="button" data-legal="terms">Terms of use</button><span>·</span><button type="button" data-legal="privacy">Privacy policy</button></div></div>`, { auth: true, focusSelector: focus ? (step === "email" ? "#auth-email" : step === "code" ? "#auth-code" : '[data-auth="google"]') : ".dialog-close" });
    if (step === "email") content.querySelector("#auth-email").value = email;
    setBusy(busy);
    if (step === "code") timer = window.setInterval(updateCountdown, 1000);
  }
  function complete(user) {
    if (!active) return;
    if (!user || typeof user.name !== "string" || !user.name.trim()) throw new Error("Couldn't confirm this account. Try again.");
    close();
    onAuthenticated(user);
  }
  async function sendCode() {
    if (busy) return;
    const input = content.querySelector("#auth-email");
    if (input) email = input.value.trim();
    if (!email || (input && !input.checkValidity())) {
      input?.setAttribute("aria-invalid", "true");
      announceError("Enter a valid email address.");
      return;
    }
    announceError("");
    setBusy(true, "Sending...");
    const version = ++revision;
    request?.abort();
    request = new AbortController();
    try {
      const response = await adapter.requestEmailCode(email, { signal: request.signal });
      if (!active || version !== revision) return;
      expiresAt = Date.now() + Math.max(30, Math.min(900, Number(response?.expiresInSeconds) || 300)) * 1000;
      resendAt = Date.now() + Math.max(1, Math.min(300, Number(response?.resendAfterSeconds) || 30)) * 1000;
      step = "code";
      busy = false;
      render();
    } catch (failure) {
      if (!active || version !== revision) return;
      setBusy(false);
      announceError(failure.message || "Couldn't send the code. Try again.");
    }
  }
  async function verifyCode() {
    if (busy) return;
    const input = content.querySelector("#auth-code");
    if (!input.checkValidity()) { input.setAttribute("aria-invalid", "true"); announceError("Enter the 6-digit code."); return; }
    if (Date.now() >= expiresAt) { announceError("This code has expired. Request a new one."); return; }
    announceError("");
    setBusy(true);
    const version = ++revision;
    request?.abort();
    request = new AbortController();
    try {
      const user = await adapter.verifyEmailCode(email, input.value.trim(), { signal: request.signal });
      if (active && version === revision) complete(user);
    } catch (failure) {
      if (!active || version !== revision) return;
      setBusy(false);
      input.setAttribute("aria-invalid", "true");
      announceError(failure.message || "Couldn't verify the code. Try again.");
    }
  }
  function startProvider(provider) {
    if (busy || !["google", "facebook"].includes(provider)) return;
    announceError("");
    const bytes = new Uint8Array(16);
    window.crypto.getRandomValues(bytes);
    const attempt = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
    const url = new URL("auth-preview.html", location.href);
    url.searchParams.set("provider", provider);
    url.searchParams.set("attempt", attempt);
    url.searchParams.set("parent_origin", location.origin);
    const popup = window.open(isDemo ? url.href : "about:blank", "rizzora-authorization", "popup,width=480,height=640,resizable=yes,scrollbars=yes");
    if (!popup) { announceError("The authorization window was blocked. Please try again."); return; }
    setBusy(true);
    const version = ++revision;
    popupAttempt = { popup, attempt, provider, expiresAt: Date.now() + 120000, origin: url.origin };
    const button = content.querySelector(`[data-auth="${provider}"]`);
    button.setAttribute("aria-busy", "true");
    button.querySelector("span").textContent = "Waiting for authorization...";
    clearTimer();
    timer = window.setInterval(() => {
      if (popup.closed || Date.now() >= popupAttempt?.expiresAt) {
        cancelAuthorization(popup.closed ? "Authorization was cancelled." : "Authorization timed out. Try again.");
      }
    }, 400);
    if (!isDemo) {
      request?.abort();
      request = new AbortController();
      Promise.resolve().then(() => adapter.startOAuth(provider, { popup, returnTo: location.href, signal: request.signal }))
        .then((user) => { if (active && revision === version) complete(user); })
        .catch((failure) => {
          if (!active || revision !== version) return;
          clearAttempt(); clearTimer(); setBusy(false);
          announceError(failure.message || "Authorization failed. Try again.");
        });
    }
  }
  window.addEventListener("message", (event) => {
    const pending = popupAttempt;
    if (!isDemo || !active || !pending || Date.now() >= pending.expiresAt || event.source !== pending.popup || event.origin !== pending.origin) return;
    const data = event.data;
    if (!data || data.type !== "rizzora:auth-preview" || data.attempt !== pending.attempt || data.provider !== pending.provider) return;
    if (data.result === "approved") complete({ name: "Explorer", unreadCount: 3, isDemo: true });
    else if (data.result === "cancelled") cancelAuthorization("Authorization was cancelled.");
  });
  content.addEventListener("click", (event) => {
    if (!active) return;
    const target = event.target.closest("button");
    if (!target || target.disabled) return;
    if (target.dataset.auth === "email") { step = "email"; error = ""; render(); }
    else if (target.dataset.auth) startProvider(target.dataset.auth);
    else if (target.hasAttribute("data-auth-back")) { step = step === "code" ? "email" : "methods"; error = ""; render(); }
    else if (target.hasAttribute("data-auth-change")) { step = "email"; error = ""; render(); }
    else if (target.hasAttribute("data-auth-resend") && Date.now() >= resendAt) sendCode();
  });
  content.addEventListener("submit", (event) => {
    if (!active || !["auth-email-form", "auth-code-form"].includes(event.target.id)) return;
    event.preventDefault();
    if (step === "email") sendCode(); else verifyCode();
  });
  content.addEventListener("input", (event) => {
    if (!active) return;
    event.target.removeAttribute("aria-invalid");
    if (event.target.id === "auth-code") event.target.value = event.target.value.replace(/\D/g, "").slice(0, 6);
    if (event.target.id === "auth-email") email = event.target.value;
    announceError("");
  });
  window.addEventListener("pagehide", close);
  return {
    open({ character = "" } = {}) {
      close(); active = true; step = "methods"; email = ""; error = ""; characterName = character;
      render();
    },
    close,
  };
};
