#!/usr/bin/env node

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const CDP = require('chrome-remote-interface');
const axios = require('axios');
const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

const { OpenAI } = require('openai');

const cheerio = require('cheerio');



async function copyToClipboard(data) {
    try {
      const clipboardy = await import('clipboardy');
      clipboardy.default.writeSync(data);
      console.log('✔️ ChatGPT response copied to clipboard.');
    } catch (error) {
      console.error('❌ Error copying to clipboard:', error.message);
    }
  }
  

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


function cleanHTML(htmlContent) {
    const $ = cheerio.load(htmlContent);
    // Remove script tags
    $('script').remove();
    $('style').remove();
    // Remove link tags
    $('link').remove();
    // Remove elements you consider irrelevant, e.g., headers, footers, etc.
    $('header').remove();
    $('footer').remove();
    // ... any other cleaning steps
  
    // Return the cleaned HTML as text or as HTML, based on your requirement
    return $('body').text(); // for text
    // return $.html(); // for cleaned HTML
  }

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

  

async function saveToFile(url, source, filePath) {
    try {
        const timestamp = new Date().toISOString();
        const dataToWrite = `Timestamp: ${timestamp}\nURL: ${url}\nSource:\n${source}\n\n`;
        await fs.promises.appendFile(filePath, dataToWrite, 'utf8');
        console.log(`✔️ Appended data for ${url} to file`);
    } catch (error) {
        console.error(`❌ Error saving data for ${url} to file: ${error.message}`);
    }
}


async function getSourceFromTab(tab) {
    let client;
    try {
        client = await CDP({ tab });
        const { Runtime } = client;
        await Runtime.enable();
        const result = await Runtime.evaluate({ expression: 'document.documentElement.outerHTML' });
        const cleanedSource = cleanHTML(result.result.value);
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

async function saveToDatabase(url, source, dbConfig) {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const query = 'INSERT INTO tab_data (url, source) VALUES (?, ?)';
        await connection.execute(query, [url, source]);
        console.log(`✔️ Saved data for ${url}`);
    } catch (error) {
        // Verbose error handling
        if (error.code) {
            switch (error.code) {
                case 'ER_ACCESS_DENIED_ERROR':
                    console.error(
                        '❌ MySQL Access Denied:\n' +
                        '   - Invalid username or password.\n' +
                        '   - Please verify your credentials.\n' +
                        '   - Technical Details: Error Code - ' + error.code + ', Message - ' + error.message
                    );

                    break;
                case 'ENOTFOUND':
                    console.error(
                        '❌ MySQL Server Not Found:\n' +
                        '   - Unable to locate the MySQL server.\n' +
                        '   - Check your host and port settings.\n' +
                        '   - Ensure the server address is correct and reachable.\n' +
                        '   - Technical Details: Error Code - ' + error.code + ', Message - ' + error.message
                    );

                    break;
                case 'ER_BAD_DB_ERROR':
                    console.error(
                        '❌ MySQL Database Not Found:\n' +
                        '   - The specified database does not exist.\n' +
                        '   - Check your database name for typos or incorrect casing.\n' +
                        '   - Technical Details: Error Code - ' + error.code + ', Message - ' + error.message
                    );
                    break;
                // Add more cases as needed for specific MySQL errors
                case 'ECONNREFUSED':
                    console.error(
                        '❌ MySQL Connection Refused:\n' +
                        '   - Unable to connect to the MySQL server.\n' +
                        '   - Ensure the server is running and network settings are correct.\n' +
                        '   - Technical Details: Error Code - ' + error.code + ', Message - ' + error.message
                    );

                    break;
                default:
                    console.error(`❌ MySQL Error (${error.code}): ${error.message}`);
            }
        } else {
            console.error(`❌ Error saving data for ${url}: ${error.message}`);
        }
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}


async function processTabs(endpoint, dbConfig, filePath, chatGPTPrompt) {


    if (!endpoint && !dbConfig && !filePath && !chatGPTPrompt) {
        console.error('❌ Error: An endpoint, database configuration, file path, or ChatGPT prompt must be provided.');
        process.exit(1);
    } else if([endpoint, dbConfig, filePath].filter(e => e).length > 1){
        console.error('❌ Error: Please provide only one output method at a time.');
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


    try {
        console.log(`🔍 Fetching tabs...`);
        const tabs = await CDP.List();
        let combinedData = chatGPTPrompt ? `${chatGPTPrompt}\n\n` : '';

        for (const tab of tabs) {
            if (tab.type === 'page') {
                const source = await getSourceFromTab(tab);
                if (source) {
                    if (endpoint) {
                        await postTabData(tab.url, source, endpoint);
                    } else if (dbConfig) {
                        await saveToDatabase(tab.url, source, dbConfig);
                    } else if (filePath) {
                        await saveToFile(tab.url, source, filePath);
                    } else if (chatGPTPrompt) {
                        combinedData += `URL: ${tab.url}\nSource:\n${source}\n\n`;
                    }
                }
            }
        }
        if (combinedData) {
            await sendDataToChatGPT(combinedData);
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

const argv = yargs(hideBin(process.argv))
    .usage('Usage: $0 -e [endpoint] or $0 --dbconfig [path to db config file] or $0 -o [The file path to save the output] or -c [Custom prompt to ChatGPT + source]')
    .option('endpoint', {
        alias: 'e',
        describe: 'The endpoint to which data should be posted',
        type: 'string'
    })
    .option('dbconfig', {
        describe: 'Path to the JSON file containing database configuration',
        type: 'string',
        coerce: path => {
            if (path) {
                return JSON.parse(fs.readFileSync(path, 'utf8'));
            }
        }
    }).option('output', {
        alias: 'o',
        describe: 'The file path to save the output',
        type: 'string'
    }).option('chatgpt', {
        alias: 'c',
        describe: 'Custom prompt to prepend to the data before sending to ChatGPT',
        type: 'string'
      }).option('prompt-file', {
        alias: 'p',
        describe: 'Path to a file containing a custom prompt',
        type: 'string'
    }).option('copy-to-clipboard', {
        alias: 'cc',
        describe: 'Copy ChatGPT response to clipboard',
        type: 'boolean'
    })
    .help()
    .strict()
    .argv;

let customPrompt = argv.chatgpt;
if (argv['prompt-file']) {
    if (fs.existsSync(argv['prompt-file'])) {
        customPrompt = fs.readFileSync(argv['prompt-file'], 'utf8');
    } else {
        console.error(`❌ File not found: ${argv['prompt-file']}`);
        process.exit(1);
    }
}
    

processTabs(argv.endpoint, argv.dbconfig, argv.output, customPrompt);














