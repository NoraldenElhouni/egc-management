import {
  ExperienceScoresEditor,
  TierScoreEditor,
  UniversitiesEditor,
} from "../../../components/hr/settings/ScoringEditors";
import { useScoringConfig } from "../../../hooks/hr/useScoringConfig";

const ScoringSettingsPage = () => {
  const config = useScoringConfig();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-6 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            درجات المتقدمين
          </h1>
          <p className="text-xs text-gray-600 mt-0.5">
            الدرجات التي تُحتسب لكل متقدم: الجامعة والمعدل وسنوات الخبرة. درجات
            الاستبيان تُحدد من بنك الأسئلة. تُحفظ التعديلات عند مغادرة الحقل.
          </p>
        </div>

        {config.loading ? (
          <p className="text-sm text-gray-500">جاري التحميل...</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TierScoreEditor
                title="طبقات الجامعات"
                addPlaceholder="اسم طبقة جديدة"
                rows={config.universityTiers.map((t) => ({
                  id: t.id,
                  name: t.tier_name,
                  score: t.score,
                }))}
                onAdd={config.addUniversityTier}
                onEdit={(id, f) =>
                  config.editUniversityTier(id, {
                    tier_name: f.name,
                    score: f.score,
                  })
                }
              />
              <TierScoreEditor
                title="تقديرات المعدل"
                addPlaceholder="تقدير جديد"
                rows={config.gpaTiers.map((t) => ({
                  id: t.id,
                  name: t.label,
                  score: t.score,
                }))}
                onAdd={config.addGpaTier}
                onEdit={(id, f) =>
                  config.editGpaTier(id, { label: f.name, score: f.score })
                }
              />
            </div>

            <UniversitiesEditor
              universities={config.universities}
              tiers={config.universityTiers}
              onAdd={config.addUniversity}
              onEdit={config.editUniversity}
              onRemove={config.removeUniversity}
            />

            <ExperienceScoresEditor
              scores={config.experienceScores}
              onEdit={config.editExperienceScore}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default ScoringSettingsPage;
