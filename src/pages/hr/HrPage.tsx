import EmployeesList from "../../components/hr/list/EmployeesList";

const HrPage = () => {
  return (
    <div className="bg-background p-6 text-foreground">
      <main>
        <div>
          <EmployeesList />
        </div>
      </main>
    </div>
  );
};

export default HrPage;
