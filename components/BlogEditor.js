import { useState } from "react";
import dynamic from "next/dynamic";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ indent: "-1" }, { indent: "+1" }],
    ["link", "image", "video"],
    [{ color: [] }, { background: [] }],
    [{ align: [] }],
    ["blockquote", "code-block"],
    ["clean"],
  ],
};

const formats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "list",
  "bullet",
  "indent",
  "link",
  "image",
  "video",
  "color",
  "background",
  "align",
  "blockquote",
  "code-block",
];

export default function BlogEditor({ value, onChange, placeholder }) {
  return (
    <div className="blog-editor">
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder || "Write your blog content here..."}
        className="bg-white rounded-lg"
      />
      <style jsx global>{`
        .blog-editor .ql-container {
          min-height: 300px;
          font-size: 16px;
        }
        .blog-editor .ql-editor {
          min-height: 300px;
        }
        .blog-editor .ql-editor pre.ql-syntax {
          background-color: #1e1e1e;
          color: #d4d4d4;
          padding: 16px;
          border-radius: 8px;
          overflow-x: auto;
          font-family: 'Fira Code', 'Monaco', 'Consolas', monospace;
          font-size: 14px;
          line-height: 1.5;
          white-space: pre-wrap;
          word-wrap: break-word;
        }
        .blog-editor .ql-editor code {
          background-color: #f0f0f0;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'Fira Code', 'Monaco', 'Consolas', monospace;
          font-size: 0.9em;
        }
        .blog-editor .ql-snow .ql-picker.ql-header .ql-picker-label[data-value="1"]::before,
        .blog-editor .ql-snow .ql-picker.ql-header .ql-picker-item[data-value="1"]::before {
          content: 'Heading 1';
        }
        .blog-editor .ql-snow .ql-picker.ql-header .ql-picker-label[data-value="2"]::before,
        .blog-editor .ql-snow .ql-picker.ql-header .ql-picker-item[data-value="2"]::before {
          content: 'Heading 2';
        }
        .blog-editor .ql-snow .ql-picker.ql-header .ql-picker-label[data-value="3"]::before,
        .blog-editor .ql-snow .ql-picker.ql-header .ql-picker-item[data-value="3"]::before {
          content: 'Heading 3';
        }
      `}</style>
    </div>
  );
}
