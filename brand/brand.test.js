const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const brand = require("./data.js");

const base = {
  membership: "free",
  billing: null,
  autoRenew: false,
  freeDay: "day1",
  freeUsed: 0,
  monthlyStamina: 0,
  purchasedStamina: 0
};

test("five filter groups combine and can return nobody", () => {
  const italianArchitects = brand.filterCharacters(brand.characters, {
    nationality: ["Italian"],
    profession: ["Architect"]
  });
  assert.deepEqual(italianArchitects.map((person) => person.id), ["rossi"]);

  const koreanPlayful = brand.filterCharacters(brand.characters, {
    nationality: ["South Korean"],
    personality: ["Playful"],
    language: ["Korean"],
    hobby: ["Dance"]
  });
  assert.deepEqual(koreanPlayful.map((person) => person.id), ["kim"]);

  const none = brand.filterCharacters(brand.characters, {
    nationality: ["South Korean"],
    profession: ["Architect"]
  });
  assert.equal(none.length, 0);

  const reset = brand.filterCharacters(brand.characters, {});
  assert.equal(reset.length, brand.characters.length);
});

test("search finds Jack without inventing a profession for him", () => {
  const found = brand.filterCharacters(brand.characters, { query: "jack" });
  assert.deepEqual(found.map((person) => person.id), ["jack"]);
  assert.equal(brand.character("jack").professions.length, 0);
});

test("free messages do not spend Stamina, then day four requires a balance", () => {
  let state = { ...base };
  for (let count = 0; count < 10; count += 1) {
    const result = brand.spendIllustrative(state, { kind: "text" });
    assert.equal(result.allowed, true);
    assert.equal(result.channel, "free-message");
    assert.equal(result.state.monthlyStamina, 0);
    assert.equal(result.state.purchasedStamina, 0);
    state = result.state;
  }
  const blocked = brand.spendIllustrative({ ...state, freeDay: "day4" }, { kind: "text" });
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.channel, "needs-stamina");
});

test("purchased Stamina lets a non-VIP keep texting, and media stays VIP-only", () => {
  const text = brand.spendIllustrative({ ...base, freeDay: "day4", purchasedStamina: 2 }, { kind: "text" });
  assert.equal(text.allowed, true);
  assert.equal(text.channel, "purchased");
  assert.equal(text.state.purchasedStamina, 1);
  assert.equal(text.state.membership, "free");

  const image = brand.spendIllustrative({ ...base, freeDay: "day4", purchasedStamina: 50 }, { kind: "image" });
  assert.equal(image.allowed, false);
  assert.equal(image.channel, "vip-only");
  assert.equal(image.state.purchasedStamina, 50);
});

test("VIP spends the monthly grant before purchased Stamina and keeps the pack", () => {
  const first = brand.spendIllustrative({
    ...base,
    membership: "vip",
    billing: "yearly",
    monthlyStamina: 60000,
    purchasedStamina: 40
  }, { kind: "text" });
  assert.equal(first.channel, "monthly");
  assert.equal(first.state.monthlyStamina, 59999);
  assert.equal(first.state.purchasedStamina, 40);

  const second = brand.spendIllustrative({
    ...base,
    membership: "vip",
    monthlyStamina: 0,
    purchasedStamina: 40
  }, { kind: "voice" });
  assert.equal(second.channel, "purchased");
  assert.equal(second.state.purchasedStamina, 39);

  ["monthly", "quarterly", "yearly"].forEach((billing) => {
    const granted = brand.grantVip({ ...base, monthlyStamina: 12, purchasedStamina: 80 }, billing);
    assert.equal(granted.monthlyStamina, 60000);
    assert.equal(granted.purchasedStamina, 80);
    assert.equal(granted.billing, billing);
  });
});

test("call controls move through connected, muted, and ended", () => {
  assert.equal(brand.nextCall("idle", "start"), "connected");
  assert.equal(brand.nextCall("connected", "mute"), "muted");
  assert.equal(brand.nextCall("muted", "unmute"), "connected");
  assert.equal(brand.nextCall("connected", "hangup"), "ended");
  assert.equal(brand.nextCall("idle", "hangup"), "idle");
});

test("Vibe starts unlit and the preview sky is explicit", () => {
  const start = brand.vibeView("analyzing");
  assert.equal(start.headline, "Your type is taking shape");
  assert.equal(start.detail, "Learning from your conversations...");
  assert.equal(start.lit.length, 0);
  assert.equal(start.total, 6);
  assert.equal(brand.vibeView("lit").lit.length, 6);
});

test("brand pages do not claim unlimited chat, a password, or an age gate", () => {
  const files = fs.readdirSync(__dirname).filter((name) => name !== "brand.test.js" && (name.endsWith(".html") || name.endsWith(".js")));
  const blob = files.map((name) => fs.readFileSync(path.join(__dirname, name), "utf8")).join("\n").toLowerCase();
  assert.equal(blob.includes("unlimited"), false);
  assert.equal(blob.includes("type=\"password\""), false);
  assert.equal(blob.includes("getusermedia"), false);
  assert.equal(blob.includes("18+"), false);
  assert.equal(blob.includes("swipe"), false);
});
