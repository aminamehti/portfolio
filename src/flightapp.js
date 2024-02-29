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
        Give an output of approximate dates and the range of cost in best case and worst case scenario. Do not mention your limitations as an AI. Do not mention anything about how flight prices are predicted in the final answer. 
        Just provide the estimations. 
      `,
        { temperature: 0.3 },
      );
      console.log(result);
    } else if (command === "book") {
      say("Searching for flights...");
      say(
        "Below is a list of top 5 flights to your destination (based on price and travel time)",
      );
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

      let validCard = false;
      while (!validCard) {
        const creditCard = await ask(
          "Please enter your credit card information (16 digits)",
        );
        if (/^\d{16}$/.test(creditCard)) {
          validCard = true;
          say(
            `You've selected ${
              flights[parseInt(flightChoice, 10) - 1]
            }. Booking your flight...`,
          );
          say(
            `Your purchase was successful! Thank you for booking a flight to ${player.arrival} on ${player.date}.`,
          );
        } else {
          say(
            "Invalid credit card number. Please make sure you enter a 16 digit number.",
          );
        }
      }

      const anotherBooking = await ask(
        "Would you like to book another flight? (yes/no)",
      );
      if (anotherBooking.toLowerCase() === "yes") {
        player.departure = await ask("Enter your departure location");
        player.arrival = await ask("Enter your arrival location");
        player.date = await ask(
          "Enter your preferred travel date (YYYY-MM-DD)",
        );
      } else {
        booking = false;
        say("Thank you for using the QuickJet Booker. Goodbye!");
      }
    } else {
      say("Invalid command. Please type 'predict', 'book', or 'quit'.");
    }
  }
}
