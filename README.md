# Flo energy CSV Parser


## Technologies used and why
### Frontend
- NextJS 
    - Chosen for it's "full stack" capability
    - We effectively only need a lightweight app for uploading and displaying results from a backend
    - Since we're expecting CSV files which potentially could be very large, instead of uploading it to backend and storing it in memory, we'll opt to upload into S3 first for async consumption and parsing later.
    - We then get the parsed file URL from backend, download that resource and display that on the frontend instead since we can now reasonably expect it to be smaller.
- Display format
    - Since we're displaying SQL statements, we'll want to display it in a markdown format, separated by "CREATE" or "INSERT" statements, which can then be scrolled and collapsed on a file-basis
- State management
    - Normally, 

### Backend
- NextJS's API routes can take the place of a lightweight backend.
- Storage:
    - We have 2 options: 
        1. Accept the upload directly into backend and perform the parsing sync
            - Advantage: 
                - Allows feedback to frontend straight away for small files
                - No extra storage required, all csv files are parsed straight away then discarded
            - Disadvantage: 
                - Possibly a bottleneck which lowers availability at scale
        2. Use 1 endpoint for upload into S3, and a queue system for parsing and uploading parsed file back into S3 for consumption. Being a serverless architecture on Vercel + NextJS, a serverless function can be fired off every time the main upload is done, which shouldn't be a blocking call.
            - Advantage:
                - no bottleneck for performing parsing operations, csv file gets parsed async
                - Horizontally scalable, a microservices architecture can also be used to scale the service handling the accepting of requests or parsing, depending on which one has more load.
            - Disadvantage:
                - Extra storage required, using S3 for both the uploaded file and the parsed file (in JSON format)
                - Extra API endpoint needed for determining upload/parsing status
- Possible improvements:
    - Actually implement something like BullMQ with Redis for a queue system rather than calling it via frontend


## Explaining the CSV
- 100 seems to be the headers
- 900 indicates end of file
- information required for INSERT statements seem to all be from 200, 300, and 500 statements
- Initial provided CREATE TABLE statement seems to be missing fields
    - `constraint meter_readings_unique_consumption UNIQUE ("nmi", "timestamp")` necessarily would be violated if there are 2 or more meters since they have the same nmi
- Since this is a frontend-focused task, with only 1 sample csv, there isn't enough data to confirm nor deny assumptions. Am going to leave this alone.




## Running the app

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
