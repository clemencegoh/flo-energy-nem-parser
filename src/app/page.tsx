'use client';

import FileUploadComponent from "@/components/FileUpload";

export default function Home() {
  const onUpload = (filename: string) => {
    fetch('/api/s3-upload', {
      method: 'POST',
      body: JSON.stringify({
        filename: filename,
      })
    })
  }
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <FileUploadComponent onUploaded={onUpload} />
    </div>
  );
}
