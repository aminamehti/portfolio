import { Application, Router, send } from "https://deno.land/x/oak/mod.ts";
import { gptPrompt } from "./shared/openai.ts";
import * as log from "./shared/logger.ts";
import { createExitSignal, staticServer } from "./shared/server.ts";
log.setLogLevel(log.LogLevel.DEBUG);

console.log(`Current working directory is: ${Deno.cwd()}`);
const app = new Application();
const router = new Router();

// Variable to store the last choice made by the user
let lastChoice = "";

router.get("/api/story", async (ctx) => {
  const prompt = ctx.request.url.searchParams.get("prompt") || "";
  const direction = ctx.request.url.searchParams.get("direction") || "";
  const choice = ctx.request.url.searchParams.get("choice") || ""; // This should capture the user's choice

  lastChoice = choice; // Update lastChoice with the current choice to influence the next part of the story

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
  const basePrompt =
    `Continue the story based on the information below and ensure to maintain the character names and continuity.`;
  const choiceInstruction = lastChoice
    ? ` Following the decision to '${lastChoice}',`
    : "";
  const storyConsistency =
    " Please keep the main character's name and story setting consistent throughout the story.";
  const optionConsistency = " Each option must explicitly mention the main character's name.";

  switch (direction) {
    case "Middle":
      return `${basePrompt}${choiceInstruction} ${prompt} Now, develop the story further. This part should elaborate on the implications of the previous choice and end with two distinct options for the character, labeled as \nOption A and \nOption B.${optionConsistency}${storyConsistency} Keep the name of the character the same as in the previously generated text. In your text response, ALWAYS start listing option A and B on a new line. DO NOT BOLD ANY TEXT IN THE STORY. DO NOT INCLUDE ANY SPECIAL SYMBOLS (such as: (), *, '' or any other) IN RESPONSE. Limit response to 200 words.`;
    case "End":
      return `${basePrompt}${choiceInstruction} ${prompt} Now, bring the story to a conclusion. Reflect on the entire journey, especially considering the choices made previously, to deliver a coherent and satisfying ending. No further options.${storyConsistency} Keep the name of the character the same as in the previously generated text. In your text response, ALWAYS start listing option A and B on a new line. DO NOT BOLD ANY TEXT IN THE STORY. DO NOT INCLUDE ANY SPECIAL SYMBOLS (such as: (), *, '' or any other) IN RESPONSE. Limit response to 200 words.`;
    default:
      // This handles the "Start" of the story and any other unspecified part
      return `${basePrompt} ${prompt}${choiceInstruction} Begin by introducing the main character and setting up the initial situation. Finish this part with two options for the character, labeled as \nOption A and \nOption B.${optionConsistency}${storyConsistency} In your text response, ALWAYS start listing option A and B on a new line. DO NOT BOLD ANY TEXT IN THE STORY. DO NOT INCLUDE ANY SPECIAL SYMBOLS (such as: (), *, '' or any other) IN RESPONSE. Limit response to 200 words.`;
  }
}

function parseChoices(story) {
  const choicePattern = /Option (A|B): ([^\.]+)\./g;
  const choices = [];
  let match;
  while ((match = choicePattern.exec(story)) !== null) {
    choices.push({ option: match[1], description: match[2].trim() });
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

console.log("Listening on http://localhost:8000");
await app.listen({ port: 8000, signal: createExitSignal() });
