'use client';

import { useEffect, useState } from "react";
import { useS3Upload } from "next-s3-upload";
import { CheckmarkIcon, LoadingIcon } from "./icons/icons";

const uploadFolder = process.env.NEXT_PUBLIC_UPLOAD_FOLDER ?? '';

type Props = {
  onUploaded?: (filename: string) => void;
}

export default function FileUploadComponent({ 
  onUploaded
}: Props) {
  const [uploadUrl, setUploadUrl] = useState<string>();
  const [loading, setLoading] = useState<boolean>(true);
  const { FileInput, openFileDialog, uploadToS3, files} = useS3Upload();

  // @ts-expect-error: file typing any
  const handleFileChange = async (file) => {
    setLoading(true);
    const { url } = await uploadToS3(file);
    setUploadUrl(url);
    setLoading(false);
  };

  useEffect(() => {
    if (uploadUrl) {
      const fileparts = uploadUrl.split(uploadFolder);
      onUploaded?.(fileparts[1]);
    }
    console.log(uploadUrl);
  }, [uploadUrl, onUploaded])

  return (
    <div>
        <div className="flex gap-2">
            <FileInput onChange={handleFileChange} />

            <button onClick={openFileDialog}>Upload file</button>
        
            {loading &&
              <div className="flex">
                <LoadingIcon />
                <div className="pt-8">
                  {files.map((file, index) => (
                    <div key={index}>
                      File #{index} progress: {file.progress}%
                    </div>
                  ))}
                </div>
              </div>
            }

            
            {uploadUrl && <CheckmarkIcon />}
        </div>
        {uploadUrl && <p>file uploaded to {uploadUrl}</p>}
      </div>
  );
}