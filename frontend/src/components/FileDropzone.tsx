"use client";

import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { IconArchiveUpload } from "@/components/icons/NavIcons";

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
        "flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-6 py-12 transition-all duration-200",
        dragOver
          ? "border-primary/50 bg-accent-soft shadow-sm"
          : "border-border bg-card hover:border-primary/25 hover:bg-surface hover:shadow-sm"
      )}
    >
      <input
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
      />
      <IconArchiveUpload className="text-[#1B4B8C]" />
      <p className="mt-3 text-sm font-medium text-foreground">
        {file ? file.name : "Drop your .zip archive here"}
      </p>
      <p className="mt-1 font-mono text-xs text-ink-muted">
        {file ? `${(file.size / 1024).toFixed(1)} KB` : "or click to browse"}
      </p>
    </label>
  );
}
