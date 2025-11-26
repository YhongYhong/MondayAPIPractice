import { spawn } from "child_process";

export async function askAI(prompt, options = {}) {
  const { timeout = 30000, model = "phi3" } = options; // Default 30s timeout, default model

  // Validation
  if (typeof prompt !== "string" || prompt.trim().length === 0) {
    throw new Error("Prompt must be a non-empty string");
  }

  return new Promise((resolve, reject) => {
    const process = spawn("ollama", ["run", model], {
      stdio: ["pipe", "pipe", "pipe"] // Capture stderr too
    });

    let output = "";
    let errorOutput = "";

    const timer = setTimeout(() => {
      process.kill();
      reject(new Error(`AI request timed out after ${timeout}ms`));
    }, timeout);

    process.stdout.on("data", (data) => {
      output += data.toString();
    });

    process.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    process.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        reject(new Error(`Ollama process exited with code ${code}. Errors: ${errorOutput}`));
      } else {
        resolve(output.trim());
      }
    });

    process.stdin.write(prompt + "\n");
    process.stdin.end();
  });
}
