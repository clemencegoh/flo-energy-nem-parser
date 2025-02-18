import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";


const s3Client = new S3Client({ 
    region: process.env.S3_UPLOAD_REGION,
    credentials: { 
        accessKeyId: process.env.S3_UPLOAD_KEY ?? '',
        secretAccessKey: process.env.S3_UPLOAD_SECRET ?? '',
    },
});

async function parseChunk(chunk: string) {
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


export async function POST(request: NextRequest) {
    try{
        const body = await request.json();
        const filename = body['filename'];

        const params = {
            Bucket: process.env.S3_UPLOAD_BUCKET,
            Key: filename,
        };

        // downloads CSV
        const getCommand = new GetObjectCommand(params);
        const data = await s3Client.send(getCommand);
        if (!data.Body) {
            throw new Error("No data returned from S3");
        }

        // parses it into JSON with readable SQL statements
        
        // Important: Use a TextDecoder to handle the stream of data
        const decoder = new TextDecoder('utf-8'); // Assuming UTF-8 encoding

        let remaining = ''; // Store any incomplete lines
        
        // @ts-expect-error: Typing error: This is a Readable
        const streamBody: Readable = data.Body;
        const nemChunks: string[] = [];
        const parsedStatements: Promise<string>[] = [];

        streamBody.on('data', (chunk) => {
            const chunkString = decoder.decode(chunk); // Decode the chunk to a string
            const lines = (remaining + chunkString).split(/\r\n|\n|\r/); // Split into lines

            remaining = lines.pop() ?? ''; // The last element might be an incomplete line

            for (const line of lines) {
                if (line.trim() !== '') { // Skip empty lines
                    const parts = line.split(',');
                    console.log("POARTS", parts, line)
                    if (parts.at(0) === '100') {
                        nemChunks.push(line + '\n');
                        if (nemChunks.length > 1) {
                            parsedStatements.push(parseChunk(nemChunks.shift() ?? ''))
                        }
                    } else {
                        nemChunks[nemChunks.length - 1] = nemChunks.at(-1) + line + '\n';
                    }
                }
                console.log('nemchunks?', nemChunks);
            }
        });

        streamBody.on('end', async () => {
            if (remaining.trim() !== '') {
                nemChunks[nemChunks.length - 1] = nemChunks[nemChunks.length - 1] + remaining;
            }

            if (nemChunks.length > 0) { // Make sure there's at least one chunk to process
                parsedStatements.push(parseChunk(nemChunks.shift() ?? ''));
            }

            const resolvedStatements = await Promise.all(parsedStatements); // Resolve all promises

            const allSQL = resolvedStatements.join('\n');  // Combine all SQL statements
        
            const jsonOutput = JSON.stringify({ sql: allSQL }, null, 2); // Wrap SQL in a JSON object
        
            const uploadParams = {
                Bucket: process.env.S3_UPLOAD_BUCKET,
                Key: `${filename}.json`, // New key for the JSON file
                Body: jsonOutput, // The JSON string
                ContentType: 'application/json', // Set correct content type
            };

            const putCommand = new PutObjectCommand(uploadParams);
            await s3Client.send(putCommand);

            console.log('CSV reading and JSON upload complete');
            return NextResponse.json({ message: 'CSV processing and JSON upload complete' }, { status: 200 });
        });

        streamBody.on('error', (err) => {
            throw new Error(err.message);
        });

        return NextResponse.json({message: ''}, {status: 200});
    } catch (error) {
        return NextResponse.json({
            message: "Error",
            error,   
        }, {
            status: 404
        })
    }
    
}


