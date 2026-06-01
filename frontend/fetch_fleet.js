async function run() {
  try {
    const res = await fetch("http://localhost:8080/");
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("HTML snippet:");
    console.log(text.substring(0, 300));
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}
run();
