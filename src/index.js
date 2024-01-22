#!/usr/bin/env node

import dotenv from 'dotenv';
import { argv } from './CommandLineInterface.js';
import { processTabs } from './utils/ChromeRemoteInterfaceUtils.js';



dotenv.config();

async function main() {       

    try {
        await processTabs(argv.endpoint, argv.dbconfig, argv.output, argv.chatgpt, argv['js-file']);
        
    } catch (error) {
        console.error(`❌ An error occurred: ${error.message}`);
        process.exit(1);
    }
}

main();
