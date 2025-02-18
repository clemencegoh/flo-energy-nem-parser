'use client';

import CopyableBlock from "@/components/CopyableBlock";
import FileUploadComponent from "@/components/FileUpload";
import { ExpectedS3File } from "@/components/interface";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";


export default function Home() {

  const [files, setFiles] = useState<ExpectedS3File[]>([]);
  const [selectedFilePos, setSelectedFilePos] = useState<number>();

  const {mutate: requestParseMutation} = useMutation({
    mutationKey: ['trigger sql parsing'],
    mutationFn: (key: string) => fetch('/api/sql-statement-parser', {
        method: "POST",
        body: JSON.stringify({
          filename: key,
        })
    })
  });

  const uploadThenParse = async (url: string, key: string) => {
    setFiles((files) => {
      return [
        ...files,
        {
          filename: key.split('/').at(-1) ?? '',
          key: key,
          url: url,
        }
      ]
    })
    requestParseMutation(key);
  }

  const {data: sqlLines, error: fetchLinesErr} = useQuery({
    queryKey: ['sqlLines', JSON.stringify(files), selectedFilePos],
    queryFn: async () => {
      if (selectedFilePos == undefined) return;
      const selectedFile = files[selectedFilePos];
      const filename = `${selectedFile.url}.json`;

      const resp = await fetch(filename);
      const data = await resp.json();
      if (data.sql === '') {
        throw new Error()
      } 
      return data.sql;
    },
    enabled: selectedFilePos != null && files?.length > 0,
  })

  return (
    <div className="flex flex-col gap-2 items-center justify-items-center min-h-screen p-8 pb-20 sm:p-20 font-[family-name:var(--font-geist-sans)] h-screen">
      <h1 className="text-3xl font-bold">NEM CSV Parser</h1>

      <div className="flex items-start mt-2">
        <FileUploadComponent 
          onUploaded={uploadThenParse} 
          classnames="rounded-md px-2 py-1 font-bold py-2.5 px-5 me-2 mb-2 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700" 
        />
      </div>

      <div className="grid grid-cols-3 w-screen px-4 gap-2">
        <section className="col-span-1 flex flex-col gap-2 overflow-auto">
            {files.map((file, index) => (
              <button key={file.filename} className="rounded-md me-2 mb-2 text-sm font-medium text-gray-900 focus:outline-none bg-white border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700 px-6 py-3 cursor-pointer text-ellipsis text-wrap break-all" onClick={() => {
                setSelectedFilePos(index)
              }}>
                <p>
                {file.filename}
                </p>
              </button>
            ))}
        </section>
        <section className="col-span-2 flex items-center justify-center">
          {sqlLines && <CopyableBlock markdown={sqlLines} /> }
          {fetchLinesErr && <p className="text-red-400">Error fetching data for this file</p>}
        </section>
      </div>
    </div>
  );
}
