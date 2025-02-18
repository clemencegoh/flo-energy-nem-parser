'use client';

import { useState } from "react";
import { useS3Upload } from "next-s3-upload";
import { CheckmarkIcon, LoadingIcon } from "./icons/icons";
import { BaseProps } from "./interface";

type Props = {
  onUploaded?: (url: string, key: string) => void;
} & BaseProps;

export default function FileUploadComponent({ 
  onUploaded,
  classnames,
  ...props
}: Props) {
  const [uploadUrl, setUploadUrl] = useState<string>();
  const [loading, setLoading] = useState<boolean>(false);
  const { FileInput, openFileDialog, uploadToS3} = useS3Upload();

  // @ts-expect-error: file typing
  const handleFileChange = async (file) => {
    setLoading(true);
    const { url, key } = await uploadToS3(file);
    setUploadUrl(url);
    onUploaded?.(url, key);
    setLoading(false);
  };

  return (
    <div className={"flex items-center justify-center "} {...props}>
        <FileInput onChange={handleFileChange} />

        <button onClick={openFileDialog} className={classnames}>UPLOAD CSV</button>
    
        {loading &&  <LoadingIcon /> }
        {uploadUrl && <CheckmarkIcon classnames="mb-2" />}
    </div>
  );
}