const test = require("node:test");
const assert = require("node:assert/strict");

const shouldRun = process.env.INTEGRATION_TEST === "1";

test("scouting-report integration", { skip: !shouldRun }, async () => {
  const response = await fetch("http://localhost:3000/api/scouting-report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "val",
      opponentTeamName: "G2",
      lastXMatches: 5,
    }),
  });

  const data = await response.json();
  assert.ok(response.ok, JSON.stringify(data));
  assert.ok(data.report);
  assert.ok(data.markdown);
  assert.ok(data.evidence);
});
