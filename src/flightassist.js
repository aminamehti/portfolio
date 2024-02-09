// Import the JSON data from the file
import flights from "./shared/flight.json" assert { type: "json" };
import { gptPrompt } from "./shared/openai.js";
import { ask, say } from "./shared/cli.js";

// Function to fetch flight data from an API
async function fetchFlightData(departure, destination, date) {
  const apiKey = "65c6916360d9bb7f0828fdcd"; // Your actual API key
  // Adjust the URL according to your API requirements
  const url =
    `https://api.flightapi.io/oneway/${apiKey}/${departure}/${destination}/${date}/1/0/0/Economy/USD`;

  try {
    const response = await fetch(url, {
      method: "GET", // Adjust if necessary
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data = await response.json();
    return data; // This will be the flight data
  } catch (error) {
    console.error("There was a problem with your fetch operation:", error);
  }
}

// Function to query ChatGPT using OpenAI's API
async function queryChatGPT(promptText) {
  const apiKey = env.OPENAI_API_KEY;
  const response = await fetch(
    "https://api.openai.com/v1/engines/davinci/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        prompt: promptText,
        max_tokens: 150,
      }),
    },
  );

  if (response.ok) {
    const data = await response.json();
    return data.choices[0].text.trim();
  } else {
    const error = await response.text();
    throw new Error(`API request failed: ${error}`);
  }
}

// Main function to tie everything together
async function main() {
  say("Welcome to the Flight Information Assistant");
  const departure = await ask(
    "Enter your departure airport code (e.g., LAX): ",
  );
  const destination = await ask(
    "Enter your destination airport code (e.g., JFK): ",
  );
  const date = await ask("Enter your departure date (YYYY-MM-DD): ");

  const flightData = await fetchFlightData(departure, destination, date);
  if (flightData) {
    const prompt = `Summarize the following flight itinerary details: ${
      JSON.stringify(flightData, null, 2)
    }`;
    const summary = await queryChatGPT(prompt);
    say(`Flight Summary from ChatGPT: ${summary}`);
  } else {
    say("Failed to fetch flight data.");
  }
}

main();
