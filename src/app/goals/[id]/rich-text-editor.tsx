"use client";
import { Bold, Italic, List, ListOrdered, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import TextDirection from "tiptap-text-direction";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { cn } from "@/lib/utils";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableSizePicker } from "./table-size-picker";

type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
};

function ToolbarButton({
  onClick,
  active,
  variant = "default",
  children,
}: {
  onClick?: () => void;
  active: boolean;
  variant?: "default" | "danger";
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg px-3 py-1.5 text-xs font-bold transition",
        active
          ? "bg-accent text-ink"
          : variant === "danger"
            ? "text-red-400 hover:bg-red-500/10 hover:text-red-300"
            : "text-muted hover:bg-surface hover:text-text",
      )}
    >
      {children}
    </button>
  );
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "چی کار کردی؟",
  className,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextDirection.configure({
        types: ["heading", "paragraph"],
        defaultDirection: "rtl",
      }),
      Placeholder.configure({ placeholder }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-invert max-w-none min-h-[120px] p-3 text-sm text-text outline-none",
          className,
        ),
        dir: "rtl",
      },
    },
  });

  // state برای رندر مجدد وقتی selection تغییر می‌کند
  const [isInTable, setIsInTable] = useState(false);

  useEffect(() => {
    if (!editor) return;
    const update = () => {
      setIsInTable(editor.isActive("table"));
    };
    // ارزیابی اولیه
    update();
    // گوش دادن به تغییرات
    editor.on("selectionUpdate", update);
    editor.on("transaction", update);
    return () => {
      editor.off("selectionUpdate", update);
      editor.off("transaction", update);
    };
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-raised">
      {/* نوار ابزار */}
      <div className="flex flex-wrap gap-1 border-b border-line p-2">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
        >
          <Bold size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
        >
          <Italic size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
        >
          <List size={16} />{" "}
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
        >
          <ListOrdered size={16} />{" "}
        </ToolbarButton>

        <TableSizePicker
          onSelect={(rows, cols) => {
            editor
              .chain()
              .focus()
              .insertTable({ rows, cols, withHeaderRow: true })
              .run();
          }}
          active={isInTable}
        />

        {/* کنترل‌های جدول: فقط وقتی نشانگر داخل جدول است */}
        {isInTable && (
          <>
            <ToolbarButton
              onClick={() => editor.chain().focus().deleteTable().run()}
              active={false}
              variant="danger"
            >
              <Trash2 size={14} />{" "}
            </ToolbarButton>
          </>
        )}
      </div>

      {/* محتوای ادیتور */}
      <EditorContent editor={editor} />
    </div>
  );
}
