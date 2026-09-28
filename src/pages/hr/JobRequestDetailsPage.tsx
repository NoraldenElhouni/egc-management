import { useParams } from "react-router-dom";
import JobRequestInfoCard from "../../components/hr/jobRequests/JobRequestInfoCard";
import JobRequestStatusControl from "../../components/hr/jobRequests/JobRequestStatusControl";
import JobRequestQuestionsBuilder from "../../components/hr/jobRequests/JobRequestQuestionsBuilder";
import { useJobRequest } from "../../hooks/hr/useJobRequest";

const JobRequestDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const jobRequestId = id || "";

  const { jobRequest, loading, error, refetch } = useJobRequest(jobRequestId);

  if (loading) return <div className="p-6">جاري التحميل...</div>;
  if (error || !jobRequest)
    return <div className="p-6">خطأ في تحميل بيانات طلب التوظيف.</div>;

  return (
    <div className="bg-background min-h-screen p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <JobRequestStatusControl
          jobRequestId={jobRequest.id}
          status={jobRequest.status}
          onUpdated={refetch}
        />
      </div>

      <JobRequestInfoCard jobRequest={jobRequest} />

      <JobRequestQuestionsBuilder
        jobRequestId={jobRequest.id}
        department={jobRequest.department}
      />
    </div>
  );
};

export default JobRequestDetailsPage;
