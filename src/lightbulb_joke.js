import { ask, say } from "../shared/cli.js";
import { gptPrompt } from "../shared/openai.js";

main();

async function main() {
  say("Hello, Player!");

  const topic = await ask("What topic do you want the lightbulb joke about?");
}