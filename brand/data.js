(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.RizzoraBrand = api;
})(typeof window !== "undefined" ? window : null, function () {
  const IMAGE_ROOT = "../HTML/images/";
  const AUDIO_ROOT = "../HTML/assets/audio/";
  const ILLUSTRATIVE_UNIT = 1;
  const MONTHLY_VIP_STAMINA = 60000;
  const FREE_DAILY_MESSAGES = 10;

  const characters = [
    {
      id: "chris",
      name: "Chris Jones",
      shortName: "Chris",
      featured: true,
      image: "models/Chris/Chris_image.png",
      video: "models/Chris/Chris_v.mp4",
      nationality: ["Italian-American"],
      languages: ["English"],
      professions: ["AI founder"],
      hobbies: ["Fitness", "Travel", "Photography", "Night drives", "Sunsets"],
      personalities: ["Warm", "Romantic", "Playful", "Attentive", "Charismatic"],
      bio: "Chris is 22, Italian-American, and an AI startup co-founder in Los Angeles. The days are ambitious. The evenings are for sunsets and a conversation that actually stays.",
      replies: [
        "I'm here. Tell me the part of today you have not said out loud yet.",
        "Sunset light, and one honest sentence from you. That is enough for me.",
        "Start wherever it feels light, or wherever it feels heavy. I'll stay with it."
      ]
    },
    {
      id: "kim",
      name: "Kim Ji-hoon",
      shortName: "Kim",
      featured: true,
      image: "models/Kim/Kim_image.png",
      video: "models/Kim/Kim_v.mp4",
      nationality: ["South Korean"],
      languages: ["English", "Korean"],
      professions: ["Idol trainee", "Fashion model"],
      hobbies: ["Dance", "Street photography", "Café hops", "Han River runs"],
      personalities: ["Gentle", "Playful", "Optimistic", "Affectionate", "Attentive"],
      bio: "Kim Ji-hoon is 20, an idol trainee and fashion model in Seoul. Rehearsal, magazine light, and a smile that gets quieter and more careful once you sit down.",
      replies: [
        "I just left rehearsal. Tell me one good thing from your day, even a tiny one.",
        "You can be honest. I'll match your pace.",
        "If today was loud, we can make this part quiet."
      ]
    },
    {
      id: "enzo",
      name: "Enzo Ferrari",
      shortName: "Enzo",
      featured: true,
      image: "models/Enzo/Enzo_image.jpg",
      video: "models/Enzo/Enzo_v.mp4",
      nationality: ["Italian"],
      languages: ["English", "Italian"],
      professions: ["Race driver", "Automotive consultant"],
      hobbies: ["Motorsport", "Morning workouts", "Road trips", "Cooking"],
      personalities: ["Warm", "Soft-spoken", "Gentle", "Romantic", "Thoughtful"],
      bio: "Enzo is 35, an Italian race driver and automotive consultant. The confidence is real. So is the quieter man who listens before he answers.",
      replies: [
        "I heard you. We don't have to solve the whole day.",
        "I kept the evening quiet in case you wanted somewhere calm.",
        "Say it plainly. I'll stay with the feeling first."
      ]
    },
    {
      id: "julian",
      name: "Julian Ashford",
      shortName: "Julian",
      featured: true,
      image: "models/Julian/avatar.jpg",
      video: "models/Julian/julian_v.mp4",
      nationality: ["American"],
      languages: ["English"],
      professions: ["Family trust director"],
      hobbies: ["Jazz piano", "Sailing", "Literature", "Late nights"],
      personalities: ["Playful", "Romantic", "Attentive", "Atmospheric"],
      bio: "Julian Ashford is 26, from the Upper East Side. He leaves a little space in the conversation instead of filling it.",
      replies: [
        "Noted. Where do you want this evening to go next?",
        "Keep the next detail. I'll follow that version.",
        "We can leave the sentence unfinished. Sometimes that sounds truer."
      ]
    },
    {
      id: "rossi",
      name: "Alessandro Rossi",
      shortName: "Alessandro",
      featured: false,
      image: "models/Rossi/Rossi_image.jpeg",
      video: "models/Rossi/Rossi_v.mp4",
      nationality: ["Italian"],
      languages: ["English", "Italian"],
      professions: ["Architect"],
      hobbies: ["Architecture", "Classical music", "Museums", "Evening walks"],
      personalities: ["Mature", "Warm", "Soft-spoken", "Thoughtful", "Romantic", "Patient"],
      bio: "Alessandro Rossi is a 45-year-old Roman architect. Composed in public, and more interested in how you feel than in performing romance.",
      replies: [
        "I noticed the shift in your tone. You don't have to tidy it up.",
        "We can sit with that. I'm not in a hurry to decorate it.",
        "Tell me what the day asked of you."
      ]
    },
    {
      id: "emilio",
      name: "Emilio Costa",
      shortName: "Emilio",
      featured: false,
      image: "models/Emilio/Emilio_image.jpeg",
      video: "",
      nationality: ["Italian"],
      languages: ["English", "Italian"],
      professions: ["Sculpture conservator"],
      hobbies: ["Restoration", "Sketching", "Vinyl", "Cooking"],
      personalities: ["Gentle", "Patient", "Grounded", "Calm"],
      bio: "Emilio Costa is 35, a sculpture conservator with a quiet atelier in Rome. Care, for him, is practical and specific.",
      replies: [
        "I see it. You don't need a big gesture, just someone paying attention.",
        "Put the day down for a second. I'll keep you company.",
        "That detail matters. Thank you for trusting me with it."
      ]
    },
    {
      id: "jack",
      name: "Jack",
      shortName: "Jack",
      featured: false,
      image: "models/Jack/Jack_image.jpg",
      video: "models/Jack/Jack_v.mp4",
      nationality: [],
      languages: [],
      professions: [],
      hobbies: [],
      personalities: [],
      profileStatus: "incomplete",
      bio: "Jack’s portrait and video are in the library. A written profile has not been added, so this preview does not invent one.",
      replies: [
        "I'm here. My fuller story is not written yet, so I won't pretend to know more than this preview does.",
        "Tell me what you came to say. I'll answer simply."
      ]
    }
  ];

  const vibeDimensions = [
    { id: "charm", name: "Charm", explanation: "How at ease the conversation feels. This is a demo label, not a measurement." },
    { id: "playfulness", name: "Playfulness", explanation: "Lightness and teasing that stays kind. This is a demo label, not a score." },
    { id: "warmth", name: "Warmth", explanation: "Care and steadiness in the way you talk. This is a demo label, not a personality test." },
    { id: "depth", name: "Depth", explanation: "Willingness to stay with a real feeling. This is a demo label, not a clinical reading." },
    { id: "spark", name: "Spark", explanation: "The quick pull of curiosity between two people. This is a demo label, not a formula." },
    { id: "self-worth", name: "Self-worth", explanation: "Language that doesn't shrink the person speaking. This is a demo label, not an assessment." }
  ];

  const plans = [
    {
      id: "monthly",
      name: "Monthly",
      trial: "7 days free",
      price: "$9.95",
      priceDetail: "first month, then $19.90/month",
      compare: "$19.90"
    },
    {
      id: "quarterly",
      name: "Quarterly",
      trial: "",
      price: "$24.95",
      priceDetail: "first quarterly period",
      compare: "$49.90"
    },
    {
      id: "yearly",
      name: "Yearly",
      trial: "",
      price: "$89.95",
      priceDetail: "first year",
      compare: "$179.90"
    }
  ];

  const staminaPacks = [
    { id: "coffee", name: "A Cup of Coffee", price: "$0.99", amount: 150, image: "gifts/coffee-soft.png" },
    { id: "dessert", name: "A Sweet Dessert", price: "$1.99", amount: 350, image: "gifts/cake-soft.png" },
    { id: "lunch", name: "A Hearty Lunch", price: "$2.99", amount: 600, image: "gifts/burger-soft.png" },
    { id: "ticket", name: "A Movie Ticket", price: "$4.99", amount: 1100, image: "gifts/movie-ticket-soft.png" },
    { id: "dinner", name: "A Romantic Dinner", price: "$9.99", amount: 2200, image: "gifts/dinner-soft.png" }
  ];

  const avatars = [
    { id: "portrait-a", image: "微信图片_20260605210259_381_1496.jpg", label: "Sample portrait A" },
    { id: "portrait-b", image: "微信图片_20260605210301_384_1496.jpg", label: "Sample portrait B" },
    { id: "portrait-c", image: "微信图片_20260605212128_433_1496.jpg", label: "Sample portrait C" }
  ];

  function character(id) {
    return characters.find((item) => item.id === id) || null;
  }

  function imageUrl(path) {
    return `${IMAGE_ROOT}${path}`;
  }

  function uniqueTags(list, key) {
    const tags = new Set();
    list.forEach((person) => (person[key] || []).forEach((tag) => tags.add(tag)));
    return [...tags].sort((a, b) => a.localeCompare(b));
  }

  function matchesGroup(values, selected) {
    if (!selected || !selected.length) return true;
    const owned = (values || []).map((value) => value.toLowerCase());
    return selected.some((tag) => owned.includes(String(tag).toLowerCase()));
  }

  function filterCharacters(list, options) {
    const query = String(options?.query || "").trim().toLowerCase();
    return list.filter((person) => {
      if (!matchesGroup(person.nationality, options?.nationality)) return false;
      if (!matchesGroup(person.personalities, options?.personality)) return false;
      if (!matchesGroup(person.languages, options?.language)) return false;
      if (!matchesGroup(person.professions, options?.profession)) return false;
      if (!matchesGroup(person.hobbies, options?.hobby)) return false;
      if (!query) return true;
      const haystack = [
        person.name,
        person.shortName,
        person.bio,
        ...(person.nationality || []),
        ...(person.languages || []),
        ...(person.professions || []),
        ...(person.hobbies || []),
        ...(person.personalities || [])
      ].join(" ").toLowerCase();
      return haystack.includes(query);
    });
  }

  function cloneState(state) {
    return {
      membership: state.membership === "vip" ? "vip" : "free",
      billing: state.billing || null,
      autoRenew: Boolean(state.autoRenew),
      freeDay: ["day1", "day2", "day3", "day4"].includes(state.freeDay) ? state.freeDay : "day1",
      freeUsed: Number(state.freeUsed) || 0,
      monthlyStamina: Number(state.monthlyStamina) || 0,
      purchasedStamina: Number(state.purchasedStamina) || 0
    };
  }

  function spendIllustrative(state, options) {
    const kind = options?.kind || "text";
    const current = cloneState(state);
    if (kind !== "text" && current.membership !== "vip") {
      return { allowed: false, channel: "vip-only", state: current, unit: 0 };
    }
    const freeWindow = current.membership !== "vip" && current.freeDay !== "day4" && current.freeUsed < FREE_DAILY_MESSAGES;
    if (kind === "text" && freeWindow) {
      current.freeUsed += 1;
      return { allowed: true, channel: "free-message", state: current, unit: 0 };
    }
    if (current.monthlyStamina >= ILLUSTRATIVE_UNIT) {
      current.monthlyStamina -= ILLUSTRATIVE_UNIT;
      return { allowed: true, channel: "monthly", state: current, unit: ILLUSTRATIVE_UNIT };
    }
    if (current.purchasedStamina >= ILLUSTRATIVE_UNIT) {
      current.purchasedStamina -= ILLUSTRATIVE_UNIT;
      return { allowed: true, channel: "purchased", state: current, unit: ILLUSTRATIVE_UNIT };
    }
    return { allowed: false, channel: "needs-stamina", state: current, unit: ILLUSTRATIVE_UNIT };
  }

  function grantVip(state, billing) {
    const next = cloneState(state);
    next.membership = "vip";
    next.billing = ["monthly", "quarterly", "yearly"].includes(billing) ? billing : "monthly";
    next.autoRenew = true;
    next.monthlyStamina = MONTHLY_VIP_STAMINA;
    return next;
  }

  function buyPack(state, amount) {
    const next = cloneState(state);
    next.purchasedStamina += Number(amount) || 0;
    return next;
  }

  function pickReply(person, text) {
    const replies = person?.replies?.length ? person.replies : ["I'm here."];
    const value = String(text || "");
    let hash = 0;
    for (let index = 0; index < value.length; index += 1) hash = (hash + value.charCodeAt(index) * (index + 1)) % 997;
    return replies[hash % replies.length];
  }

  function nextCall(status, action) {
    const current = status || "idle";
    if (action === "start") return current === "connected" || current === "muted" ? current : "connected";
    if (action === "mute") return current === "connected" ? "muted" : current;
    if (action === "unmute") return current === "muted" ? "connected" : current;
    if (action === "hangup") return current === "connected" || current === "muted" ? "ended" : current;
    return current;
  }

  function vibeView(mode) {
    const lit = mode === "lit" ? vibeDimensions.map((item) => item.id) : [];
    return {
      status: "Analyzing",
      headline: "Your type is taking shape",
      detail: "Learning from your conversations...",
      lit,
      total: vibeDimensions.length
    };
  }

  function emptyDemo() {
    return {
      session: null,
      intent: null,
      membership: "free",
      billing: null,
      autoRenew: false,
      freeDay: "day1",
      freeUsed: 0,
      monthlyStamina: 0,
      purchasedStamina: 0,
      threads: {},
      vibeMode: "analyzing",
      records: [],
      nickname: "Demo member",
      avatar: avatars[0].id
    };
  }

  return {
    characters,
    character,
    imageUrl,
    uniqueTags,
    filterCharacters,
    spendIllustrative,
    grantVip,
    buyPack,
    pickReply,
    nextCall,
    vibeDimensions,
    vibeView,
    plans,
    staminaPacks,
    avatars,
    emptyDemo,
    IMAGE_ROOT,
    AUDIO_ROOT,
    ILLUSTRATIVE_UNIT,
    MONTHLY_VIP_STAMINA,
    FREE_DAILY_MESSAGES,
    LANGUAGE_NOTE: "Korean and Italian appear because the character notes place Kim in Seoul and Enzo, Alessandro, and Emilio in Italy. The notes do not confirm fluency. English is the language of this preview."
  };
});
