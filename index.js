import OpenAI from "openai";
import { setTimeout } from "timers/promises";
import { createInterface } from "readline";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const assistant = await openai.beta.assistants.create({
  name: "Relative Valuation Analyst",
  instructions:
    "You are a financial analyst helping the user conduct a valuation of a target company.",
  model: "gpt-4-1106-preview",
  tools: [
    {
      type: "function",
      function: {
        name: "getComparableCompanyData",
        description: "Get comparable company metrics.",
        parameters: {
          type: "object",
          properties: {
            comparableCompanyTickers: {
              type: "array",
              description: "Array of Ticker Symbols.",
              items: {
                type: "string",
              },
            },
          },
          required: ["comparableCompanyTickers"],
        },
      },
    },
  ],
});

function getComparableCompanyData(tickerSymbols) {
  const comparableCompanyDatabase = {
    META: {
      ticker: "META",
      revenue: "$116 billion",
      revenue_growth: "-1%",
      ebitda_margin: "36%",
      revenue_multiple: "6.55x",
      ebitda_multiple: "15.5x",
    },
    PINS: {
      ticker: "PINS",
      revenue: "$2.8 billion",
      revenue_growth: "+9%",
      ebitda_margin: "-1%",
      revenue_multiple: "6.50x",
      ebitda_multiple: "-94.6x",
    },
    SNAP: {
      ticker: "SNAP",
      revenue: "$4.6 billion",
      revenue_growth: "+12%",
      ebitda_margin: "-20%",
      revenue_multiple: "3.42x",
      ebitda_multiple: "-24.1x",
    },
  };

  let response = [];
  for (const ticker of tickerSymbols) {
    response.push(comparableCompanyDatabase[ticker]);
  }

  return response;
}

async function checkStatus(run, threadId) {
  while (run["status"] != "completed" && run["status"] != "requires_action") {
    await setTimeout(5000);
    run = await openai.beta.threads.runs.retrieve(threadId, run.id);
    console.log("status: " + run["status"]);
  }

  await handleResponse(run, threadId);
}

async function handleRequiredActions(run, threadId) {
  let toolOutputs = [];
  const toolCalls = run["required_action"]["submit_tool_outputs"]["tool_calls"];

  for (const toolCall of toolCalls) {
    const params = JSON.parse(toolCall["function"]["arguments"]);
    toolOutputs.push({
      tool_call_id: toolCall["id"],
      output: JSON.stringify(
        getComparableCompanyData(params["comparableCompanyTickers"])
      ),
    });
  }

  run = await openai.beta.threads.runs.submitToolOutputs(threadId, run.id, {
    tool_outputs: toolOutputs,
  });

  return run;
}

async function handleResponse(run, threadId) {
  if (run["status"] === "requires_action") {
    run = await handleRequiredActions(run, threadId);
    await checkStatus(run, threadId);
  } else {
    await displayMessages(run, threadId);
  }
}

async function displayMessages(run, threadId) {
  const messages = await openai.beta.threads.messages.list(threadId);

  for (const message of messages["data"]) {
    if (message["role"] == "assistant") {
      for (const content of message["content"]) {
        console.log(content["text"]["value"]);
      }
    }
  }
}

async function startThread(userInstructions) {
  const thread = await openai.beta.threads.create();

  await openai.beta.threads.messages.create(thread.id, {
    role: "user",
    content: userInstructions,
  });

  const run = await openai.beta.threads.runs.create(thread.id, {
    assistant_id: assistant.id,
    instructions:
      "You are a financial analyst conducting a comparable company valuation. In the first paragraph of your response you should choose a valuation metric (revenue, ebitda, etc) and justify its choice. Keep this first paragraph to 2 sentences. In the second paragraph of your response you compare the target's financial metrics with the comparable companies. Limit this analysis to three sentences. And, the third paragraph of your response you should choose a range of multiples to apply to the target given the analysis of the comparable companies and then calculate an implied enterprise value. This last paragraph should be 3 sentences max.",
  });

  return { thread, run };
}

const readline = createInterface({
  input: process.stdin,
  output: process.stdout,
});

readline.question(
  `Tell me about what you're valuing?\n`,
  async (userInstructions) => {
    let { run, thread } = await startThread(userInstructions);
    await checkStatus(run, thread.id);

    readline.close();
  }
);
