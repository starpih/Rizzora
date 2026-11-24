(() => {
  const hero = document.querySelector(".hero");
  const slides = [...hero.querySelectorAll(".hero-slide")];
  const name = hero.querySelector(".hero-character-name");
  const story = hero.querySelector(".hero-story");
  const firstStory = story.textContent;
  const portraits = [...hero.querySelectorAll("[data-show-hero]")];
  const explore = hero.querySelector(".hero-secondary");
  const cta = hero.querySelector(".hero-cta");
  const play = hero.querySelector("#hero-play");
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let active = 0;
  let paused = motion.matches;
  let visible = true;
  let hovering = false;
  let focusing = false;
  let selection = 0;
  let timer;

  function sync() {
    window.clearTimeout(timer);
    const label = paused ? "Play slideshow" : "Pause slideshow";
    play.setAttribute("aria-label", label);
    play.title = label;
    play.innerHTML = `<img class="icon" src="assets/${paused ? "play" : "pause"}.svg" alt="">`;
    if (paused || !visible || hovering || focusing || document.hidden || document.querySelector("dialog[open]") || document.body.dataset.view !== "home") return;
    timer = window.setTimeout(() => select(active + 1), 7000);
  }

  function select(index) {
    const request = ++selection;
    const next = (index + slides.length) % slides.length;
    const slide = slides[next];
    // Keep the current scene visible if the next asset is still loading or failed.
    if (!slide.complete || !slide.naturalWidth) {
      slide.loading = "eager";
      if (!slide.complete) slide.decode?.().then(() => { if (request === selection) select(index); }).catch(() => {});
      sync();
      return;
    }
    active = next;
    slides.forEach((item, i) => item.classList.toggle("is-active", i === active));
    name.textContent = `A moment with ${slide.dataset.heroName}`;
    story.textContent = slide.dataset.story || firstStory;
    portraits.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.showHero === slide.dataset.heroCharacter)));
    const profile = window.RizzoraCharacters.find((c) => c.id === slide.dataset.heroCharacter);
    cta.href = profile ? `#character/${profile.id}` : "#discover";
    explore.hidden = !profile;
    cta.innerHTML = `${profile ? `Meet ${slide.dataset.heroName}` : "Explore the characters"} <img class="icon" src="assets/arrow.svg" alt="">`;
    sync();
  }

  for (const button of portraits) {
    const index = slides.findIndex((slide) => slide.dataset.heroCharacter === button.dataset.showHero);
    if (index !== -1) button.addEventListener("click", () => select(index));
  }
  hero.querySelector("#hero-previous").addEventListener("click", () => select(active - 1));
  hero.querySelector("#hero-next").addEventListener("click", () => select(active + 1));
  play.addEventListener("click", () => { paused = !paused; sync(); });
  hero.addEventListener("mouseenter", () => { hovering = true; sync(); });
  hero.addEventListener("mouseleave", () => { hovering = false; sync(); });
  hero.addEventListener("focusin", () => { focusing = true; sync(); });
  hero.addEventListener("focusout", (event) => { focusing = hero.contains(event.relatedTarget); sync(); });
  document.addEventListener("visibilitychange", sync);
  document.querySelector("#portal-dialog").addEventListener("close", sync);
  motion.addEventListener("change", () => { if (motion.matches) paused = true; sync(); });
  if ("IntersectionObserver" in window) new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }).observe(hero);
  new MutationObserver(sync).observe(document.querySelector("#portal-dialog"), { attributes: true, attributeFilter: ["open"] });
  window.RizzoraHero = { sync };
  sync();
})();
