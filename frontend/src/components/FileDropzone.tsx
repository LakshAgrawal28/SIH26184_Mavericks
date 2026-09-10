"use client";

import { useCallback, useState } from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

type FileDropzoneProps = {
  file: File | null;
  onFileChange: (file: File | null) => void;
  accept?: string;
};

export default function FileDropzone({
  file,
  onFileChange,
  accept = ".zip",
}: FileDropzoneProps) {
  const [dragOver, setDragOver] = useState(false);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) onFileChange(dropped);
    },
    [onFileChange]
  );

  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 transition-colors duration-150",
        dragOver
          ? "border-indigo-400 bg-indigo-50"
          : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50"
      )}
    >
      <input
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
      />
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
        <Upload className="h-5 w-5" />
      </div>
      <p className="mt-3 text-sm font-medium text-zinc-900">
        {file ? file.name : "Drop your .zip archive here"}
      </p>
      <p className="mt-1 text-xs text-zinc-500">
        {file ? `${(file.size / 1024).toFixed(1)} KB` : "or click to browse"}
      </p>
    </label>
  );
}
