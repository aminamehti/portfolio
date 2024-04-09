import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { gptPrompt } from "./shared/openai.js"; // Ensure this module exists and is correctly implemented
import { createExitSignal, staticServer } from "./shared/server.ts"; // These functions/modules should exist as per your structure

import { Chalk } from "npm:chalk@5";
const chalk = new Chalk({ level: 1 });

const app = new Application();
const router = new Router();

router.post("/api/gpt", async (ctx) => {
  const request = await ctx.request.body({ type: "json" });
  const { storyIdea } = request.value;
  
    
  const customPrompt = `This is an idea for a story submitted by a journalist: "${storyIdea}". Provide feedback by listing the top 5 suggestions in a list, of how this story idea can be improved.`;
console.log(customPrompt);
  try {
    const result = await gptPrompt(customPrompt);
    ctx.response.body = { response: result };
  } catch (error) {
    console.error('Error processing GPT request:', error);
    ctx.response.status = 500;
    ctx.response.body = { response: "Failed to get feedback from AI. Please try again." };
  }
});

app.use(router.routes());
app.use(router.allowedMethods());
app.use(staticServer);

console.log(chalk.green("\nListening on http://localhost:8000"));

await app.listen({ port: 8000, signal: createExitSignal() });
