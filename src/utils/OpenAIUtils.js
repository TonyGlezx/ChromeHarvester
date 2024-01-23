import OpenAI from "openai";
import toml from "toml";
import { promises as fs } from 'fs';


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

export default async function sendDataToChatGPT(data, path=null) {
    const config = path ? await loadConfig(path) : null;
    let openai;
    if(config){
    if (config.api_key) {
      openai = new OpenAI({
          apiKey: config.api_key,
      });
    }
  } else {
      // Handle the case where the API key is not available
      console.log('API key is missing in the configuration');
      openai = new OpenAI()
      
  }
  if(config){
  
  var messages = []
  for(let message of config.messages){
      messages.push(message)
      
  }

  messages.push({
    role: 'user', content: config.prompt ? config.prompt+"\n\n"+data : data
  })

  } else {
  var messages = [
    {
      role: 'user', content: "You are a helpful assistant."
    },
    {
      role: 'user', content: data
    }
  ]
}
   
    data = data.replace(/\\n/g, "\n"); // Transform '/n' to new lines    
    try {
      const response = await openai.chat.completions.create({
        model: config ? config.model : "gpt-3.5-turbo-1106",
        messages,
        max_tokens: config.max_tokens ? config.max_tokens : 4000
      });
      const chatResponse = response['choices'][0]['message']['content'];

      console.log(`✔️ Response from ChatGPT: ${chatResponse}`);

      if (config.output_path) {
        fs.appendFile(config.output_path, `
        
        # START SESSION #
        
        `, 'utf8');
        messages.push({
          role: "assistant", content: chatResponse
        })
        fs.appendFile(config.output_path, JSON.stringify(messages), 'utf8');
        fs.appendFile(config.output_path, `
        
        # END SESSION #
        
        `, 'utf8');
      }

      /*if (argv['copy-to-clipboard']) {
        await copyToClipboard(chatResponse);
        console.log('✔️ ChatGPT response copied to clipboard.');
    }*/
    

      return chatResponse;
    } catch (error) {
      console.error(`❌ Error sending data to ChatGPT: ${error.message}`);
    }
}
