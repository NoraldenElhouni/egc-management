import CriteriaListEditor from "../../../components/hr/settings/CriteriaListEditor";
import RatingScaleListEditor from "../../../components/hr/settings/RatingScaleListEditor";

const EvaluationSettingsPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-6 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            إعدادات التقييم
          </h1>
          <p className="text-xs text-gray-600 mt-0.5">
            إدارة بنود التقييم وسلم الدرجات لتقييم المقابلات وتقييم الأداء —
            اسحب الأسهم لإعادة الترتيب
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">
            تقييم المقابلة الشخصية
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CriteriaListEditor category="interview" title="بنود التقييم" />
            <RatingScaleListEditor category="interview" title="سلم التقييم" />
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">
            تقييم أداء الموظف
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CriteriaListEditor category="performance" title="بنود التقييم" />
            <RatingScaleListEditor category="performance" title="سلم التقييم" />
          </div>
        </section>
      </div>
    </div>
  );
};

export default EvaluationSettingsPage;
