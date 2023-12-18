# Relative Valuation Copilot

## About

This project builds a simple AI Assistant using OpenAI's GPT4 to help a financial analyst conduct a valuation of a private company. The user is prompted in the command line to provide some specifics about their valuation. The script creates an assistant, thread, and sends messages. It also utilizes the function calling tooling provided by OpenAI to fetch current market information for comparable companies. This is a example / proof of concept project as there is no back and forth chat interface with the user and the there are only 3 hardcoded comparable companies to "fetch" data for.

## Setup

Export your Open AI key:

```
export OPENAI_API_KEY=${YOUR API KEY}
```

Start the program:

```
node index.js
```

Provide user input:

> Tell me about what you're valuing?

> I want to value a private company called Tiktok. Tiktok has $85 billion in revenue, +38% revenue growth, and $25 billion in EBITDA. The company is in the social media industry. The comparable companies that I want to use for the relative valuation are META, PINS, and SNAP. The current market sentiment values profitability over growth.

Next steps:

- Simple chat interface with typical task prompt suggestions
- Include proprietary document search (e.g. Azure OpenAI document search)
- Use fine tuning to embed corporate style guide
