import React, { useState } from "react";
import NewContractForm from "../../../../components/operations/contracts/newContractForm";
import {
  useContractors,
  useServicesBySpecialization,
  useSpecializations,
} from "../../../../hooks/operations/contracts/useContracts";
import { useParams } from "react-router-dom";

const newContractProject = () => {
  const {
    error: specError,
    loading: specLoading,
    specializations,
  } = useSpecializations();
  const [selectSpec, setSelectSpec] = useState("");
  const [bidMode, setBidMode] = useState<"open" | "direct">("open");

  const {
    error: servError,
    loading: servLoading,
    services,
  } = useServicesBySpecialization(selectSpec);

  const { contractors, loading: contractorsLoading } = useContractors(
    bidMode === "direct", // 👈 only fetches when direct is selected
  );

  // get projectId from route params
  const { projectId } = useParams<{ projectId: string }>();

  return (
    <div className="p-4">
      <NewContractForm
        specializations={specializations}
        specLoading={specLoading}
        specError={specError}
        services={services}
        servLoading={servLoading}
        servError={servError}
        selectSpec={selectSpec}
        onSpecChange={setSelectSpec}
        projectId={projectId ?? ""}
        contractors={contractors}
        contractorsLoading={contractorsLoading}
        onBidModeChange={setBidMode}
      />
    </div>
  );
};

export default newContractProject;
