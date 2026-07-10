import React, { useRef, useState } from "react";
import { Upload, FileText, X } from "lucide-react";

interface CasUploadFieldProps {
  label: string;
  subtext: string;
  file: File | null;
  onChange: (file: File | null) => void;
  error?: string;
}

export const CasUploadField: React.FC<CasUploadFieldProps> = ({
  label,
  subtext,
  file,
  onChange,
  error,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleFileSelection = (selectedFile: File) => {
    if (selectedFile.type !== "application/pdf") {
      alert("Only PDF files are allowed for CAS statements.");
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      alert("File size exceeds the 10 MB limit.");
      return;
    }
    onChange(selectedFile);
  };

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full">
      <label className="block text-[14px] font-medium text-gray-700 mb-2">
        {label}
      </label>
      
      <div
        className={`relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : error
            ? "border-red-300 bg-red-50"
            : file
            ? "border-green-300 bg-green-50"
            : "border-gray-300 bg-gray-50 hover:bg-gray-100"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          accept="application/pdf"
          ref={fileInputRef}
          onChange={handleFileInput}
          className="hidden"
        />

        {!file ? (
          <div className="flex flex-col items-center text-center">
            <Upload className="h-8 w-8 text-gray-400 mb-3" />
            <span className="text-[15px] font-medium text-gray-900">
              Upload your CAS statement
            </span>
            <span className="mt-1 text-[13px] text-gray-500">
              {subtext}
            </span>
          </div>
        ) : (
          <div className="flex w-full items-center justify-between rounded-md bg-white p-3 shadow-sm border border-green-200">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="truncate text-[14px] font-medium text-gray-900">
                  {file.name}
                </span>
                <span className="text-[12px] text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={removeFile}
              className="ml-4 flex-shrink-0 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
      
      {error && <p className="mt-2 text-[13px] text-red-500">{error}</p>}

      {/* Helper Box */}
      <div className="mt-4 rounded-md bg-blue-50 p-4 border border-blue-100">
        <h4 className="text-[13px] font-semibold text-blue-800 mb-1">
          How to get your CAS
        </h4>
        <p className="text-[13px] text-blue-700 leading-relaxed">
          Visit camsonline.com or kfintech.com → Request CAS → Enter PAN → Download PDF. Takes 2 minutes.
        </p>
      </div>
      
      {/* Alternative option */}
      <p className="mt-4 text-center text-[13px] text-gray-500">
        or email it to{" "}
        <a href="mailto:contact@moneynowwealth.com" className="text-primary hover:underline font-medium">
          contact@moneynowwealth.com
        </a>
      </p>
    </div>
  );
};
