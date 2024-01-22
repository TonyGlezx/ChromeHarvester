const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

async function sendDataToChatGPT(data, saveToFile = false) {
    data = data.replace(/\\n/g, "\n"); // Transform '/n' to new lines    
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4-0314",
        messages: [{role: 'user', content: data}],
        max_tokens: 4096
      });
      const chatResponse = response['choices'][0]['message']['content'];

      console.log(`✔️ Response from ChatGPT: ${chatResponse}`);

      if (saveToFile) {
        fs.writeFileSync(saveToFile, chatResponse, 'utf8'); // Save response to file
      }

      if (argv['copy-to-clipboard']) {
        await copyToClipboard(chatResponse);
        console.log('✔️ ChatGPT response copied to clipboard.');
    }
    

      return chatResponse;
    } catch (error) {
      console.error(`❌ Error sending data to ChatGPT: ${error.message}`);
    }
}