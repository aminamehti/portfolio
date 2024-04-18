import { ask, say } from "./shared/cli.js";
import { gptPrompt } from "./shared/openai.ts";

main();

async function main() {
  say("Hello, Player!");

  let topic = await ask("What topic do you want the lightbulb joke about?");
  let prompt = `Generate a lightbulb joke about the topic: ${topic}.`;

  try {
    const jokeResponse = await gptPrompt(prompt, { max_tokens: 60, temperature: 0.5 });

    say(jokeResponse);
  } catch (error) {
    say("Sorry, something went wrong while generating the joke.");
    console.error(error);
  }
}
