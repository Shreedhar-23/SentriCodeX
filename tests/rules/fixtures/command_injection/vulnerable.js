const { exec } = require("child_process");

function pingHost(hostname) {
  exec(`ping -c 1 ${hostname}`);
}
