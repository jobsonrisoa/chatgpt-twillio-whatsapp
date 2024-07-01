const { OpenAI } = require("openai");
const twilio = require("twilio");
require("dotenv").config();

const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, OPENAI_API_KEY } = process.env;

// Create a Twilio client and OpenAI client
twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

module.exports = async (req, res) => {
  try {
    // Create a new Twilio Response object and send a message
    const twiml = new twilio.twiml.MessagingResponse();
    const userMessage = req.body.Body;

    // Process message with OpenAI's GPT API and return response
    const response = await processMessageWithChatGPT(userMessage);
    twiml.message(response);

    // Send the response back to Twilio
    res.set("Content-Type", "text/xml");
    res.status(200).send(twiml.toString());
  } catch (error) {
    console.error("Error processing message:", error);
    const errorMessage =
      error.response && error.response.data && error.response.data.error
        ? error.response.data.error
        : "Something went wrong";

    res.status(500).send({
      message: "Something went wrong",
      error: errorMessage,
    });
  }
};

// Returns a response from OpenAI's GPT API
const processMessageWithChatGPT = async (message) => {
  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: message }],
      stream: true,
    });

    let fullResponse = "";

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      fullResponse += content;
      process.stdout.write(content); // For debugging purposes
    }

    return fullResponse;
  } catch (error) {
    console.error("Error in OpenAI API call:", error);
    throw error;
  }
};
