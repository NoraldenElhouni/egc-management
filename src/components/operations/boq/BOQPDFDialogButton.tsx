import React, { useState } from "react";
import Button from "../../ui/Button";
import BOQPDFOptionsDialog from "./BOQPDFOptionsDialog";
import { useBOQPDFGenerate } from "../../../hooks/operations/boq/useBOQPDFGenerate";
import { BOQReportRequest } from "../../../hooks/operations/boq/boqPdfPayload";
import { ArticleFull } from "../../../hooks/operations/boq/types";
import { BOQType } from "../../../hooks/operations/boq/useTypes";
import { Zone } from "../../../hooks/operations/boq/useZones";
import { ProjectWithDetailsForBook } from "../../../types/projects.type";

type BOQPDFDialogButtonProps = {
  project: ProjectWithDetailsForBook;
  currentType: BOQType;
  articles: ArticleFull[];
  zones: Zone[];
};

const BOQPDFDialogButton: React.FC<BOQPDFDialogButtonProps> = ({
  project,
  currentType,
  articles,
  zones,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { generate, loading, error } = useBOQPDFGenerate();

  const handleConfirm = async (payload: BOQReportRequest) => {
    setIsOpen(false);
    await generate(payload);
  };

  return (
    <div>
      <Button
        variant="primary-light"
        onClick={() => setIsOpen(true)}
        disabled={loading}
      >
        {loading ? "جاري الانشاء..." : "طباعة تقرير"}
      </Button>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}

      <BOQPDFOptionsDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={handleConfirm}
        currentType={currentType}
        articles={articles}
        zones={zones}
        projectName={project.name}
      />
    </div>
  );
};

export default BOQPDFDialogButton;
