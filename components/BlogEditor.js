import { useEffect, useRef, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import DOMPurify from "isomorphic-dompurify";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

const HTML_REGEX = /<[a-z][\s\S]*>/i;

const ALLOWED_TAGS = [
  "p", "br", "h1", "h2", "h3", "h4", "h5", "h6",
  "b", "strong", "i", "em", "u", "s", "strike",
  "ul", "ol", "li", "a", "blockquote", "pre", "code",
  "table", "thead", "tbody", "tr", "th", "td", "img",
];

const formats = [
  "header", "bold", "italic", "underline", "strike",
  "list", "bullet", "indent", "link", "image", "video",
  "color", "background", "align", "blockquote", "code-block",
];

export function sanitizeHtml(html) {
  if (!html) return "";
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ["href", "src", "alt", "title"],
    FORBID_TAGS: ["script", "iframe", "object", "embed", "form", "input", "style"],
    FORBID_ATTR: ["onclick", "onerror", "onload", "onmouseover", "onfocus", "onblur"],
  });
}

export function htmlToPlainText(html) {
  if (!html) return "";
  const clean = sanitizeHtml(html);
  const div = typeof document !== "undefined"
    ? document.createElement("div")
    : { innerHTML: "", textContent: "" };
  div.innerHTML = clean;
  return (div.textContent || div.innerText || "").replace(/\s+/g, " ").trim();
}

export function isHtmlContent(text) {
  return HTML_REGEX.test(text);
}

export function unescapeHtmlEntities(str) {
  if (!str) return "";
  return str
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

const ESCAPED_TAG = /&lt;\/?[a-z][a-z0-9]*[^&]*&gt;/i;

export function hasEscapedHtml(text) {
  return ESCAPED_TAG.test(text);
}

export function cleanContentForDisplay(content) {
  if (!content) return "";
  if (hasEscapedHtml(content)) {
    const unescaped = unescapeHtmlEntities(content);
    return sanitizeHtml(unescaped);
  }
  return content;
}

export function processContent(raw) {
  if (!raw) return { content_html: "", content_text: "" };
  let html = raw;
  if (hasEscapedHtml(html)) {
    html = unescapeHtmlEntities(html);
  }
  if (isHtmlContent(html)) {
    const content_html = sanitizeHtml(html);
    const content_text = htmlToPlainText(content_html);
    return { content_html, content_text };
  }
  return { content_html: html, content_text: html.replace(/<[^>]*>/g, "").trim() };
}

function cleanWordPaste(html) {
  if (!html) return "";
  const sanitized = sanitizeHtml(html);
  if (typeof document === "undefined") return sanitized;
  const tmp = document.createElement("div");
  tmp.innerHTML = sanitized;
  tmp.querySelectorAll('*').forEach(el => {
    el.removeAttribute('class');
    el.removeAttribute('style');
    Array.from(el.attributes).forEach(attr => {
      if (attr.name.startsWith('data-') || attr.name.startsWith('mso')) {
        el.removeAttribute(attr.name);
      }
    });
  });
  return tmp.innerHTML;
}

export default function BlogEditor({ value, onChange, placeholder }) {
  const quillRef = useRef(null);

  const modules = useMemo(() => ({
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
    clipboard: { matchVisual: false },
  }), []);

  const handlePaste = useCallback((e) => {
    const clip = e.clipboardData || window.clipboardData;
    if (!clip) return;

    const html = clip.getData("text/html");
    const plainText = clip.getData("text/plain");

    // Case 1: Clipboard has HTML data (copy from browser/word)
    if (html && html.trim()) {
      e.preventDefault();
      e.stopPropagation();
      const cleanHtml = cleanWordPaste(html);
      if (quillRef.current) {
        const editor = quillRef.current.getEditor();
        if (editor) {
          const range = editor.getSelection(true);
          editor.clipboard.dangerouslyPasteHTML(range?.index || 0, cleanHtml, "user");
        }
      }
      return;
    }

    // Case 2: Plain text that contains HTML tags (pasted from text editor/notepad)
    if (plainText && HTML_REGEX.test(plainText)) {
      e.preventDefault();
      e.stopPropagation();
      const cleanHtml = cleanWordPaste(plainText);
      if (quillRef.current) {
        const editor = quillRef.current.getEditor();
        if (editor) {
          const range = editor.getSelection(true);
          editor.clipboard.dangerouslyPasteHTML(range?.index || 0, cleanHtml, "user");
        }
      }
      return;
    }

    // Case 3: Regular plain text - let Quill handle it normally
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      const el = document.querySelector('.blog-editor .ql-editor');
      if (el) {
        el.addEventListener('paste', handlePaste, true);
        return () => el.removeEventListener('paste', handlePaste, true);
      }
    }, 500);
    return () => clearTimeout(timer);
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
        .blog-editor .ql-container { min-height: 300px; font-size: 16px; }
        .blog-editor .ql-editor { min-height: 300px; color: #000; background-color: #fff; }
        .blog-editor .ql-editor pre.ql-syntax {
          background-color: #1e1e1e; color: #d4d4d4; padding: 16px;
          border-radius: 8px; overflow-x: auto;
          font-family: 'Fira Code', 'Monaco', 'Consolas', monospace;
          font-size: 14px; line-height: 1.5; white-space: pre-wrap; word-wrap: break-word;
        }
        .blog-editor .ql-editor code {
          background-color: #f0f0f0; padding: 2px 6px; border-radius: 4px;
          font-family: 'Fira Code', 'Monaco', 'Consolas', monospace; font-size: 0.9em;
        }
        .blog-editor .ql-snow .ql-picker.ql-header .ql-picker-label[data-value="1"]::before,
        .blog-editor .ql-snow .ql-picker.ql-header .ql-picker-item[data-value="1"]::before { content: 'Heading 1'; }
        .blog-editor .ql-snow .ql-picker.ql-header .ql-picker-label[data-value="2"]::before,
        .blog-editor .ql-snow .ql-picker.ql-header .ql-picker-item[data-value="2"]::before { content: 'Heading 2'; }
        .blog-editor .ql-snow .ql-picker.ql-header .ql-picker-label[data-value="3"]::before,
        .blog-editor .ql-snow .ql-picker.ql-header .ql-picker-item[data-value="3"]::before { content: 'Heading 3'; }
      `}</style>
    </div>
  );
}
