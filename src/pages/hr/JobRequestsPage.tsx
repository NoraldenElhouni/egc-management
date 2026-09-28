import JobRequestsList from "../../components/hr/jobRequests/JobRequestsList";

const JobRequestsPage = () => {
  return (
    <div className="bg-background p-6 text-foreground">
      <main>
        <div>
          <JobRequestsList />
        </div>
      </main>
    </div>
  );
};

export default JobRequestsPage;
