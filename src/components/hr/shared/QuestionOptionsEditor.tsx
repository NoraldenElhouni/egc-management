import { useState } from "react";
import { Plus, Pencil, Check, X, Trash2 } from "lucide-react";

interface OptionRow {
  id: string;
  option_text: string;
}

interface QuestionOptionsEditorProps {
  options: OptionRow[];
  onAdd: (text: string) => Promise<void> | void;
  onUpdate: (id: string, text: string) => Promise<void> | void;
  onDelete: (id: string) => Promise<void> | void;
}

/** Storage-agnostic "list of choice options" editor, shared by the question
 * bank and job-request-question builders. */
const QuestionOptionsEditor: React.FC<QuestionOptionsEditorProps> = ({
  options,
  onAdd,
  onUpdate,
  onDelete,
}) => {
  const [newOption, setNewOption] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newOption.trim();
    if (!trimmed) return;
    await onAdd(trimmed);
    setNewOption("");
  };

  return (
    <div className="mt-2 pl-4 border-r-2 border-gray-100 space-y-1.5">
      {options.map((o) => (
        <div key={o.id} className="flex items-center gap-2">
          {editingId === o.id ? (
            <>
              <input
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="flex-1 rounded border border-gray-200 px-2 py-1 text-xs outline-none focus:border-gray-400"
                autoFocus
              />
              <button
                type="button"
                onClick={async () => {
                  if (editText.trim()) await onUpdate(o.id, editText.trim());
                  setEditingId(null);
                }}
                className="text-green-600 hover:text-green-700"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <>
              <span className="flex-1 text-xs text-gray-700">
                {o.option_text}
              </span>
              <button
                type="button"
                onClick={() => {
                  setEditingId(o.id);
                  setEditText(o.option_text);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(o.id)}
                className="text-red-500 hover:text-red-600"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      ))}

      <form onSubmit={handleAdd} className="flex items-center gap-2">
        <input
          value={newOption}
          onChange={(e) => setNewOption(e.target.value)}
          placeholder="إضافة خيار"
          className="flex-1 rounded border border-gray-200 px-2 py-1 text-xs outline-none focus:border-gray-400"
        />
        <button
          type="submit"
          disabled={!newOption.trim()}
          className="text-primary hover:text-primary-dark disabled:opacity-50"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};

export default QuestionOptionsEditor;
