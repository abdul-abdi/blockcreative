"use client";

import { useState } from "react";

export default function Upload() {
  const [file, setFile] = useState<File>();
  const [url, setUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState("");

  const uploadFile = async () => {
    try {
      if (!file) {
        alert("No file selected");
        return;
      }

      setUploading(true);
      setUploadSuccess(false);
      setError("");
      
      const data = new FormData();
      data.set("file", file);
      
      console.log("Uploading file:", file.name);
      
      // Try with the correct API endpoint
      const uploadRequest = await fetch("/api/files", {
        method: "POST",
        body: data,
      });
      
      if (!uploadRequest.ok) {
        const errorText = await uploadRequest.text();
        console.error("Upload failed:", uploadRequest.status, errorText);
        throw new Error(`Upload failed: ${uploadRequest.status} ${errorText}`);
      }
      
      const response = await uploadRequest.json();
      console.log("Upload response:", response);
      
      // Handle different response formats
      const signedUrl = typeof response === 'string' ? response : response.url || response.signedUrl || '';
      
      setUrl(signedUrl);
      setUploadSuccess(true);
    } catch (e: any) {
      console.error("Upload error:", e);
      setError(e.message || "Trouble uploading file");
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target?.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setUrl("");
      setUploadSuccess(false);
      setError("");
      console.log("Selected file:", selectedFile.name, selectedFile.type, selectedFile.size);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Select File</label>
          <input 
            type="file" 
            onChange={handleChange} 
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
        
        <button 
          type="button" 
          disabled={uploading || !file} 
          onClick={uploadFile}
          className="w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 transition"
        >
          {uploading ? "Uploading..." : "Upload"}
        </button>
        
        {error && (
          <div className="mt-4 text-center text-red-600 font-medium">
            {error}
          </div>
        )}
        
        {uploadSuccess && (
          <div className="mt-4 text-center text-green-600 font-medium">
            Upload successful!
          </div>
        )}
        
        {url && (
          <div className="mt-4">
            <p className="text-sm font-medium mb-2">File URL:</p>
            <div className="border border-gray-200 rounded-md p-3 bg-white break-all">
              <a 
                href={url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {url}
              </a>
            </div>
            <div className="mt-3 flex justify-end">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(url);
                  alert("URL copied to clipboard!");
                }}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-1 px-2 rounded"
              >
                Copy URL
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}