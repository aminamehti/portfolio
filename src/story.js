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

// Function to create prompts including the last choice
function generatePrompt(prompt, direction, lastChoice) {
  const basePrompt = `Continue the story based on the information below and ensure to maintain the character names and continuity.`;
  const choiceInstruction = lastChoice ? ` Consider the choice made previously: '${lastChoice}'.` : "";
  const storyConsistency = " Please keep the main character's name and key details consistent throughout the story.";

  switch (direction) {
      case "Continue with the rising action.":
          return `${basePrompt} ${prompt}${choiceInstruction} Develop the rising action. This part should end with two distinct options for the character, labeled as Option A and Option B.${storyConsistency}`;
      case "Continue with the main plot events.":
          return `${basePrompt} ${prompt}${choiceInstruction} Focus on the main events of the plot. Conclude this part with two new choices for the character, clearly labeled as Option A and Option B.${storyConsistency}`;
      case "Continue with the falling action.":
          return `${basePrompt} ${prompt}${choiceInstruction} Now move on to the falling action. Ensure this segment also ends with two choices for the character, each labeled as Option A or Option B.${storyConsistency}`;
      case "Provide the conclusion.":
          return `${basePrompt} ${prompt}${choiceInstruction} Finally, provide a satisfying conclusion to the story. Reflect on the choices made previously to deliver a coherent ending.${storyConsistency}`;
      default:
          // This will handle the exposition and any other unspecified part of the story
          return `${basePrompt} ${prompt}${choiceInstruction} Start the story by introducing the main character and setting up the initial situation. Finish this part with two options for the character, labeled as Option A and Option B.${storyConsistency}`;
  }
}

// Function to parse choices from the story text
function parseChoices(story) {
  const choicePattern = /Option (A|B): ([^\.]+)\./g;
  const choices = [];
  let match;
  while ((match = choicePattern.exec(story)) !== null) {
    choices.push(match[2].trim());
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
