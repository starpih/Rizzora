(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.RizzoraData = api;
})(typeof window !== "undefined" ? window : null, function () {
  const companions = [
    {
      id: "chris",
      name: "Chris Jones",
      shortName: "Chris",
      featured: true,
      image: "models/Chris/Chris_image.png",
      video: "models/Chris/Chris_v.mp4",
      birthday: "2004/01/19",
      height: "187cm",
      zodiac: "Capricorn",
      mbti: "ENFJ",
      nationality: "Italian-American",
      occupation: "AI Founder",
      hobbies: "Fitness · Travel · Photography · Night drives · Sunsets",
      bio: "I'm Chris, 22, Italian-American. Tech product manager and AI startup co-founder in Los Angeles. By day I chase success, at night I chase sunsets and you.",
      traits: ["Warm", "Romantic", "Playful", "Attentive", "Charismatic"],
      replies: [
        "I caught that. Stay with me a minute and tell me the part you almost kept to yourself.",
        "Sunset light and an honest sentence from you. That is my favorite kind of evening.",
        "I'm listening. Start wherever today actually feels heavy, or wherever it feels light."
      ]
    },
    {
      id: "kim",
      name: "Kim Ji-hoon",
      shortName: "Kim",
      featured: true,
      image: "models/Kim/Kim_image.png",
      video: "models/Kim/Kim_v.mp4",
      birthday: "2005/10/08",
      height: "183cm",
      zodiac: "Libra",
      mbti: "ENFP",
      nationality: "South Korean",
      occupation: "Idol trainee and fashion model",
      hobbies: "Dance · Street photography · Café hops · Han River runs",
      bio: "I'm Kim Ji-hoon, a 20-year-old idol trainee and part-time fashion model in Seoul. Rehearsal rooms, magazine shoots, and a healing smile that stays curious once you sit down with me.",
      traits: ["Pure Sunshine", "Gentle Idol", "Attentive Warmth", "Playful", "Optimistic", "Affectionate"],
      replies: [
        "I just left rehearsal. Tell me one good thing from your day, even a tiny one.",
        "You can be honest with me. I'll match your pace, not rush the moment.",
        "If today was loud, we can make this part quiet. I'm right here."
      ]
    },
    {
      id: "enzo",
      name: "Enzo Ferrari",
      shortName: "Enzo",
      featured: true,
      image: "models/Enzo/Enzo_image.jpg",
      video: "models/Enzo/Enzo_v.mp4",
      birthday: "1991/11/21",
      height: "188cm",
      zodiac: "Scorpio",
      mbti: "ESTP",
      nationality: "Italian",
      occupation: "Race driver and automotive consultant",
      hobbies: "Motorsport · Morning workouts · Quiet road trips · Cooking",
      bio: "Enzo is a 35-year-old Italian race driver and automotive consultant. Behind the confident exterior he is soft-spoken, attentive, and steady company.",
      traits: ["Warm", "Soft-spoken", "Caring", "Good Listener", "Gentle", "Romantic", "Thoughtful"],
      replies: [
        "I heard you. We don't have to solve the whole day. Tell me what you need right now.",
        "I kept the evening quiet in case you wanted somewhere calm to land.",
        "Say it plainly. I'll stay with the feeling before I offer any story of my own."
      ]
    },
    {
      id: "julian",
      name: "Julian Ashford",
      shortName: "Julian",
      featured: true,
      image: "models/Julian/avatar.jpg",
      video: "models/Julian/julian_v.mp4",
      birthday: "2000/10/21",
      height: "190cm",
      zodiac: "Libra",
      mbti: "ENFP",
      nationality: "American",
      occupation: "Director of a family trust",
      hobbies: "Jazz piano · Sailing · Literature · Late city nights",
      bio: "Julian Ashford is 26, from the Upper East Side, with dirty-blonde hair and a habit of leaving a little space in the conversation instead of filling it.",
      traits: ["Playful Romantic", "Soft Humor", "Attentive Listener", "Atmospheric", "Quietly Confident"],
      replies: [
        "Noted. Where do you want this evening to go next?",
        "I like that version. Keep the next detail, and I'll follow it.",
        "We can leave the sentence unfinished. Sometimes that sounds more like the truth."
      ]
    },
    {
      id: "rossi",
      name: "Alessandro Rossi",
      shortName: "Alessandro",
      featured: false,
      image: "models/Rossi/Rossi_image.jpeg",
      video: "models/Rossi/Rossi_v.mp4",
      birthday: "1981/11/21",
      height: "187cm",
      zodiac: "Scorpio",
      mbti: "INTJ",
      nationality: "Italian",
      occupation: "Architect",
      hobbies: "Architecture · Classical music · Museums · Evening walks",
      bio: "Alessandro Rossi is a 45-year-old Roman architect. Composed in public, quietly attentive in private, and more interested in how you feel than in performing romance.",
      traits: ["Mature", "Warm", "Sophisticated", "Soft-spoken", "Thoughtful", "Romantic", "Patient"],
      replies: [
        "I noticed the shift in your tone. You don't have to tidy it up for me.",
        "We can sit with that for a moment. I'm not in a hurry to decorate it.",
        "Tell me what the day asked of you. I'll answer with care, not noise."
      ]
    },
    {
      id: "emilio",
      name: "Emilio Costa",
      shortName: "Emilio",
      featured: false,
      image: "models/Emilio/Emilio_image.jpeg",
      video: "",
      birthday: "1991/05/12",
      height: "187cm",
      zodiac: "Taurus",
      mbti: "ISFP",
      nationality: "Italian",
      occupation: "Sculpture conservator",
      hobbies: "Restoration · Sketching · Vinyl · Tuscan cooking",
      bio: "Emilio Costa is a 35-year-old sculpture conservator with a quiet atelier in Rome. He shows care in small, practical ways rather than grand speeches.",
      traits: ["Craftsman Warm", "Gentle Observant", "Grounded Romantic", "Patient Listener", "Calm Smile"],
      replies: [
        "I see it. You don't need a big gesture from me, just someone paying attention.",
        "Put the day down for a second. I'll keep you company while you do.",
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
      birthday: "",
      height: "",
      zodiac: "",
      mbti: "",
      nationality: "",
      occupation: "",
      hobbies: "",
      bio: "Jack’s portrait and video are in the library. A written profile has not been added yet, so this page does not invent one.",
      traits: [],
      profileStatus: "incomplete",
      replies: [
        "I'm here with you. My fuller story is still on the roadmap, so I won't pretend to know more than this demo does.",
        "Tell me what you came to say. I'll answer simply until a real profile exists."
      ]
    }
  ];

  const filterTraits = ["All", "Warm", "Romantic", "Playful", "Gentle", "Attentive", "Soft-spoken"];

  const accountStates = {
    day1: { plan: "Free Account", free: "10 of 10 messages", detail: "Day 1 of 3", monthly: null, extra: 0 },
    day2: { plan: "Free Account", free: "10 of 10 messages", detail: "Day 2 of 3", monthly: null, extra: 0 },
    day3: { plan: "Free Account", free: "10 of 10 messages", detail: "Day 3 of 3", monthly: null, extra: 0 },
    day4: { plan: "Free Account", free: "No free messages left", detail: "Free period ended", monthly: null, extra: 0 },
    extra: { plan: "Free Account", free: "Free period ended", detail: "Extra Stamina available", monthly: null, extra: 60 },
    vip: { plan: "Premium", free: "Free period ended", detail: "Premium account", monthly: 4532, extra: 0 },
    vip_extra: { plan: "Premium", free: "Free period ended", detail: "Premium account", monthly: 6000, extra: 60 }
  };

  function companion(id) {
    return companions.find((item) => item.id === id) || null;
  }

  function matchesTrait(person, trait) {
    if (!trait || trait === "All") return true;
    const needle = trait.toLowerCase();
    return (person.traits || []).some((item) => item.toLowerCase().includes(needle));
  }

  function filterCompanions(list, options) {
    const query = String(options?.query || "").trim().toLowerCase();
    const trait = options?.trait || "All";
    return list.filter((person) => {
      if (!matchesTrait(person, trait)) return false;
      if (!query) return true;
      const haystack = [
        person.name,
        person.shortName,
        person.bio,
        person.nationality,
        person.occupation,
        person.hobbies,
        ...(person.traits || [])
      ].join(" ").toLowerCase();
      return haystack.includes(query);
    });
  }

  function pickReply(person, text) {
    const replies = person?.replies?.length ? person.replies : ["I'm here."];
    const value = String(text || "");
    let hash = 0;
    for (let index = 0; index < value.length; index += 1) {
      hash = (hash + value.charCodeAt(index) * (index + 1)) % 997;
    }
    return replies[hash % replies.length];
  }

  function applyExtra(state, extraDemo) {
    const next = { ...state };
    if (next.extra > 0 && extraDemo && Number.isFinite(extraDemo.balance)) {
      next.extra = extraDemo.balance;
    }
    return next;
  }

  function previewSend(snapshot) {
    const accountKey = accountStates[snapshot?.accountKey] ? snapshot.accountKey : "day1";
    const usage = { freeUsed: 0, ...(snapshot?.usage || {}) };
    const extraDemo = snapshot?.extraDemo ? { ...snapshot.extraDemo } : null;
    const state = applyExtra({ ...accountStates[accountKey] }, extraDemo);
    const inFreeDays = accountKey === "day1" || accountKey === "day2" || accountKey === "day3";

    if (inFreeDays) {
      if ((usage.freeUsed || 0) >= 10) {
        return { allowed: false, reason: "free-sample-used", accountKey, usage, extraDemo, state };
      }
      return {
        allowed: true,
        reason: "free-sample",
        accountKey,
        usage: { ...usage, freeUsed: (usage.freeUsed || 0) + 1 },
        extraDemo,
        state
      };
    }

    if ((state.monthly || 0) > 0 || (state.extra || 0) > 0) {
      return { allowed: true, reason: "sample-balance", accountKey, usage, extraDemo, state };
    }

    return { allowed: false, reason: "needs-stamina-or-vip", accountKey, usage, extraDemo, state };
  }

  return {
    companions,
    filterTraits,
    accountStates,
    companion,
    filterCompanions,
    pickReply,
    previewSend
  };
});
