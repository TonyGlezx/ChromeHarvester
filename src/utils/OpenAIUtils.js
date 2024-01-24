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
      process.stdout.write("\x1b\n\n[32mAssistant: \n\n\x1b[0m");

      chat_stream.on('content', (delta, snapshot) => {
        process.stdout.write(delta);
      });

      const chatCompletion = await chat_stream.finalChatCompletion();

      
      const chatResponse = chatCompletion.choices[0].message.content;         
      
      
      console.log("\n\n");
      return chatResponse;
      
      
      
  } catch (error) {
      console.error(`❌ Error sending data to ChatGPT: ${error.message}`);
      return '';
  }
}


async function handleChatIteration(messages, userInput, config, isFirstLoop = false) {
  messages.push({ role: 'user', content: userInput });
  
  // First call to ChatGPT without filters
  var chatResponse = await sendDataToChatGPT(messages, userInput, config);

  messages.push({ role: 'assistant', content: chatResponse });
  
  // Sequentially apply each filter
  if (config.filters && isFirstLoop) {
      for (let filter of config.filters) {
          // Create an array of messages for each filter
          function substitutePlaceholders(str, values) {
            return str.replace(/\{(\w+)\}/g, (match, key) => values[key] || match);
        }
        
        
        let values = {
            prevResponse: chatResponse
            
        };
        
        
          let filterMessages = filter.messages.map(msg => ({
              role: msg.role, 
              content: substitutePlaceholders(msg.content, values)
          }));
          
          // Call ChatGPT with the filter messages
          for (let filteredMessage of filterMessages){
            messages.push(filteredMessage)
            }
          chatResponse = await sendDataToChatGPT(messages, userInput, config);

          messages.push({ role: 'assistant', content: chatResponse });
      }
  } 

  
  return messages;
}


export default async function chatLoop(data, path=null) {
  const config = path ? await loadConfig(path) : null;
  

  const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
  });

  var messages = config && config.messages ? [...config.messages] : [ 
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
      await new Promise(resolve => rl.question("\x1b\n\n[34mYou: \n\n\x1b[0m", resolve))
      ;
      

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

      

      var messages = await handleChatIteration(messages, userInput, config, isFirstLoop);
      isFirstLoop = false
      


  }

  rl.close();
}
