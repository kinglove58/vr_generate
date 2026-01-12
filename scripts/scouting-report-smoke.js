const payload = {
  title: "val",
  opponentTeamName: "G2",
  lastXMatches: 5,
};

async function run() {
  const response = await fetch("http://localhost:3000/api/scouting-report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    console.error("Request failed:", response.status, data);
    process.exit(1);
  }

  console.log({
    reportMeta: data.report?.meta,
    markdownPreview: data.markdown?.slice(0, 200),
  });
}

run().catch((error) => {
  console.error("Smoke test failed:", error.message);
  process.exit(1);
});
