import { useState } from "react";
import Dialog from "../../ui/Dialog";
import { Edit } from "lucide-react";

const ProjectPercentageDetailsDialog = () => {
  const [open, setOpen] = useState<boolean>(false);

  return (
    <div>
      <button onClick={() => setOpen(true)} className="flex items-center gap-2">
        <Edit className="w-4 h-4 text-green-900" />
      </button>

      <Dialog isOpen={open} onClose={() => setOpen(false)}>
        <h2 className="text-lg font-bold">Hello</h2>
        <p className="mt-2 text-gray-600">This is a TypeScript dialog.</p>
      </Dialog>
    </div>
  );
};
export default ProjectPercentageDetailsDialog;
