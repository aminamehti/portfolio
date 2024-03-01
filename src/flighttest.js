import { ask, say } from "./shared/cli.js";

main();

async function main() {
  say("Welcome to the QuickJet Booker!");

  const player = {};
  player.departure = await ask("Departure location");
  player.arrival = await ask("Arrival location");
  player.date = await ask("Preferred travel date (YYYY-MM-DD)");

  say("");

  while (true) {
    const command = await ask("Predict price volatility or book a flight? (predict/book/quit)");

    if (command === "quit") {
      say("Goodbye!");
      break;
    }

    if (command === "predict") {
      say("Price volatility prediction is not yet implemented.");
    } else if (command === "book") {
      await bookFlight(player);
      break;
    } else {
      say("Invalid command. Please type 'predict', 'book', or 'quit'.");
    }
  }
}

async function bookFlight(player) {
  say("Searching for flights...");

  try {
    const flights = await searchFlights(player.date, player.departure, player.arrival);

    if (flights.length === 0) {
      say("No flights found.");
      return;
    }

    for (let i = 0; i < Math.min(3, flights.length); i++) {
      const flight = flights[i];
      say(`Flight ${i + 1}: Price ${flight.price.currencyCode} ${parseFloat(flight.price.units + "." + flight.price.nanos).toFixed(2)}`);
    }

    const flightChoice = await ask("Which flight would you like to book? (Enter number)");
    await promptCreditCard();
    say("Purchase successful!");

    const anotherBooking = await ask("Book another flight? (yes/no)");
    if (anotherBooking.toLowerCase() === "yes") {
      await main();
    } else {
      say("Goodbye!");
    }
  } catch (error) {
    console.error("Error:", error);
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
      console.log("Making API call to search flights...");
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
  
      return responseData.data || []; // Ensure to return an empty array if no flights are found
    } catch (error) {
      throw new Error("Error fetching flights:", error);
    }
  }
  