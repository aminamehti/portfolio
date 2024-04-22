import { Application, Router, send } from "https://deno.land/x/oak/mod.ts";
import { gptPrompt } from "./shared/openai.ts";
import * as log from "./shared/logger.ts";
import { createExitSignal, staticServer } from "./shared/server.ts";
log.setLogLevel(log.LogLevel.DEBUG);

import { Chalk } from "npm:chalk@5";
const chalk = new Chalk({ level: 1 });

const app = new Application();
const router = new Router();

// Variable to store the last choice made by the user
let lastChoice = "";

router.get("/api/story", async (ctx) => {
  const prompt = ctx.request.url.searchParams.get("prompt") || "";
  const direction = ctx.request.url.searchParams.get("direction") || "";

  let combinedPrompt = generatePrompt(prompt, direction, lastChoice);

  try {
    const storyPart = await gptPrompt(combinedPrompt);
    const userChoices = parseChoices(storyPart);
    ctx.response.body = { story: storyPart.trim(), choices: userChoices };
  } catch (error) {
    log.error("Error generating story: ", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to generate story" };
  }
});

function generatePrompt(prompt, direction, lastChoice) {
  const basePrompt = `Continue the story based on the information below and ensure to maintain the character names and continuity.`;
  const choiceInstruction = lastChoice ? ` Consider the choice made previously: '${lastChoice}'.` : "";
  const storyConsistency = " Please keep the main character's name and key details consistent throughout the story.";

  // Adjusted to handle only Start, Middle, and End parts of the story
  switch (direction) {
      case "Middle":
          return `${basePrompt} ${prompt}${choiceInstruction} Develop the story. This part should end with two distinct options for the character, labeled as Option A and Option B.${storyConsistency}`;
      case "End":
          return `${basePrompt} ${prompt}${choiceInstruction} Conclude the story. Reflect on the choices made previously to deliver a coherent ending. No further options.${storyConsistency}`;
      default:
          // Treats any other input as the start of the story
          return `${basePrompt} ${prompt}${choiceInstruction} Start the story by introducing the main character and setting up the initial situation. Finish this part with two options for the character, labeled as Option A and Option B.${storyConsistency}`;
  }
}

function parseChoices(story) {
  const choicePattern = /Option (A|B): ([^\.]+)\./g;
  const choices = [];
  let match;
  while ((match = choicePattern.exec(story)) !== null) {
    choices.push({option: match[1], description: match[2].trim()});
  }
  return choices;
}

app.use(async (ctx, next) => {
  if (ctx.request.url.pathname.startsWith("/api")) {
    await next();
  } else {
    await send(ctx, ctx.request.url.pathname, {
      root: `${Deno.cwd()}/public`,
      index: "index.html",
    });
  }
});

app.use(router.routes());
app.use(router.allowedMethods());

console.log(chalk.green("Listening on http://localhost:8000"));
await app.listen({ port: 8000, signal: createExitSignal() });