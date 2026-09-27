import { useLocation } from "react-router-dom";
import NewEmployeeForm from "../../components/hr/form/NewEmployeeForm";
import type { UserFormValues } from "../../types/schema/users.schema";

interface NewEmployeeNavState {
  initialValues?: Partial<UserFormValues>;
  applicantId?: string;
}

const NewEmployeePage = () => {
  const location = useLocation();
  const state = (location.state ?? {}) as NewEmployeeNavState;

  return (
    <div className="p-4">
      <NewEmployeeForm
        initialValues={state.initialValues}
        applicantId={state.applicantId}
      />
    </div>
  );
};

export default NewEmployeePage;
