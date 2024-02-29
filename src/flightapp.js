import { gptPrompt } from "./shared/openai.js";
import { ask, say } from "./shared/cli.js";

main();

async function main() {
  say("Welcome to the QuickJet Booker!");

  let booking = true;
  const player = {};
  player.departure = await ask("Enter your departure location");
  player.arrival = await ask("Enter your arrival location");
  player.date = await ask("Enter your preferred travel date (YYYY-MM-DD)");

  say("");

  while (booking) {
    const command = await ask(
      "Would you like to predict price volatility or book a flight? (predict/book/quit)",
    );

    if (command === "quit") {
      booking = false;
      say("Thank you for using the QuickJet Booker. Goodbye!");
      break;
    }

    if (command === "predict") {
      const result = await gptPrompt(
        `Predict the price volatility for a flight from ${player.departure} to ${player.arrival} on ${player.date}. 
        Give an output of approximate dates and the range of cost in best case and worst case scenario. Do not mention your limitations as an AI. Do not mention anythign about how flight prices are predicted in the final answer. 
        Just provide the estimations. 
      `,
        { temperature: 0.3 },
      );
      console.log(result);
    } else if (command === "book") {
      // Simulate booking process
      say("Searching for flights...");
      const flights = [
        "Flight 1",
        "Flight 2",
        "Flight 3",
        "Flight 4",
        "Flight 5",
      ];
      flights.forEach((flight, index) => say(`${index + 1}. ${flight}`));
      const flightChoice = await ask(
        "Which flight would you like to book? (Enter number)",
      );
      say(
        `You've selected ${
          flights[parseInt(flightChoice, 10) - 1]
        }. Booking your flight...`,
      );
    } else {
      say("Invalid command. Please type 'predict', 'book', or 'quit'.");
    }
  }
}

async function fetchOpenAIPrediction(promptText) {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    throw new Error("OpenAI API key is not set in environment variables.");
  }

  const response = await fetch("https://api.openai.com/v1/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-davinci-003",
      prompt: promptText,
      temperature: 0.7,
      max_tokens: 1150,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch from OpenAI: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].text.trim();
}
