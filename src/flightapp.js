import { gptPrompt } from "./shared/openai.js";
import { ask, say } from "./shared/cli.js";

main();

async function main() {
  say("Welcome to the QuickJet Booker!");
  //Collect user info
  let booking = true;
  const player = {};
  player.departure = await ask("Enter your departure location (e.g. JFK)");
  player.arrival = await ask("Enter your arrival location (e.g. LAX)");
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
    //Prediction process
    if (command === "predict") {
      const result = await gptPrompt(
        `Predict the price volatility for a flight from ${player.departure} to ${player.arrival} on ${player.date}. 
                Give an output of approximate dates and the range of cost in best case and worst case scenario. Do not mention your limitations as an AI. Do not mention anything about how flight prices are predicted in the final answer. 
                Just provide the estimations.`,
        { temperature: 0.3 },
      );
      console.log(result);
    } else if (command === "book") {
      await bookFlight(player);
    } else {
      say("Invalid command. Please type 'predict', 'book', or 'quit'.");
    }
  }
}
//Booking process
async function bookFlight(player) {
  say("Searching for flights...");
  try {
    const flights = await searchFlights(
      player.date,
      player.departure,
      player.arrival,
    );

    if (flights.length === 0) {
      say("No flights found for the specified criteria.");
      return;
    }

    // Display the top 3 cheapest flights
    for (let i = 0; i < Math.min(3, flights.length); i++) {
      const flight = flights[i];
      say(
        `Flight ${i + 1}: Price ${flight.price.currencyCode} ${
          parseFloat(flight.price.units + "." + flight.price.nanos).toFixed(2)
        }`,
      );
    }

    // If less than 3 flights are available, message for the remaining options
    for (let i = flights.length; i < 3; i++) {
      say(`Flight ${i + 1}: No available flight for this option`);
    }

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
        //Purchase Status
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
      player.date = await ask("Enter your preferred travel date (YYYY-MM-DD)");
    } else {
      say("Thank you for using the QuickJet Booker. Goodbye!");
    }
  } catch (error) {
    console.error("Error searching for flights:", error);
  }
}

async function searchFlights(departDate, departureCode, arrivalCode) {
  const url = new URL(
    "https://booking-com15.p.rapidapi.com/api/v1/flights/getMinPrice",
  );
  url.searchParams.set("fromId", `${departureCode}.AIRPORT`);
  url.searchParams.set("toId", `${arrivalCode}.AIRPORT`);
  url.searchParams.set("departDate", departDate);
  url.searchParams.set("cabinClass", "ECONOMY");
  url.searchParams.set("currency_code", "USD");

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": "0ea28b21a6msh37e35b3497e6935p1b56cdjsn12582262e4cb",
        "X-RapidAPI-Host": "booking-com15.p.rapidapi.com",
      },
    });
    const responseData = await response.json();

    if (!responseData.status) {
      console.error("API Error:", responseData.message);
      throw new Error("No flights found for the specified criteria.");
    }

    return responseData.data;
  } catch (error) {
    throw new Error("Error fetching flights:", error);
  }
}
