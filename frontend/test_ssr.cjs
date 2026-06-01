const { spawn } = require("child_process");
const http = require("http");

const child = spawn("npm", ["run", "dev", "--", "--port", "8085"], { shell: true });
let output = "";

child.stdout.on("data", (data) => {
  output += data.toString();
  if (data.toString().includes("Local:")) {
    console.log("Server started, fetching...");
    http.get("http://localhost:8085/", (res) => {
      let html = "";
      res.on("data", (chunk) => { html += chunk; });
      res.on("end", () => {
        console.log("Status:", res.statusCode);
        console.log("HTML:", html.substring(0, 100));
        child.kill();
        console.log("Server Output:", output);
      });
    }).on("error", (err) => {
      console.log("Fetch Error:", err);
      child.kill();
    });
  }
});

child.stderr.on("data", (data) => {
  output += data.toString();
});
