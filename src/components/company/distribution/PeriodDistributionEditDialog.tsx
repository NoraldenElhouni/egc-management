import { useState } from "react";
import Dialog from "../../ui/Dialog";
import { Edit } from "lucide-react";
import { DistributionPeriod } from "../../../hooks/projects/useDistributionHistory";
import { formatCurrency } from "../../../utils/helpper";
import PeriodDistributionEditForm from "./PeriodDistributionEditForm";

interface Props {
  periods: DistributionPeriod[]; // cash + bank periods for this project/currency
  onSave?: () => void;
}

const PeriodDistributionEditDialog = ({ periods, onSave }: Props) => {
  const [open, setOpen] = useState(false);
  if (periods.length === 0) return null;

  const combinedTotal = periods.reduce((s, p) => s + Number(p.total_amount), 0);

  return (
    <div className="inline-block">
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-blue-600 hover:text-blue-800 border border-blue-200 hover:bg-blue-50 px-2 py-0.5 rounded flex items-center gap-1"
      >
        <Edit className="w-3.5 h-3.5" />
        تعديل
      </button>

      <Dialog isOpen={open} onClose={() => setOpen(false)}>
        <div className="flex flex-col max-h-[80vh]">
          <h2 className="text-lg font-bold shrink-0 pb-3 border-b border-gray-200">
            تعديل توزيع {periods[0].project.name} —{" "}
            {formatCurrency(combinedTotal, periods[0].currency ?? "LYD")}
          </h2>
          <div className="overflow-y-auto flex-1 py-3">
            <PeriodDistributionEditForm
              periods={periods}
              onSave={() => {
                setOpen(false);
                onSave?.();
              }}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default PeriodDistributionEditDialog;
