import { useState } from "react";
import Dialog from "../../ui/Dialog";
import { Edit } from "lucide-react";
import { DistributionProject } from "../../../hooks/projects/useProjectsDistribute";
import EmployeeDistributionEditForm from "./EmployeeDistributionEditForm";

interface Props {
  project: DistributionProject;
  // Optional controlled mode — used by StepThree to open the dialog externally
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSave?: () => void; // ← add
}

const ProjectDistributionPercentageDialog = ({
  project,
  open: controlledOpen,
  onOpenChange,
  onSave,
}: Props) => {
  const [internalOpen, setInternalOpen] = useState(false);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const setOpen = (value: boolean) => {
    if (isControlled) {
      onOpenChange?.(value);
    } else {
      setInternalOpen(value);
    }
  };

  return (
    <div>
      {!isControlled && (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2"
        >
          <Edit className="w-4 h-4 text-green-900" />
        </button>
      )}

      <Dialog isOpen={open} onClose={() => setOpen(false)}>
        <div className="flex flex-col max-h-[80vh]">
          {/* Fixed header */}
          <h2 className="text-lg font-bold shrink-0 pb-3 border-b border-gray-200">
            {project.serial_number} - {project.name}
          </h2>

          {/* Scrollable body */}
          <div className="overflow-y-auto flex-1 py-3">
            <EmployeeDistributionEditForm
              project={project}
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

export default ProjectDistributionPercentageDialog;
