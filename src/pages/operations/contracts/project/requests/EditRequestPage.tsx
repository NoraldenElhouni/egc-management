import { useState } from "react";
import { useParams } from "react-router-dom";
import {
  useContractors,
  useServicesBySpecialization,
  useSpecializations,
} from "../../../../../hooks/operations/contracts/useContracts";
import { useRequest } from "../../../../../hooks/operations/contracts/requests/useRequests";
import EditWorkRequestForm from "../../../../../components/operations/contracts/request/EditWorkRequestForm";

const EditRequestPage = () => {
  const { requestId } = useParams<{ requestId: string }>();

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
    bidMode === "direct",
  );

  // Fetch the existing request to pre-populate the form
  const {
    request: existingRequest,
    loading: requestLoading,
    error: requestError,
  } = useRequest(requestId ?? "");

  if (requestLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-gray-400 text-sm">جاري تحميل البيانات...</p>
      </div>
    );
  }

  if (requestError || !existingRequest) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-red-500 text-sm">
          {requestError?.message ?? "لم يتم العثور على الطلب"}
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <EditWorkRequestForm
        specializations={specializations}
        specLoading={specLoading}
        specError={specError}
        services={services}
        servLoading={servLoading}
        servError={servError}
        selectSpec={selectSpec}
        onSpecChange={setSelectSpec}
        requestId={requestId ?? ""}
        existingRequest={existingRequest}
        contractors={contractors}
        contractorsLoading={contractorsLoading}
        onBidModeChange={setBidMode}
      />
    </div>
  );
};

export default EditRequestPage;
