(() => {
  const preview = document.querySelector(".world-preview");
  if (!preview) return;
  // Creative vignettes grounded in existing character interests and Hero stories.
  // Hayes has no full profile; his moments use only the existing bookshop scene.
  const moments = {
  "chris": [
    [
      "Sunsets",
      "The light is changing, so Chris leaves his phone face down. There is still time to watch the room turn gold."
    ],
    [
      "Photography",
      "He turns the camera toward an ordinary corner. “Look at what the light is doing.”"
    ],
    [
      "Travel",
      "A map stays open between you. For now, choosing a direction is enough."
    ],
    [
      "Night drives",
      "The road is quiet and the playlist is yours. Chris lets the next song finish before speaking."
    ],
    [
      "Shared songs",
      "The song you sent is still playing. He moves his sweater off the sofa and saves you a seat."
    ]
  ],
  "kim": [
    [
      "Music",
      "Kim is still humming the encore. When you arrive, he starts it again, just loud enough for two."
    ],
    [
      "Dance",
      "One last rehearsal count, then a smile. He asks which part you would like to see again."
    ],
    [
      "Street photography",
      "He pauses where the evening light meets a shop window. A small moment is worth keeping."
    ],
    [
      "Café stops",
      "The cups arrive while you are halfway through a story. Kim waits for the ending before taking a sip."
    ],
    [
      "River runs",
      "The pace eases beside the river. There is no hurry to turn the quiet into conversation."
    ]
  ],
  "julian": [
    [
      "Jazz piano",
      "A few notes linger after Julian takes his hands off the keys. He leaves the ending open for a moment."
    ],
    [
      "Literature",
      "He turns back a page to read a line again. “What do you think they meant?”"
    ],
    [
      "Sailing",
      "The conversation settles into the rhythm of the water. For once, there is nothing to fit into a schedule."
    ],
    [
      "Late nights",
      "The evening has grown quiet without either of you noticing. Julian asks for one more story."
    ],
    [
      "Unfinished stories",
      "The elevator arrives, but he lets the doors close. He would rather hear how your story ends."
    ]
  ],
  "enzo": [
    [
      "Motorsport",
      "The noise has faded, and Enzo is ready to listen. He asks what your day felt like."
    ],
    [
      "Cooking",
      "Something is warming on the stove. Enzo hands you a spoon and asks what it needs."
    ],
    [
      "Road trips",
      "The route can wait a minute. There is a view worth stopping for."
    ],
    [
      "Morning workouts",
      "The last stretch is unhurried. Enzo makes room for a quiet start to the day."
    ],
    [
      "Coastal evenings",
      "You lose count of the lights along the coast. Neither of you seems to mind starting again."
    ]
  ],
  "hayes": [
    [
      "Bookshops",
      "Rain taps the window while Hayes turns a page. The bookshop feels a little quieter here."
    ],
    [
      "Rainy afternoons",
      "The rain gives you a reason to stay. He leaves the next page unturned."
    ],
    [
      "Bookmarks",
      "Hayes slips a bookmark into place. Some stories are worth returning to together."
    ],
    [
      "Last chapters",
      "There are only a few pages left. “Shall we save them for another rainy day?”"
    ],
    [
      "Quiet company",
      "For a while, the pages do the talking. You do not have to fill every silence."
    ]
  ]
};
  let current;
  function selectCharacter(id) {
    const slide = document.querySelector(`[data-hero-character="${id}"]`);
    if (!slide || !moments[id] || current === id) return;
    current = id;
    preview.dataset.world = id;
    preview.querySelector(".world-scene").src = slide.getAttribute("src");
    preview.querySelector(".world-name").textContent = slide.dataset.heroName;
    const group = preview.querySelector(".world-interests");
    group.setAttribute("aria-label", `Explore ${slide.dataset.heroName}'s interests`);
    const story = preview.querySelector(".world-story");
    story.textContent = "Choose a word for a small glimpse of his day.";
    group.replaceChildren(...moments[id].map(([word, text]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = word;
      button.setAttribute("aria-pressed", "false");
      button.setAttribute("aria-controls", "world-story");
      button.addEventListener("click", () => {
        group.querySelectorAll("button").forEach(item => item.setAttribute("aria-pressed", String(item === button)));
        const label = document.createElement("strong");
        label.textContent = word;
        const paragraph = document.createElement("p");
        paragraph.textContent = text;
        story.replaceChildren(label, paragraph);
      });
      return button;
    }));
    const profile = window.RizzoraCharacters.find(character => character.id === id);
    const cta = preview.querySelector(".world-cta");
    cta.href = profile ? `#character/${id}` : "#discover";
    cta.textContent = profile ? `Meet ${slide.dataset.heroName}` : "Explore the characters";
  }
  document.addEventListener("rizzora:hero-choice", event => selectCharacter(event.detail.id));
  selectCharacter("chris");
})();
