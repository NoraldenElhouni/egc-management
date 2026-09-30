import type { Json } from "../../../lib/supabase";
import type { QuestionType } from "../../../types/hr.type";

export interface QuestionScoringValue {
  weight: string;
  yesScore: string;
  noScore: string;
  scorePerPoint: string;
}

export const DEFAULT_SCORING_VALUE: QuestionScoringValue = {
  weight: "1",
  yesScore: "5",
  noScore: "0",
  scorePerPoint: "1",
};

/** Builds the `config` jsonb the DB scoring trigger reads for yes/no and rating questions. */
export const buildScoringConfig = (
  type: QuestionType,
  value: QuestionScoringValue,
): Json => {
  if (type === "yes_no") {
    return {
      yes_score: Number(value.yesScore) || 0,
      no_score: Number(value.noScore) || 0,
    };
  }
  if (type === "rating") {
    return { min: 1, max: 5, score_per_point: Number(value.scorePerPoint) || 0 };
  }
  return {};
};

interface QuestionScoringFieldsProps {
  type: QuestionType;
  value: QuestionScoringValue;
  onChange: (value: QuestionScoringValue) => void;
}

const numberClass =
  "w-20 rounded border border-gray-200 px-2 py-1 text-xs outline-none focus:border-gray-400";

const QuestionScoringFields: React.FC<QuestionScoringFieldsProps> = ({
  type,
  value,
  onChange,
}) => {
  const set = (patch: Partial<QuestionScoringValue>) =>
    onChange({ ...value, ...patch });

  return (
    <div className="flex items-center gap-4 flex-wrap text-xs text-gray-700">
      <label className="flex items-center gap-1.5">
        الوزن
        <input
          type="number"
          min={0}
          step="any"
          value={value.weight}
          onChange={(e) => set({ weight: e.target.value })}
          className={numberClass}
        />
      </label>

      {type === "yes_no" && (
        <>
          <label className="flex items-center gap-1.5">
            درجة "نعم"
            <input
              type="number"
              step="any"
              value={value.yesScore}
              onChange={(e) => set({ yesScore: e.target.value })}
              className={numberClass}
            />
          </label>
          <label className="flex items-center gap-1.5">
            درجة "لا"
            <input
              type="number"
              step="any"
              value={value.noScore}
              onChange={(e) => set({ noScore: e.target.value })}
              className={numberClass}
            />
          </label>
        </>
      )}

      {type === "rating" && (
        <label className="flex items-center gap-1.5">
          الدرجة لكل نقطة
          <input
            type="number"
            step="any"
            value={value.scorePerPoint}
            onChange={(e) => set({ scorePerPoint: e.target.value })}
            className={numberClass}
          />
        </label>
      )}
    </div>
  );
};

export default QuestionScoringFields;
