import { Application, Router, send } from "https://deno.land/x/oak/mod.ts";
import * as log from "./shared/logger.ts";
log.setLogLevel(log.LogLevel.DEBUG);

import { Chalk } from "npm:chalk@5";
const chalk = new Chalk({ level: 1 });

const app = new Application();
const router = new Router();

// Simulated function to generate a storyline based on the prompt and direction
async function generateStoryline(prompt, direction) {
  // This is where you'd integrate with an AI service or your own story generation logic
  return `Generated story part based on: ${prompt} and direction: ${direction}`;
}

router.get("/api/story", async (ctx) => {
  const prompt = ctx.request.url.searchParams.get("prompt") || "";
  const direction = atx.request.url.searchParams.get("direction") || "";
  const storyPart = await generateStoryline(prompt, direction);
  ctx.response.body = { story: storyPart };
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
