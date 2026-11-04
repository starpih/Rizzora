(() => {
  const submit = document.querySelector(".vip-submit");
  const result = document.querySelector(".vip-result");
  submit.addEventListener("click", () => {
    let state = "day1";
    const billing = document.querySelector('input[name="vip-plan"]:checked').value;
    try { state = localStorage.getItem("rizzora-web-account-demo") || state; } catch (_) {}
    try {
      localStorage.setItem("rizzora-web-account-demo", state === "extra" || state === "vip_extra" ? "vip_extra" : "vip");
      localStorage.setItem("rizzora-web-billing-demo", billing);
    } catch (_) {}
    result.hidden = false;
  });
})();
