const { execFile } = require("child_process");

function pingHost(hostname) {
  execFile("ping", ["-c", "1", hostname]);
}
