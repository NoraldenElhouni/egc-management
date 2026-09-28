import type { JobRequestQuestionWithOptions } from "../../../types/hr.type";

export interface DynamicAnswerValue {
  answerText?: string;
  selectedOptionIds?: string[];
}

interface DynamicQuestionFieldProps {
  question: JobRequestQuestionWithOptions;
  value: DynamicAnswerValue;
  onChange: (value: DynamicAnswerValue) => void;
}

const inputClass =
  "border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary w-full";

const DynamicQuestionField: React.FC<DynamicQuestionFieldProps> = ({
  question,
  value,
  onChange,
}) => {
  const config = (question.config ?? {}) as { min?: number; max?: number };

  const renderInput = () => {
    switch (question.question_type) {
      case "textarea":
        return (
          <textarea
            className={inputClass}
            rows={3}
            value={value.answerText ?? ""}
            onChange={(e) => onChange({ answerText: e.target.value })}
          />
        );

      case "number":
        return (
          <input
            type="number"
            className={inputClass}
            value={value.answerText ?? ""}
            onChange={(e) => onChange({ answerText: e.target.value })}
          />
        );

      case "yes_no":
        return (
          <div className="flex gap-2">
            {[
              { value: "yes", label: "نعم" },
              { value: "no", label: "لا" },
            ].map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => onChange({ answerText: o.value })}
                className={`px-4 py-1.5 rounded-full text-sm border transition ${
                  value.answerText === o.value
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-foreground border-gray-300 hover:bg-gray-50"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        );

      case "rating": {
        const min = config.min ?? 1;
        const max = config.max ?? 5;
        const levels = Array.from({ length: max - min + 1 }, (_, i) => min + i);
        return (
          <div className="flex gap-2 flex-wrap">
            {levels.map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => onChange({ answerText: String(level) })}
                className={`w-9 h-9 rounded-full text-sm border transition ${
                  value.answerText === String(level)
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-foreground border-gray-300 hover:bg-gray-50"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        );
      }

      case "single_choice":
        return (
          <div className="flex flex-col gap-2">
            {question.job_request_question_options.map((option) => (
              <label
                key={option.id}
                className="flex items-center gap-2 text-sm"
              >
                <input
                  type="radio"
                  name={question.id}
                  checked={value.selectedOptionIds?.[0] === option.id}
                  onChange={() => onChange({ selectedOptionIds: [option.id] })}
                />
                {option.option_text}
              </label>
            ))}
          </div>
        );

      case "multi_choice":
      case "checkbox":
        return (
          <div className="flex flex-col gap-2">
            {question.job_request_question_options.map((option) => {
              const checked = value.selectedOptionIds?.includes(option.id) ?? false;
              return (
                <label
                  key={option.id}
                  className="flex items-center gap-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      const current = value.selectedOptionIds ?? [];
                      onChange({
                        selectedOptionIds: e.target.checked
                          ? [...current, option.id]
                          : current.filter((id) => id !== option.id),
                      });
                    }}
                  />
                  {option.option_text}
                </label>
              );
            })}
          </div>
        );

      case "text":
      default:
        return (
          <input
            type="text"
            className={inputClass}
            value={value.answerText ?? ""}
            onChange={(e) => onChange({ answerText: e.target.value })}
          />
        );
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm text-foreground">
        {question.question_text}
        {question.is_required && <span className="text-error"> *</span>}
      </label>
      {renderInput()}
    </div>
  );
};

export default DynamicQuestionField;
