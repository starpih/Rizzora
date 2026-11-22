(() => {
  const characters = window.RizzoraCharacters;
  const storageKey = "rizzora.spark.discovery.v1";
  const deck = document.querySelector("#spark-deck");
  const swipeView = document.querySelector("#swipe-view");
  const shortlistView = document.querySelector("#shortlist-view");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let choices = readChoices();
  let busy = false;
  let gesture = null;

  function readChoices() {
    try {
      const value = JSON.parse(sessionStorage.getItem(storageKey) || "[]");
      if (!Array.isArray(value) || value.length > characters.length) return [];
      return value.every((choice, index) => choice && choice.id === characters[index].id
        && ["like", "pass"].includes(choice.decision)) ? value : [];
    } catch {
      return [];
    }
  }
  function saveChoices() {
    try { sessionStorage.setItem(storageKey, JSON.stringify(choices)); } catch { /* Session storage may be unavailable for local files. */ }
  }
  const icon = (name) => `<img class="icon" src="assets/${name}.svg" alt="">`;
  const profileUrl = (character) => `index.html?companion=${encodeURIComponent(character.id)}#discover`;
  const likedCharacters = () => choices.filter((choice) => choice.decision === "like")
    .map((choice) => characters.find((character) => character.id === choice.id));

  function updateCount() {
    const count = likedCharacters().length;
    document.querySelector("#saved-count").textContent = count;
    document.querySelector("#open-shortlist").setAttribute("aria-label", `View shortlist, ${count} ${count === 1 ? "companion" : "companions"}`);
    document.querySelector("#discovery-progress").max = characters.length;
    document.querySelector("#discovery-progress").value = choices.length;
    document.querySelector("#card-count").textContent = `${Math.min(choices.length + 1, characters.length)} / ${characters.length}`;
    document.querySelector("#undo-choice").disabled = busy || choices.length === 0;
    document.querySelectorAll("#pass-choice, #like-choice").forEach((button) => {
      button.disabled = busy || choices.length === characters.length;
    });
  }
  function announce(text) { document.querySelector("#spark-status").textContent = text; }
  function render(moveFocus = false) {
    busy = false;
    gesture = null;
    updateCount();
    if (choices.length === characters.length) {
      showShortlist(moveFocus);
      return;
    }
    swipeView.hidden = false;
    shortlistView.hidden = true;
    document.title = "Find Your Spark | Rizzora";
    const current = characters[choices.length];
    const behind = characters.slice(choices.length + 1, choices.length + 3);
    deck.innerHTML = behind.map((character) => `<div class="spark-card is-behind" aria-hidden="true"><img src="${character.image}" alt="" draggable="false"></div>`).join("")
      + `<article class="spark-card is-current" tabindex="0" aria-label="${current.name}, ${current.profession}, ${current.nationality}">
        <img src="${current.image}" alt="${current.name}, an AI companion" draggable="false">
        <span class="spark-choice is-like" aria-hidden="true">${icon("heart")}Interested</span>
        <span class="spark-choice is-pass" aria-hidden="true">Pass${icon("close")}</span>
        <div class="spark-profile"><h2>${current.name}</h2><p class="spark-meta">${current.nationality} · ${current.profession}</p>
        <p class="spark-summary">${current.summary}</p><div class="companion-traits">${current.traits.map((trait) => `<span>${trait}</span>`).join("")}</div>
        <a class="spark-profile-link" href="${profileUrl(current)}">View profile${icon("external")}</a></div>
      </article>`;
    const card = deck.querySelector(".is-current");
    bindDrag(card);
    if (moveFocus) card.focus({ preventScroll: true });
  }
  function setDrag(card, x, y = 0) {
    card.style.setProperty("--drag-x", `${x}px`);
    card.style.setProperty("--drag-y", `${y * .2}px`);
    card.style.setProperty("--drag-angle", `${Math.max(-16, Math.min(16, x / 18))}deg`);
    card.style.setProperty("--like-opacity", String(Math.min(1, Math.max(0, x / 90))));
    card.style.setProperty("--pass-opacity", String(Math.min(1, Math.max(0, -x / 90))));
  }
  function choose(decision) {
    if (busy || swipeView.hidden || choices.length === characters.length) return;
    busy = true;
    gesture = null;
    updateCount();
    const current = characters[choices.length];
    const card = deck.querySelector(".is-current");
    card.classList.remove("is-dragging");
    card.classList.add("is-leaving");
    const width = deck.getBoundingClientRect().width || 320;
    setDrag(card, (decision === "like" ? 1 : -1) * (width + 160));
    window.setTimeout(() => {
      choices.push({ id: current.id, decision });
      saveChoices();
      announce(`${current.shortName} ${decision === "like" ? "added to your shortlist" : "passed"}.`);
      render(true);
    }, reducedMotion.matches ? 0 : 220);
  }
  function undo() {
    if (busy || choices.length === 0) return;
    const previous = choices.pop();
    saveChoices();
    render(true);
    announce(`Choice for ${characters.find((character) => character.id === previous.id).shortName} undone.`);
  }
  function bindDrag(card) {
    function cancel() {
      gesture = null;
      card.classList.remove("is-dragging");
      setDrag(card, 0);
    }
    card.addEventListener("pointerdown", (event) => {
      if (busy || event.button !== 0 || event.target.closest("a, button")) return;
      gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, dx: 0, dy: 0, horizontal: false };
      card.setPointerCapture?.(event.pointerId);
    });
    card.addEventListener("pointermove", (event) => {
      if (!gesture || gesture.id !== event.pointerId) return;
      gesture.dx = event.clientX - gesture.x;
      gesture.dy = event.clientY - gesture.y;
      if (!gesture.horizontal) {
        if (Math.abs(gesture.dy) > 12 && Math.abs(gesture.dy) > Math.abs(gesture.dx)) {
          cancel();
          return;
        }
        if (Math.abs(gesture.dx) < 10 || Math.abs(gesture.dx) <= Math.abs(gesture.dy)) return;
        gesture.horizontal = true;
      }
      event.preventDefault();
      card.classList.add("is-dragging");
      setDrag(card, gesture.dx, gesture.dy);
    });
    card.addEventListener("pointerup", (event) => {
      if (!gesture || gesture.id !== event.pointerId) return;
      const { dx, horizontal } = gesture;
      gesture = null;
      card.classList.remove("is-dragging");
      if (card.hasPointerCapture?.(event.pointerId)) card.releasePointerCapture(event.pointerId);
      const threshold = Math.min(100, (deck.getBoundingClientRect().width || 320) * .24);
      if (horizontal && Math.abs(dx) >= threshold) choose(dx > 0 ? "like" : "pass");
      else setDrag(card, 0);
    });
    card.addEventListener("pointercancel", cancel);
    card.addEventListener("lostpointercapture", () => { if (gesture) cancel(); });
  }
  function showShortlist(moveFocus = true) {
    if (busy) return;
    const liked = likedCharacters();
    swipeView.hidden = true;
    shortlistView.hidden = false;
    document.title = "Your Sparks | Rizzora";
    document.querySelector("#shortlist-summary").textContent = liked.length
      ? `${liked.length} ${liked.length === 1 ? "companion caught" : "companions caught"} your eye.` : "A connection is worth being curious about.";
    document.querySelector("#shortlist-empty").hidden = liked.length > 0;
    document.querySelector("#shortlist-cards").innerHTML = liked.map((character) => `<article class="spark-result">
      <a href="${profileUrl(character)}" aria-label="View ${character.name}"><img class="spark-result-cover" src="${character.image}" alt="${character.name}" loading="lazy"></a>
      <h2>${character.name}</h2><p>${character.summary}</p><a class="spark-profile-link" href="${profileUrl(character)}">View profile${icon("external")}</a></article>`).join("");
    document.querySelector("#continue-discovery").hidden = choices.length === characters.length;
    document.querySelector("#undo-result").hidden = choices.length === 0;
    updateCount();
    if (moveFocus) {
      const title = document.querySelector("#shortlist-title");
      title.tabIndex = -1;
      title.focus({ preventScroll: true });
    }
  }
  document.querySelector("#pass-choice").addEventListener("click", () => choose("pass"));
  document.querySelector("#like-choice").addEventListener("click", () => choose("like"));
  document.querySelector("#undo-choice").addEventListener("click", undo);
  document.querySelector("#undo-result").addEventListener("click", undo);
  document.querySelector("#open-shortlist").addEventListener("click", () => showShortlist());
  document.querySelector("#continue-discovery").addEventListener("click", () => render(true));
  document.querySelector("#restart-discovery").addEventListener("click", () => {
    choices = [];
    saveChoices();
    render(true);
    announce("Discovery restarted.");
  });
  document.addEventListener("keydown", (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.target.closest?.("a, input, textarea, select")) return;
    if (!swipeView.hidden && ["ArrowLeft", "ArrowRight"].includes(event.key)) {
      event.preventDefault();
      choose(event.key === "ArrowRight" ? "like" : "pass");
    }
  });
  render();
})();
