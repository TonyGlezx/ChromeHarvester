import OpenAI from "openai";
import toml from "toml";
import { promises as fs } from 'fs';
import readline from 'readline';



async function loadConfig(path) {
  try {
      const data = await fs.readFile(path, 'utf-8');
      const config = toml.parse(data);           
      return config;
  } catch (err) {
      console.error('Error reading the TOML file:', err);
      process.exit(1)      
  }
}

async function sendDataToChatGPT(messages, data, config) {
  try {
      const openai = new OpenAI({ apiKey: config.api_key });
      const chat_stream = await openai.beta.chat.completions.stream({
          model: config.model || "gpt-3.5-turbo-1106",
          messages,
          max_tokens: config.max_tokens || 4000,
          stream: true
      });
      process.stdout.write("Assistant: ");
      chat_stream.on('content', (delta, snapshot) => {
        process.stdout.write(delta);
      });

      const chatCompletion = await chat_stream.finalChatCompletion();

      

      
      return chatCompletion.choices[0].message.content;
  } catch (error) {
      console.error(`❌ Error sending data to ChatGPT: ${error.message}`);
      return '';
  }
}

export default async function chatLoop(data, path=null) {
  const config = path ? await loadConfig(path) : null;

  const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
  });

  let messages = config && config.messages ? [...config.messages] : [ 
    {
    role: 'user', content: "You are a helpful assistant."
    },
    {
     role: 'user', content: data
     }
  ];

  var isFirstLoop = true

  while (true) {
      const userInput = isFirstLoop ? 
      config.prompt ? config.prompt+`
      
      `+data : data :
      await new Promise(resolve => rl.question("You: ", resolve))
      ;
      isFirstLoop = false

      if (userInput.toLowerCase() === 'exit()') {
          var to_push = []
          if (config && config.output_path) {
            try {              
              var existing_chat = JSON.parse(await fs.readFile(config.output_path, 'utf8'));                     
              to_push.push(existing_chat);
              to_push.push(messages)
          } catch {
              to_push = messages;
          }
           
                 
              
              await fs.appendFile(config.output_path, JSON.stringify(to_push), 'utf8');
          }
          console.log("Exiting chat.");
          break;
      }

      messages.push({ role: 'user', content: userInput });
      const chatResponse = await sendDataToChatGPT(messages, userInput, config);
      messages.push({ role: 'assistant', content: chatResponse });
  }

  rl.close();
}
