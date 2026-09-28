import QuestionBankEditor from "../../../components/hr/settings/QuestionBankEditor";

const QuestionBankPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-6 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">بنك الأسئلة</h1>
          <p className="text-xs text-gray-600 mt-0.5">
            مكتبة أسئلة قابلة لإعادة الاستخدام، تُنسخ إلى استبيان أي طلب
            توظيف ثم تُعدّل بحرية — بدون التأثير على البنك المشترك
          </p>
        </div>

        <QuestionBankEditor />
      </div>
    </div>
  );
};

export default QuestionBankPage;
