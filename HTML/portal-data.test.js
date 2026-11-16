const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const data = require("./portal-data.js");

test("search finds Chris by name", () => {
  const found = data.filterCompanions(data.companions, { query: "chris", trait: "All" });
  assert.deepEqual(found.map((person) => person.id), ["chris"]);
});

test("trait filter uses real companion traits and keeps Jack out", () => {
  const found = data.filterCompanions(data.companions, { query: "", trait: "Romantic" });
  assert.ok(found.some((person) => person.id === "chris"));
  assert.ok(found.every((person) => person.id !== "jack"));
});

test("occupation search finds Alessandro without inventing a profile for Jack", () => {
  const found = data.filterCompanions(data.companions, { query: "architect", trait: "All" });
  assert.deepEqual(found.map((person) => person.id), ["rossi"]);
  assert.equal(data.companion("jack").profileStatus, "incomplete");
});

test("empty search returns the full library", () => {
  const found = data.filterCompanions(data.companions, { query: "   ", trait: "All" });
  assert.equal(found.length, data.companions.length);
});

test("sample free messages stop after ten and do not change Stamina packs", () => {
  let usage = { freeUsed: 0 };
  for (let count = 0; count < 10; count += 1) {
    const result = data.previewSend({ accountKey: "day1", usage });
    assert.equal(result.allowed, true);
    usage = result.usage;
  }
  const blocked = data.previewSend({ accountKey: "day1", usage });
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.reason, "free-sample-used");

  const withPack = data.previewSend({
    accountKey: "extra",
    extraDemo: { balance: 60, capacity: 150 },
    usage: {}
  });
  assert.equal(withPack.allowed, true);
  assert.equal(withPack.state.extra, 60);
  assert.equal(withPack.state.monthly, null);
});

test("day four without a sample balance asks for Stamina or VIP", () => {
  const blocked = data.previewSend({ accountKey: "day4", usage: {} });
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.reason, "needs-stamina-or-vip");
  const premium = data.previewSend({ accountKey: "vip", usage: {} });
  assert.equal(premium.allowed, true);
  assert.equal(premium.state.monthly, 4532);
});

test("simulated replies stay stable and do not quote a price", () => {
  const chris = data.companion("chris");
  assert.equal(data.pickReply(chris, "hello there"), data.pickReply(chris, "hello there"));
  assert.equal(data.pickReply(chris, "hello there").includes("¥"), false);
  assert.equal(JSON.stringify(data.accountStates).includes("30 message"), false);
});

test("portal scripts do not revive the 30-message credit rule or yuan prices", () => {
  const script = fs.readFileSync(path.join(__dirname, "script.js"), "utf8");
  const portal = fs.readFileSync(path.join(__dirname, "portal.js"), "utf8");
  const combined = script + portal;
  assert.equal(combined.includes("30 message"), false);
  assert.equal(combined.includes("¥"), false);
  assert.equal(combined.includes("Alipay"), false);
});
