
export async function parseChunk(chunk: string) {
    const lines = chunk.split('\n');
    let nmi: string | null = null;
    const sqlStatements = [];

    for (const line of lines) {
        if (line.trim() === '') continue; // Skip empty lines

        const parts = line.split(',');

        switch (parts[0]) {
            case '100':
                nmi = parts[3]; // Extract NMI
                break;
            case '300':
                if (nmi) {
                    const dateStr = parts[1];
                    const year = dateStr.substring(0, 4);
                    const month = dateStr.substring(4, 6);
                    const day = dateStr.substring(6, 8);
                    const timestamp = new Date(`${year}-${month}-${day}T00:00:00.000Z`); // Construct timestamp (UTC)

                    // Assuming consumption values start from index 14
                    for (let i = 14; i < parts.length -1; i++) { // Correctly iterate up to second to last value
                        const consumption = parseFloat(parts[i]);
                        if (!isNaN(consumption)) {
                            const insertStatement = `INSERT INTO meter_readings ("nmi", "timestamp", "consumption") VALUES ('${nmi}', '${timestamp.toISOString()}', ${consumption});`;
                            sqlStatements.push(insertStatement);
                        }
                    }
                }
                break;
            // Handle other record types (200, 500, 900) if needed for NMI or other data
            case '200':
                if (parts[2]) {
                    nmi = parts[2];
                }
                break;
        }
    }
    console.log('SQL statements', sqlStatements)
    return sqlStatements.join('\n'); // Return the SQL statements as a single string
}
