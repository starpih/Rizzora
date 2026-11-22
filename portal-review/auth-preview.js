(() => {
  const params = new URLSearchParams(location.search);
  const provider = params.get("provider");
  const attempt = params.get("attempt") || "";
  const parentOrigin = params.get("parent_origin");
  const valid = ["google", "facebook"].includes(provider) && /^[a-f0-9]{32}$/.test(attempt)
    && parentOrigin === location.origin && window.opener;
  if (!valid) {
    document.querySelector("#preview-status").textContent = "This preview request is no longer available. Return to Rizzora and try again.";
    return;
  }
  document.querySelector("#preview-title").textContent = `${provider === "google" ? "Google" : "Facebook"} sign-in preview.`;
  document.querySelector("#approve-preview").disabled = false;
  function reply(result) {
    window.opener.postMessage({ type: "rizzora:auth-preview", provider, attempt, result }, parentOrigin === "null" ? "*" : parentOrigin);
    document.querySelector("#approve-preview").disabled = true;
    document.querySelector("#preview-status").textContent = result === "approved" ? "Demo authorization complete. You can return to Rizzora." : "Authorization cancelled.";
    // The opener closes the popup after validating the reply.
  }
  document.querySelector("#approve-preview").addEventListener("click", () => reply("approved"));
  document.querySelector("#cancel-preview").addEventListener("click", () => reply("cancelled"));
})();
