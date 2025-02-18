import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";
import { parseChunk } from "./service";


const s3Client = new S3Client({ 
    region: process.env.S3_UPLOAD_REGION,
    credentials: { 
        accessKeyId: process.env.S3_UPLOAD_KEY ?? '',
        secretAccessKey: process.env.S3_UPLOAD_SECRET ?? '',
    },
});

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


