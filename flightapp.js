import { gptPrompt } from "../shared/openai.js";
import { ask, say } from "../shared/cli.js";
import chalk from "npm:chalk@5.3.0";
import boxen from "https://esm.sh/boxen@6";
import { Select } from "https://deno.land/x/cliffy@v1.0.0-rc.3/prompt/mod.ts";

main();
async function main() {
  say(boxen(chalk.bgCyanBright("Welcome to the QuickJet!")), {
    padding: 1,
    margin: 1,
    borderStyle: "double",
  });
  //Collect user info
  let booking = true;
  const player = {};
  while (
    !player.departure || player.departure.length !== 3 ||
    !isUpperCase(player.departure)
  ) {
    player.departure = await ask(
      chalk.blueBright("Enter your departure location (e.g. JFK)"),
    );
    if (player.departure.length !== 3 || !isUpperCase(player.departure)) {
      showError();
    }
  }

  while (
    !player.arrival || player.arrival.length !== 3 ||
    !isUpperCase(player.arrival)
  ) {
    player.arrival = await ask(
      chalk.blueBright("Enter your arrival location (e.g. LAX)"),
    );
    if (player.arrival.length !== 3) showError();
  }

  while (!player.date || !isValidDate(player.date)) {
    player.date = await ask(
      chalk.blueBright("Enter your preferred travel date (YYYY-MM-DD)"),
    );
    if (!isValidDate(player.date)) showError();
  }

  say("");

  while (booking) {
    const command = await Select.prompt({
      message: "Would you like to predict price volatility or book a flight?",
      options: [
        { name: "Predict price volatility", value: "predict" },
        { name: "Book a flight", value: "book" },
        { name: "Quit", value: "quit" },
      ],
    });

    if (command === "quit") {
      booking = false;
      say(
        boxen(chalk.bgCyanBright("Thank you for using the QuickJet. Goodbye!")),
        { padding: 1, margin: 1, borderStyle: "double" },
      );
      break;
    }
    //Prediction process
    if (command === "predict") {
      const result = await gptPrompt(
        `Predict the price volatility for a flight from ${player.departure} to ${player.arrival} on ${player.date}. 
                Give an output of approximate dates and the range of cost in best case and worst case scenario. Do not mention your limitations as an AI. Do not mention anything about how flight prices are predicted in the final answer. 
                Just provide the estimations. Without changing the layout of your response, add a sentence at the end that says these numbers are an estimation and as an AI you make mistakes.`,
        { temperature: 0.3 },
      );
      console.log(result);
    } else if (command === "book") {
      await bookFlight(player);
    } else {
      say(
        chalk.red("Invalid command. Please type 'predict', 'book', or 'quit'."),
      );
    }
  }
}
//Booking process
async function bookFlight(player) {
  say(chalk.grey("Searching for flights..."));
  try {
    const flights = await searchFlights(
      player.date,
      player.departure,
      player.arrival,
    );

    if (flights.length === 0) {
      say(chalk.red("No flights found for the specified criteria."));
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

    let validChoice = false;
    while (!validChoice) {
      const flightChoice = await ask(
        chalk.blueBright("Which flight would you like to book? (Enter number)"),
      );

      if (
        flightChoice === "1" || flightChoice === "2" || flightChoice === "3"
      ) {
        validChoice = true;
        // Proceed with booking the selected flight
      } else {
        say(
          chalk.red("Please choose a flight from the displayed top 3 choices."),
        );
      }
    }

    let validCard = false;
    while (!validCard) {
      const creditCard = await ask(
        chalk.blueBright(
          "Please enter your credit card information (16 digits)",
        ),
      );
      if (creditCard.length === 16) {
        validCard = true;
        //Purchase Status
        say(boxen(chalk.green(`Your purchase was successful!`)), {
          padding: 1,
          margin: 1,
          borderStyle: "double",
        });
        say(
          chalk.bgBlue(
            `Thank you for booking a flight to ${player.arrival} on ${player.date}.`,
          ),
        );
      } else {
        say(chalk.red(
          "Invalid credit card number. Please make sure you enter a 16 digit number.",
        ));
      }
    }

    const anotherBooking = await ask(
      chalk.blueBright("Would you like to book another flight? (yes/no)"),
    );
    if (anotherBooking.toLowerCase() === "yes") {
      player.departure = await ask(
        chalk.blueBright("Enter your departure location"),
      );
      player.arrival = await ask(
        chalk.blueBright("Enter your arrival location"),
      );
      player.date = await ask(
        chalk.blueBright("Enter your preferred travel date (YYYY-MM-DD)"),
      );
    }
  } catch (error) {
    //console.error("Error searching for flights:", error); - if API error, code this to see it
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
      //console.error("API Error:", responseData.message); - if you recieve API error, code this
      throw new Error("No flights found for the specified criteria.");
    }

    return responseData.data;
  } catch (error) {
    say(
      chalk.red(
        "You have entered incorrect details, please quit and try again.",
      ),
    );
    //throw  error; if you recieve API error, code this to see it
  }
}

function isUpperCase(str) {
  return str === str.toUpperCase();
}

function isValidDate(date) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

function showError() {
  say(
    chalk.redBright(
      "The information you have entered is invalid, please try again",
    ),
  );
}
