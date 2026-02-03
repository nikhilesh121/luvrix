import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import DOMPurify from "isomorphic-dompurify";

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
  clipboard: {
    matchVisual: false,
  },
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

/**
 * Sanitize and convert HTML/Word paste content to clean text
 * Handles: HTML tags, Word formatting, Google Docs paste
 * Security: Removes scripts, iframes, event handlers (XSS protection)
 */
const sanitizePastedContent = (html) => {
  if (!html) return "";

  // First, sanitize with DOMPurify to remove XSS vectors
  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["p", "br", "h1", "h2", "h3", "h4", "h5", "h6", "b", "strong", "i", "em", "u", "s", "strike", "ul", "ol", "li", "a", "blockquote", "pre", "code"],
    ALLOWED_ATTR: ["href"],
    FORBID_TAGS: ["script", "iframe", "object", "embed", "form", "input", "style"],
    FORBID_ATTR: ["onclick", "onerror", "onload", "onmouseover", "onfocus", "onblur"],
  });

  // Create a temporary DOM element to parse HTML
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = sanitized;

  // Remove Word-specific junk (mso-*, MsoNormal, etc.)
  const wordJunkSelectors = [
    '[class*="Mso"]',
    '[style*="mso-"]',
    'o\\:p',
    'style',
  ];
  wordJunkSelectors.forEach(selector => {
    try {
      tempDiv.querySelectorAll(selector).forEach(el => {
        if (el.tagName.toLowerCase() === 'style') {
          el.remove();
        } else {
          // Keep content but remove Word classes
          el.removeAttribute('class');
          el.removeAttribute('style');
        }
      });
    } catch (e) {
      // Selector might be invalid, skip
    }
  });

  // Clean all remaining elements of Word styles
  tempDiv.querySelectorAll('*').forEach(el => {
    el.removeAttribute('class');
    el.removeAttribute('style');
    // Remove Word-specific attributes
    Array.from(el.attributes).forEach(attr => {
      if (attr.name.startsWith('data-') || attr.name.startsWith('mso')) {
        el.removeAttribute(attr.name);
      }
    });
  });

  return tempDiv.innerHTML;
};

export default function BlogEditor({ value, onChange, placeholder }) {
  const quillRef = useRef(null);

  // Handle paste events for HTML/Word content sanitization
  const handlePaste = useCallback((e) => {
    const clipboardData = e.clipboardData || window.clipboardData;
    if (!clipboardData) return;

    const html = clipboardData.getData("text/html");
    const plainText = clipboardData.getData("text/plain");

    // If there's HTML content, sanitize it
    if (html && html.trim()) {
      e.preventDefault();
      e.stopPropagation();

      const cleanHtml = sanitizePastedContent(html);
      
      // Get Quill instance and insert sanitized content
      if (quillRef.current) {
        const editor = quillRef.current.getEditor();
        if (editor) {
          const range = editor.getSelection(true);
          editor.clipboard.dangerouslyPasteHTML(range?.index || 0, cleanHtml, "user");
        }
      }
    }
    // Plain text paste is handled normally by Quill
  }, []);

  // Attach paste handler to editor
  useEffect(() => {
    const editorContainer = document.querySelector('.blog-editor .ql-editor');
    if (editorContainer) {
      editorContainer.addEventListener('paste', handlePaste, true);
      return () => {
        editorContainer.removeEventListener('paste', handlePaste, true);
      };
    }
  }, [handlePaste]);

  return (
    <div className="blog-editor">
      <ReactQuill
        ref={quillRef}
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
