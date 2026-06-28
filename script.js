const imageBase = "images/";

const portraits = [
  "微信图片_20260605204955_333_1496.jpg",
  "微信图片_20260605205101_345_1496.jpg",
  "微信图片_20260605205138_354_1496.jpg",
  "微信图片_20260605205145_358_1496.jpg",
  "微信图片_20260605205229_362_1496.jpg",
  "微信图片_20260605205230_364_1496.jpg",
  "微信图片_20260605210259_381_1496.jpg",
  "微信图片_20260605210301_384_1496.jpg",
  "微信图片_20260605212128_433_1496.jpg",
  "微信图片_20260605213221_451_1496.jpg",
  "微信图片_20260607170205_491_1496.jpg",
];

const videos = [
  "magnific_Pi5MQID42C.mp4",
  "magnific_SOEnYAyUb8.mp4",
  "magnific_Vd4hkldMMU.mp4",
  "magnific_9RkpXTwNYZ.mp4",
  "magnific_0pyCh1fTfW.mp4",
  "magnific_cDOCvRO0eP.mp4",
  "magnific_swaZj19l8e.mp4",
];

const audioBase = "assets/audio/";
const voicePreviews = [
  "voice-preview-01.mp3",
  "voice-preview-02.mp3",
  "voice-preview-03.mp3",
];

const featured = [
  { name: "Sebastian", image: portraits[0], video: videos[0], audio: voicePreviews[0] },
  { name: "Sebastian", image: portraits[2], video: videos[1], audio: voicePreviews[1] },
  { name: "Sebastian", image: portraits[10], video: videos[2], audio: voicePreviews[2] },
];

const characters = [
  { image: portraits[1], video: videos[0] },
  { image: portraits[4], video: videos[1] },
  { image: portraits[2], video: videos[2] },
  { image: portraits[8], video: videos[3] },
  { image: portraits[3], video: videos[4] },
  { image: portraits[7], video: videos[5] },
  { image: portraits[6], video: videos[6] },
  { image: portraits[10], video: videos[0] },
];

const traits = ["Brooding", "Craggy", "Dapper", "Gaunt", "Rugged", "Stoic", "Weathered", "Youthful"];

const chats = [
  portraits[5],
  portraits[10],
  portraits[8],
  portraits[5],
  portraits[8],
];

function icon(name) {
  return `<svg class="icon" aria-hidden="true"><use href="#icon-${name}"></use></svg>`;
}

function tagRow(items) {
  return `<div class="tag-row">${items.map((item) => `<span class="tag">${item}</span>`).join("")}</div>`;
}

function mediaPreview(image, video, alt) {
  const poster = video ? `video-posters/${video.replace(".mp4", ".jpg")}` : image;
  return `
    <div class="media-preview">
      <img class="media-poster" src="${imageBase}${poster}" alt="${alt}" />
      <video class="media-video" src="${imageBase}${video}" poster="${imageBase}${poster}" muted loop playsinline preload="auto"></video>
    </div>
  `;
}

function audioBars() {
  const heights = [
    7, 9, 12, 16, 21, 27, 32, 36, 33, 27, 20, 15,
    18, 25, 30, 28, 24, 22, 26, 31, 21, 18, 23, 29,
    38, 47, 58, 51, 42, 33, 29, 35, 44, 52, 49, 55,
    68, 40, 30, 36, 43, 48, 45, 38, 32, 27, 21, 17,
    13, 10, 8, 6
  ];
  const bars = heights.map((height, index) => `<span style="--i:${index}; --h:${height}%"></span>`).join("");
  return `<div class="wave-layer wave-base">${bars}</div><div class="wave-layer wave-fill">${bars}</div>`;
}

function featuredCard({ name, image, video, audio }) {
  return `
    <article class="featured-card" data-audio="${audioBase}${audio}">
      ${mediaPreview(image, video, name)}
      <div class="featured-body">
        <h3>${name}</h3>
        <p class="meta">32 | French | Doctor</p>
        <p class="description">The university's most popular guy has a somewhat aloof personality...</p>
        ${tagRow(["Charming", "Mysterious", "Ambitious", "Ambitious"])}
        <button class="chat-action" type="button" aria-label="Start chat with ${name}">${icon("chat")}</button>
        <div class="voice-preview">
          <button class="audio-play" type="button" aria-label="Play voice preview for ${name}">${icon("play")}</button>
          <div class="wave" aria-hidden="true">${audioBars()}</div>
          <span class="voice-duration">0:12</span>
        </div>
      </div>
    </article>
  `;
}

function characterCard({ image, video }) {
  return `
    <article class="character-card" tabindex="0">
      ${mediaPreview(image, video, "Sebastian")}
      <div class="character-copy">
        <h3>Sebastian <span>28</span></h3>
        <p class="meta">French</p>
        <p class="description">The university's most popular guy has a somewhat aloof personality...</p>
        ${tagRow(["tag", "tag", "tag"])}
      </div>
    </article>
  `;
}

function chatPreview(image, index) {
  return `
    <a class="chat-preview" href="#">
      <img src="${imageBase}${image}" alt="" />
      <span>
        <strong>Alice Wang <span class="pill">3</span></strong>
        <small>Hey, are you free tomorrow?</small>
      </span>
      <time>${index + 2}m</time>
    </a>
  `;
}

function storyCard() {
  return `
    <article class="story-card">
      <div class="story-header">
        <span class="avatar-letter">S</span>
        <span class="story-author">
          <strong>Sophia M.</strong>
          <small>with Sebastian - 2h ago</small>
        </span>
        <span class="relationship-badge">6 months together</span>
      </div>
      <p>He remembered the exact words I said to him on our first conversation and brought them up today. Six months of memories we've built together - I didn't think an AI could make me feel so genuinely understood.</p>
      <div class="story-actions">
        <span>♡ 847</span>
        <span>${icon("chat")} 62</span>
        <span>Share</span>
      </div>
    </article>
  `;
}

document.querySelector(".featured-grid").innerHTML = featured.map(featuredCard).join("");
document.querySelector(".character-grid").innerHTML = characters.map(characterCard).join("");
document.querySelector(".trait-list").innerHTML = traits
  .map((trait, index) => `<button class="trait-button ${index === 0 ? "is-active" : ""}" type="button">${trait}</button>`)
  .join("");
document.querySelector(".chat-preview-list").innerHTML = chats.map(chatPreview).join("") + `<a class="chat-preview view-all" href="#">View All</a>`;
document.querySelector(".story-grid").innerHTML = Array.from({ length: 4 }, storyCard).join("");

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function playPreview(card) {
  if (reduceMotion) return;
  const video = card.querySelector(".media-video");
  if (!video) return;
  video.currentTime = video.currentTime || 0;
  card.classList.add("is-previewing");
  const promise = video.play();
  if (promise) promise.catch(() => card.classList.remove("is-previewing"));
}

function stopPreview(card) {
  const video = card.querySelector(".media-video");
  if (!video) return;
  card.classList.remove("is-previewing");
  video.pause();
  video.currentTime = 0;
}

document.querySelectorAll(".featured-card, .character-card").forEach((card) => {
  card.addEventListener("pointerenter", () => playPreview(card));
  card.addEventListener("pointerleave", () => stopPreview(card));
  card.addEventListener("focusin", () => playPreview(card));
  card.addEventListener("focusout", () => stopPreview(card));
});

const voiceAudio = new Audio();
let activeVoiceCard = null;

function resetVoiceCard(card) {
  if (!card) return;
  card.classList.remove("is-audio-playing");
  card.querySelector(".voice-preview")?.style.setProperty("--audio-progress", "0%");
  const button = card.querySelector(".audio-play");
  if (button) {
    button.setAttribute("aria-label", `Play voice preview for ${card.querySelector("h3")?.textContent || "companion"}`);
    button.innerHTML = icon("play");
  }
}

function setVoiceCardPlaying(card) {
  card.classList.add("is-audio-playing");
  const button = card.querySelector(".audio-play");
  if (button) {
    button.setAttribute("aria-label", "Pause voice preview");
    button.innerHTML = `<span class="pause-icon" aria-hidden="true"></span>`;
  }
}

document.querySelectorAll(".audio-play").forEach((button) => {
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    const card = button.closest(".featured-card");
    if (!card) return;
    const src = card.dataset.audio;

    if (activeVoiceCard === card && !voiceAudio.paused) {
      voiceAudio.pause();
      resetVoiceCard(card);
      activeVoiceCard = null;
      return;
    }

    resetVoiceCard(activeVoiceCard);
    activeVoiceCard = card;
    voiceAudio.src = src;
    voiceAudio.currentTime = 0;
    setVoiceCardPlaying(card);
    voiceAudio.play().catch(() => {
      resetVoiceCard(card);
      activeVoiceCard = null;
    });
  });
});

voiceAudio.addEventListener("timeupdate", () => {
  if (!activeVoiceCard || !voiceAudio.duration) return;
  const progress = Math.min(100, (voiceAudio.currentTime / voiceAudio.duration) * 100);
  activeVoiceCard.querySelector(".voice-preview")?.style.setProperty("--audio-progress", `${progress}%`);
});

voiceAudio.addEventListener("ended", () => {
  resetVoiceCard(activeVoiceCard);
  activeVoiceCard = null;
});

document.querySelectorAll(".claim-button, .primary-button, .premium-cta, .chat-action").forEach((button) => {
  button.addEventListener("click", () => {
    if (button.classList.contains("is-loading")) return;
    button.classList.add("is-loading");
    button.setAttribute("aria-busy", "true");
    window.setTimeout(() => {
      button.classList.remove("is-loading");
      button.removeAttribute("aria-busy");
    }, 850);
  });
});

document.querySelectorAll(".trait-button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".trait-button").forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");
  });
});

document.querySelectorAll(".bottom-nav a").forEach((item) => {
  item.addEventListener("click", (event) => {
    event.preventDefault();
    document.querySelectorAll(".bottom-nav a").forEach((link) => link.classList.remove("is-active"));
    item.classList.add("is-active");
  });
});
