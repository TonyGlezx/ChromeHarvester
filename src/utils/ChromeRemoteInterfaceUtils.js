import CDP from "chrome-remote-interface";
import cleanHTML from "./HTMLCleaner.js"
import axios from 'axios';

import saveToDatabase from "./DatabaseUtils.js"
import executeJavaScript from './JavaScriptExecutor.js'; // Import a hypothetical utility function
import saveToFile from "./FileUtils.js"
import chatLoop from "./OpenAIUtils.js";


// Todo
// Maybe alllow more than one method at a time.


async function getSourceFromTab(tab) {
    let client;
    try {
        client = await CDP({ tab });
        const { Runtime } = client;
        await Runtime.enable();
        const result = await Runtime.evaluate({ expression: 'document.documentElement.outerHTML' });
        //const cleanedSource = cleanHTML(result.result.value);

        async function sendPostRequest() {
            const url = 'http://localhost:8080/extract';
            const data = {
                filecontent: result.result.value 
            };
        
            try {
                const response = await axios.post(url, data);                
                return response.data;
                
            } catch (error) {
                console.error('Error:', error.response.data);
            }
        }
        
        const cleanedSource = await sendPostRequest();


        return "\n\nThis is a chrome tab:\n\n"+cleanedSource+"\n\n";
    } catch (error) {
        console.error(`Error getting source from tab: ${error.message}`);
    } finally {
        if (client) {
            await client.close();
        }
    }
}

async function postTabData(url, source, endpoint) {
    try {
        await axios.post(endpoint, { url, source });
        console.log(`✔️ Posted data for ${url}`);
    } catch (error) {
        console.error(`❌ Error posting data for ${url}: ${error.message}`);
    }
}

export async function processTabs(endpoint, dbConfig, filePath, chatGPTPrompt,scriptContent, chatGPTpath) {

  
  


    if (!endpoint && !dbConfig && !filePath && !chatGPTPrompt && !scriptContent && !chatGPTpath) {
        console.error('❌ Error: An endpoint, database configuration, file path, ChatGPT config file path or ChatGPT prompt must be provided.');
        process.exit(1);
    } else if([endpoint, dbConfig, filePath].filter(e => e).length > 1){
        console.error('❌ Error: Please provide only one output method at a time.');
        process.exit(1);
    } else if([chatGPTPrompt, chatGPTpath].filter(e => e).length > 1){
        console.error('❌ Error: Please provide only one ChatGPT prompt method at a time.');
        process.exit(1);
    } 

    if(endpoint) {
        try {
            new URL(endpoint);
        } catch(error) {
            if (error.code == 'ERR_INVALID_URL') {
                console.error(`❌ Malformed URL: ${endpoint}`);
            } else {
                console.error(`❌ Error posting data for ${url}: ${error.message}`);
            }
            process.exit(1);

        }
    }

    if(scriptContent) {
        try {
             new Function(scriptContent);
            } catch (e) {
             throw new Error('❌ Invalid JavaScript content detected. Please check your script for errors. 🐞');
        }
      }


    try {
        console.log(`🔍 Fetching tabs...`);
        const tabs = await CDP.List();
        let combinedData = chatGPTPrompt ? `${chatGPTPrompt}\n\n` : '';

        for (const tab of tabs) {
            if (tab.type === 'page') {
                const source = await getSourceFromTab(tab);
                if (source) {
                    console.log(tab.url)
                    if (endpoint) {
                        await postTabData(tab.url, source, endpoint);
                    } else if (dbConfig) {
                        await saveToDatabase(tab.url, source, dbConfig);
                    } else if (filePath) {
                        await saveToFile(tab.url, source, filePath);
                    } 
                    if (chatGPTPrompt || chatGPTpath) {
                        combinedData += `URL: ${tab.url}\nSource:\n${source}\n\n`;
                    }
                    if (scriptContent) {                       
                       await executeJavaScript(scriptContent, tab);
                                    }
                    }
            }
        }
        if (combinedData || chatGPTpath) {
            
            await chatLoop(combinedData,chatGPTpath ? chatGPTpath : null);
            
        }
        console.log(`✅ All tabs processed.`);
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.error('❌ Unable to connect to Chrome for remote debugging. ' +
                          'Please ensure Chrome is running with the --remote-debugging-port=9222 flag.');
        } else {
            console.error(`❌ Error processing tabs: ${error.message}`);
        }
    }
}
