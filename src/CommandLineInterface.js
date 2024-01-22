// Located at the root of your project

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import fs from "fs";

export const argv = yargs(hideBin(process.argv))
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
    })
    .option('output', {
        alias: 'o',
        describe: 'The file path to save the output',
        type: 'string'
    })
    .option('chatgpt', {
        alias: 'c',
        describe: 'Custom prompt to prepend to the data before sending to ChatGPT',
        type: 'string'
    })
    .option('prompt-file', {
        alias: 'p',
        describe: 'Path to a file containing a custom prompt',
        type: 'string'
    })
    .option('copy-to-clipboard', {
        alias: 'cc',
        describe: 'Copy ChatGPT response to clipboard',
        type: 'boolean'
    }).option('js-file', {
        alias: 'j',
        describe: 'Path to a JavaScript file to be executed',
        type: 'string',
        coerce: path => {
            if (path) {
                return fs.readFileSync(path, 'utf8');
            }
        }
    })
    
    .help()
    .argv;
