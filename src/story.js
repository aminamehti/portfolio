import { Application, Router, send } from "https://deno.land/x/oak/mod.ts";
import { gptPrompt } from "./shared/openai.js"; // Ensure this function is properly implemented to handle your AI logic
import * as log from "./shared/logger.ts";
log.setLogLevel(log.LogLevel.DEBUG);

import { Chalk } from "npm:chalk@5";
const chalk = new Chalk({ level: 1 });

const app = new Application();
const router = new Router();

router.get("/api/story", async (ctx) => {
  const prompt = ctx.request.url.searchParams.get("prompt") || "";
  const direction = ctx.request.url.searchParams.get("direction") || "";

  let combinedPrompt;
  switch (direction) {
    case "Continue with the rising action.":
      combinedPrompt =
        `Build on this setup and develop the rising action. The response should be no more than 300 words. Based on: ${prompt} Do not include the words "rising action" in your response.`;
      break;
    case "Continue with the main plot events.":
      combinedPrompt =
        `Now focus on the main events of the story. The response should be no more than 300 words. Based on: ${prompt} Do not include the words "main plot events" in your response.`;
      break;
    case "Continue with the falling action.":
      combinedPrompt =
        `Develop the falling action now. The response should be no more than 300 words. Based on: ${prompt} Do not include the words "falling action" in your response.`;
      break;
    case "Provide the conclusion.":
      combinedPrompt =
        `Finally, provide a conclusion for the story. The response should be no more than 300 words. Based on: ${prompt} Do not include the words "conclusion" in your response.`;
      break;
    default:
      combinedPrompt =
        `Provide an exposition of the story. The response should be no more than 300 words. Story idea: ${prompt} Do not include the words "exposition" in your response.`;
  }

  try {
    const storyPart = await gptPrompt(combinedPrompt);
    ctx.response.body = { story: storyPart.trim() };
  } catch (error) {
    log.error("Error generating story: ", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to generate story" };
  }
});

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
await app.listen({ port: 8000 });
