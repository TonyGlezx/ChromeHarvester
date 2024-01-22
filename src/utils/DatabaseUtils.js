import mysql from 'mysql2/promise';


export default async function saveToDatabase(url, source, dbConfig) {
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