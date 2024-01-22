import fs from "fs";

export default async function saveToFile(url, source, filePath) {
    try {
        const timestamp = new Date().toISOString();
        const dataToWrite = `Timestamp: ${timestamp}\nURL: ${url}\nSource:\n${source}\n\n`;
        await fs.promises.appendFile(filePath, dataToWrite, 'utf8');
        console.log(`✔️ Appended data for ${url} to file`);
    } catch (error) {
        console.error(`❌ Error saving data for ${url} to file: ${error.message}`);
    }
}