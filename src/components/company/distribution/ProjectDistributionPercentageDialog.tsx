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
    onSave?: () => void;   // ← add

}

const ProjectDistributionPercentageDialog = ({ project, open: controlledOpen, onOpenChange ,onSave}: Props) => {
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
        <button onClick={() => setOpen(true)} className="flex items-center gap-2">
          <Edit className="w-4 h-4 text-green-900" />
        </button>
      )}

      <Dialog isOpen={open} onClose={() => setOpen(false)}>
        <h2 className="text-lg font-bold">
          {project.serial_number} - {project.name}
        </h2>
        <EmployeeDistributionEditForm
          project={project}
          onSave={() => {        // ← add
            setOpen(false);
            onSave?.();
          }}
        />
      </Dialog>
    </div>
  );
};

export default ProjectDistributionPercentageDialog;