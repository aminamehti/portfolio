// Import the JSON data from the file
import { gptPrompt } from "./shared/openai.js";
import { ask, say } from "./shared/cli.js";

// Function to query ChatGPT via OpenAI's API
async function queryChatGPT(prompt) {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    console.error("OPENAI_API_KEY environment variable is not set.");
    return null;
  }

  console.log("Sending request to OpenAI...");

  try {
    const response = await fetch("https://api.openai.com/v1/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4.0-turbo",
        prompt: prompt,
        max_tokens: 1200,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `OpenAI API request was not ok. Status code: ${response.status}, Body: ${errorBody}`,
      );
    }

    const data = await response.json();
    return data.choices[0].text.trim();
  } catch (error) {
    console.error("There was a problem with your fetch operation:", error);
    return null;
  }
}

async function main() {
  console.log("Welcome to the QuickJet Information Assistant");
  const departureDate = await ask(
    "Enter your departure date (For example: 2024-05-20): ",
  );
  const departureLocation = await ask(
    "Enter your departure location (For example: LAX): ",
  );
  const destinationLocation = await ask(
    "Enter your destination location (For example: JFK): ",
  );

  const prompt =
    `Provide information for flights from ${departureLocation} to ${destinationLocation} on ${departureDate}.`;

  const response = await queryChatGPT(prompt);
  console.log("Here's what I found:", response);
}

main().catch(console.error);
