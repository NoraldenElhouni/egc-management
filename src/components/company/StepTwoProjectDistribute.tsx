import { DistributionProject } from "../../types/projects.type";

type Props = {
  projects: DistributionProject[] | null;
};

const StepTwoProjectDistribute = ({ projects }: Props) => {
  return (
    <div className="max-w-4xl mx-auto mt-4 rounded-md border bg-white p-4">
      <h2 className="text-lg font-bold mb-2">مراجعة البيانات</h2>
      <p className="text-sm text-gray-600 mb-4">
        راجع البيانات قبل التأكيد. (هنا تقدر تعرض ملخص أو تحذيرات)
      </p>

      <div className="text-sm">
        عدد المشاريع:{" "}
        <span className="font-semibold">{projects?.length ?? 0}</span>
      </div>
    </div>
  );
};

export default StepTwoProjectDistribute;
