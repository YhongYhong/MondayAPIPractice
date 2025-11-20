import { spawn } from "child_process";

export function askAI(prompt) {
  return new Promise(resolve => {
    const process = spawn("ollama", ["run", "phi3"], {
      stdio: ["pipe", "pipe", "inherit"]
    });

    let output = "";

    process.stdout.on("data", data => {
      output += data.toString();
    });

    process.stdout.on("close", () => resolve(output));

    process.stdin.write(prompt);
    process.stdin.end();
  });
}
