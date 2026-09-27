import ApplicantsList from "../../components/hr/applicants/ApplicantsList";

const ApplicantsPage = () => {
  return (
    <div className="bg-background p-6 text-foreground">
      <main>
        <div>
          <ApplicantsList />
        </div>
      </main>
    </div>
  );
};

export default ApplicantsPage;
