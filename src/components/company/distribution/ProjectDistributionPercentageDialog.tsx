import { useState } from "react";
import Dialog from "../../ui/Dialog";
import { Edit } from "lucide-react";
import { DistributionProject } from "../../../hooks/projects/useProjectsDistribute";
import EmployeeDistributionEditForm from "./EmployeeDistributionEditForm";

interface Props {
  project: DistributionProject;
}
const ProjectDistributionPercentageDialog = ({ project }: Props) => {
  const [open, setOpen] = useState<boolean>(false);

  return (
    <div>
      <button onClick={() => setOpen(true)} className="flex items-center gap-2">
        <Edit className="w-4 h-4 text-green-900" />
      </button>

      <Dialog isOpen={open} onClose={() => setOpen(false)}>
        <h2 className="text-lg font-bold">
          {project.serial_number} - {project.name}
        </h2>
        <EmployeeDistributionEditForm project={project} />
      </Dialog>
    </div>
  );
};
export default ProjectDistributionPercentageDialog;
