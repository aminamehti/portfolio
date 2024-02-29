import { gptPrompt } from "./shared/openai.js";
import { ask, say } from "./shared/cli.js";

async function personalityTest() {
  const favoriteColor = await ask("What is your favorite color?");
  const vacationSpot = await ask("What is your favorite vacation spot?");
  const hobby = await ask("What is your hobby?");
  const closeFriends = await ask("How many close friends do you have?");
  const dreamHoliday = await ask("What is your dream holiday?");
  const userPrompt =
    `Given that someone's favorite color is ${favoriteColor}, their favorite vacation spot is ${vacationSpot}, their hobby is ${hobby}, they have ${closeFriends} close friends, and their dream holiday is ${dreamHoliday}, describe their personality type.`;

  try {
    const response = await gptPrompt(userPrompt, { max_tokens: 1000 }); // Adjusted to use gptPrompt function

    say("Generated Personality Type: " + response);
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

// Run the personality test
personalityTest();
