import { Application, Router, send } from "https://deno.land/x/oak/mod.ts";
import { gptPrompt } from "./shared/openai.js"; // Adjust the import path as needed
import * as log from "./shared/logger.ts";
log.setLogLevel(log.LogLevel.DEBUG);

import { Chalk } from "npm:chalk@5";
const chalk = new Chalk({ level: 1 });

const app = new Application();
const router = new Router();

// Route handler adjusted to use the gptPrompt function
router.get("/api/story", async (ctx) => {
  const prompt = ctx.request.url.searchParams.get("prompt") || "";
  const direction = ctx.request.url.searchParams.get("direction") || "";
  // Combine prompt and direction into a single string
  const combinedPrompt = `Story idea: ${prompt}. Direction: ${direction}.`;

  try {
    // Call gptPrompt to generate the story part based on the combined prompt
    const storyPart = await gptPrompt(combinedPrompt);
    ctx.response.body = { story: storyPart.trim() }; // Ensure response is properly formatted
  } catch (error) {
    // Log the error and return an error message
    log.error("Error generating story: ", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to generate story" };
  }
});

// Serve static files - adjust paths as necessary
app.use(async (ctx, next) => {
  if (ctx.request.url.pathname.startsWith("/api")) {
    // Skip for API routes and let the router handle it
    await next();
  } else {
    // Attempt to serve static files, defaulting to index.html for the root
    await send(ctx, ctx.request.url.pathname, {
      root: `${Deno.cwd()}/public`,
      index: "index.html",
    });
  }
});

app.use(router.routes());
app.use(router.allowedMethods());

console.log(chalk.green("\nListening on http://localhost:8000"));
await app.listen({ port: 8000 });
