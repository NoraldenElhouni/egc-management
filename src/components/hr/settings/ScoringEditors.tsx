import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  experienceLevelLabel,
  type ExperienceLevelScore,
  type University,
  type UniversityTier,
} from "../../../types/hr.type";

const cardClass = "bg-white rounded-xl border border-gray-200 p-4 shadow-sm";
const inputClass =
  "rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-gray-400";
const addButtonClass =
  "inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-dark transition disabled:opacity-60";

type SaveResult = Promise<{ success: boolean }>;

/** A number input that saves on blur, only when the value actually changed. */
const ScoreInput = ({
  value,
  onSave,
}: {
  value: number;
  onSave: (score: number) => SaveResult;
}) => {
  const [draft, setDraft] = useState(String(value));
  return (
    <input
      type="number"
      step="any"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={async () => {
        const next = Number(draft);
        if (draft.trim() === "" || Number.isNaN(next)) return setDraft(String(value));
        if (next !== value) await onSave(next);
      }}
      title="الدرجة"
      className={`${inputClass} w-20`}
    />
  );
};

/** Text input that saves on blur, only when non-empty and changed. */
const NameInput = ({
  value,
  onSave,
}: {
  value: string;
  onSave: (name: string) => SaveResult;
}) => {
  const [draft, setDraft] = useState(value);
  return (
    <input
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={async () => {
        const next = draft.trim();
        if (!next) return setDraft(value);
        if (next !== value) await onSave(next);
      }}
      className={`${inputClass} flex-1`}
    />
  );
};

// ── generic "name + score" tier list (university tiers, GPA tiers) ────

interface TierRow {
  id: string;
  name: string;
  score: number;
}

interface TierScoreEditorProps {
  title: string;
  addPlaceholder: string;
  rows: TierRow[];
  onAdd: (name: string, score: number) => SaveResult;
  onEdit: (id: string, fields: { name?: string; score?: number }) => SaveResult;
}

export const TierScoreEditor: React.FC<TierScoreEditorProps> = ({
  title,
  addPlaceholder,
  rows,
  onAdd,
  onEdit,
}) => {
  const [name, setName] = useState("");
  const [score, setScore] = useState("0");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const result = await onAdd(name, Number(score) || 0);
    if (!result.success) return alert("فشل في الحفظ");
    setName("");
    setScore("0");
  };

  return (
    <div className={cardClass}>
      <h3 className="text-sm font-semibold text-gray-900 mb-3">{title}</h3>
      <ul className="space-y-2 mb-3">
        {rows.map((r) => (
          <li key={r.id} className="flex items-center gap-2">
            <NameInput value={r.name} onSave={(n) => onEdit(r.id, { name: n })} />
            <ScoreInput value={r.score} onSave={(s) => onEdit(r.id, { score: s })} />
          </li>
        ))}
      </ul>
      <form onSubmit={handleAdd} className="flex items-center gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={addPlaceholder}
          className={`${inputClass} flex-1`}
        />
        <input
          type="number"
          step="any"
          value={score}
          onChange={(e) => setScore(e.target.value)}
          title="الدرجة"
          className={`${inputClass} w-20`}
        />
        <button type="submit" disabled={!name.trim()} className={addButtonClass}>
          <Plus className="w-4 h-4" /> إضافة
        </button>
      </form>
    </div>
  );
};

// ── universities (name + tier) ───────────────────────────────────────

interface UniversitiesEditorProps {
  universities: University[];
  tiers: UniversityTier[];
  onAdd: (name: string, tierId: string | null) => SaveResult;
  onEdit: (
    id: string,
    fields: { name?: string; tier_id?: string | null },
  ) => SaveResult;
  onRemove: (id: string) => SaveResult;
}

export const UniversitiesEditor: React.FC<UniversitiesEditorProps> = ({
  universities,
  tiers,
  onAdd,
  onEdit,
  onRemove,
}) => {
  const [name, setName] = useState("");
  const [tierId, setTierId] = useState("");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const result = await onAdd(name, tierId || null);
    if (!result.success) return alert("فشل في الحفظ (قد يكون الاسم مكرراً)");
    setName("");
    setTierId("");
  };

  const tierSelect = (
    value: string,
    onChange: (v: string) => void,
    className = "",
  ) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${inputClass} ${className}`}
    >
      <option value="">بدون طبقة (0 درجة)</option>
      {tiers.map((t) => (
        <option key={t.id} value={t.id}>
          {t.tier_name} ({t.score})
        </option>
      ))}
    </select>
  );

  return (
    <div className={cardClass}>
      <h3 className="text-sm font-semibold text-gray-900 mb-3">
        الجامعات والمعاهد
      </h3>
      <ul className="space-y-2 mb-3 max-h-80 overflow-y-auto">
        {universities.map((u) => (
          <li key={u.id} className="flex items-center gap-2">
            <NameInput value={u.name} onSave={(n) => onEdit(u.id, { name: n })} />
            {tierSelect(u.tier_id ?? "", (v) =>
              onEdit(u.id, { tier_id: v || null }),
            )}
            <button
              type="button"
              onClick={() => confirm("حذف هذه الجامعة؟") && onRemove(u.id)}
              className="text-red-500 hover:text-red-600"
              title="حذف"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </li>
        ))}
        {universities.length === 0 && (
          <li className="text-sm text-gray-500">لا توجد جامعات بعد.</li>
        )}
      </ul>
      <form onSubmit={handleAdd} className="flex items-center gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="اسم جامعة جديدة"
          className={`${inputClass} flex-1`}
        />
        {tierSelect(tierId, setTierId)}
        <button type="submit" disabled={!name.trim()} className={addButtonClass}>
          <Plus className="w-4 h-4" /> إضافة
        </button>
      </form>
    </div>
  );
};

// ── experience levels (fixed levels, editable scores) ────────────────

export const ExperienceScoresEditor: React.FC<{
  scores: ExperienceLevelScore[];
  onEdit: (level: string, score: number) => SaveResult;
}> = ({ scores, onEdit }) => (
  <div className={cardClass}>
    <h3 className="text-sm font-semibold text-gray-900 mb-3">
      درجات سنوات الخبرة
    </h3>
    <ul className="space-y-2">
      {scores.map((s) => (
        <li key={s.level} className="flex items-center gap-2">
          <span className="flex-1 text-sm text-gray-800">
            {experienceLevelLabel(s.level)}
          </span>
          <ScoreInput value={s.score} onSave={(v) => onEdit(s.level, v)} />
        </li>
      ))}
    </ul>
  </div>
);
