(() => {
  const packs = [
    { name: "A Cup of Coffee", price: "$0.99", amount: "150", image: "coffee-soft.png" },
    { name: "A Sweet Dessert", price: "$1.99", amount: "300 + 50", image: "cake-soft.png" },
    { name: "A Hearty Lunch", price: "$2.99", amount: "450 + 150", image: "burger-soft.png" },
    { name: "A Movie Ticket", price: "$4.99", amount: "750 + 350", image: "movie-ticket-soft.png" },
    { name: "A Romantic Dinner", price: "$9.99", amount: "1500 + 700", image: "dinner-soft.png" }
  ];
  const container = document.querySelector(".supplement-options");
  const checkout = document.querySelector(".supplement-checkout");
  const result = document.querySelector(".supplement-result");
  let selected = 2;
  function render() {
    container.innerHTML = packs.map((pack, index) => `<label class="supplement-card ${selected === index ? "is-selected" : ""}"><input type="radio" name="pack" value="${index}" ${selected === index ? "checked" : ""} /><img src="images/gifts/${pack.image}" alt="" /><strong>${pack.name}</strong><span class="supplement-price">${pack.price}</span><span class="supplement-amount">${pack.amount} ⚡</span></label>`).join("");
    checkout.textContent = `Simulate purchase · ${packs[selected].price}`;
  }
  container.addEventListener("change", (event) => {
    if (event.target.name !== "pack") return;
    selected = Number(event.target.value);
    result.hidden = true;
    render();
    container.querySelector(`input[value="${selected}"]`)?.focus();
  });
  checkout.addEventListener("click", () => {
    let previous = "day1";
    try { previous = localStorage.getItem("rizzora-web-account-demo") || previous; } catch (_) {}
    try { localStorage.setItem("rizzora-web-account-demo", previous.startsWith("vip") ? "vip_extra" : "extra"); } catch (_) {}
    result.innerHTML = `Demo purchase selected: ${packs[selected].name}. The account will show a sample Stamina Pack balance. <a href="user-center.html">Back to User Center</a>`;
    result.hidden = false;
  });
  render();
})();
