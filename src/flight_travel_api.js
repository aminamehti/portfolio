import { ask, say } from "./shared/cli.js";

main();

async function main() {
    say("Welcome to the QuickJet Booker!");

    let booking = true;
    const player = {};
    player.departure = await ask("Enter your departure airport code (e.g., JFK)");
    player.arrival = await ask("Enter your arrival airport code (e.g., LAX)");
    player.date = await ask("Enter your preferred travel date (YYYY-MM-DD)");

    say("");

    while (booking) {
        const command = await ask(
            "Would you like to predict price volatility or book a flight? (predict/book/quit)"
        );

        if (command === "quit") {
            booking = false;
            say("Thank you for using the QuickJet Booker. Goodbye!");
            break;
        }

        if (command === "predict") {
            // Implementation for price prediction
        } else if (command === "book") {
            await searchFlights(player.date, player.departure, player.arrival);
        } else {
            say("Invalid command. Please type 'predict', 'book', or 'quit'.");
        }
    }
}

async function searchFlights(departDate, departureCode, arrivalCode) {
    const url = new URL('https://booking-com15.p.rapidapi.com/api/v1/flights/getMinPrice');
    url.searchParams.set('fromId', `${departureCode}.AIRPORT`);
    url.searchParams.set('toId', `${arrivalCode}.AIRPORT`);
    url.searchParams.set('departDate', departDate);
    url.searchParams.set('cabinClass', 'ECONOMY');
    url.searchParams.set('currency_code', 'USD');

    try {
        console.log("Making API call to search flights...");
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-RapidAPI-Key': '0ea28b21a6msh37e35b3497e6935p1b56cdjsn12582262e4cb',
                'X-RapidAPI-Host': 'booking-com15.p.rapidapi.com'
            }
        });
        const responseData = await response.json();

        if (!responseData.status) {
            console.error("API Error:", responseData.message);
            say("No flights found for the specified criteria.");
            return;
        }

        const flights = responseData.data;

        if (flights.length === 0) {
            say("No flights found for the specified criteria.");
            return;
        }

        // Sort the flights based on price
        flights.sort((a, b) => a.price.units - b.price.units || a.price.nanos - b.price.nanos);

        // Display the top 3 cheapest flights
        for (let i = 0; i < Math.min(3, flights.length); i++) {
            const flight = flights[i];
            const price = `${flight.price.currencyCode} ${parseFloat(flight.price.units + '.' + flight.price.nanos).toFixed(2)}`;
            say(`Flight ${i + 1}: Price ${price}`);
        }

        // If fewer than 3 flights are available, display a message for the remaining options
        for (let i = flights.length; i < 3; i++) {
            say(`Flight ${i + 1}: No available flight for this option`);
        }
    } catch (error) {
        console.error("Error fetching flights:", error);
    }
}
