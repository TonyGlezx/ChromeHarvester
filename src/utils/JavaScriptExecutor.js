// Todo: it injects js twice when one tab is opened along the inspector

// JavaScriptExecutor.js
import CDP from "chrome-remote-interface";

export default async function executeJavaScript(scriptContent, tabId) {
    let client;
    try {
        // Connect to the specified tab
        client = await CDP({ tab: tabId });
        const { Runtime } = client;
        await Runtime.enable();

        // Execute the script
        await Runtime.evaluate({ expression: scriptContent });
        console.log(`✔️ Executed script on tab with id ${tabId}`);
    } catch (error) {
        console.error(`❌ Error executing script on tab with id ${tabId}: ${error.message}`);
    } finally {
        if (client) {
            await client.close();
        }
    }
}


