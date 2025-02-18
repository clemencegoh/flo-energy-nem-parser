import { NextRequest, NextResponse } from "next/server";
import { S3Client, ListBucketsCommand, HeadObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import csv from 'csv-parser';
import { Readable } from "stream";

const s3Basepath = process.env.S3_BUCKET_PART;

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
        const csvFilepath = `${s3Basepath}${filename}`;

        const params = {
            Bucket: process.env.S3_UPLOAD_BUCKET,
            Key: `next-s3-uploads/${filename}`,
        };

        // downloads CSV
        const getCommand = new GetObjectCommand(params);
        const data = await s3Client.send(getCommand);
        if (!data.Body) {
            throw new Error("No data returned from S3");
        }

        // parses it into JSON with readable SQL statements
        // Cast needed here as node complains about Body not being a stream otherwise
    // Important: Use a TextDecoder to handle the stream of data
    const decoder = new TextDecoder('utf-8'); // Assuming UTF-8 encoding

    let remaining = ''; // Store any incomplete lines
    const streamBody: Readable = data.Body;

    streamBody.on('data', (chunk) => {
    const chunkString = decoder.decode(chunk); // Decode the chunk to a string
    const lines = (remaining + chunkString).split(/\r\n|\n|\r/); // Split into lines

    remaining = lines.pop(); // The last element might be an incomplete line

    for (const line of lines) {
        if (line.trim() !== '') { // Skip empty lines
        // Process each line here:
        console.log(line); // Example: Log each line

        // If you need to send data to the client, you can do it here, but be mindful of the volume of data
        // Example: res.write(JSON.stringify({ data: line }) + '\n'); // Send each line as JSON
        }
    }
    });

    streamBody.on('end', () => {
    if (remaining.trim() !== '') {
        // Process any remaining line
        console.log(remaining);

        // If you're sending data to the client:
        // res.write(JSON.stringify({ data: remaining }) + '\n');
    }

   // If you're sending data to the client, you must call res.end() to finish the response
   // res.end();

        console.log('CSV reading complete');
    });

    streamBody.on('error', (err) => {
        console.error('Error reading CSV:', err);
    });


        // re-uploads
        // const parsedFilepath = `${s3Basepath}/${filename}.json`;
        return NextResponse.json({message: ''}, {status: 200});
    } catch (error) {
        return NextResponse.json({
            message: "Error",
            error
        })
    }
    
}


