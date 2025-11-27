import Button from "../../../ui/Button";

interface EditContractPaymentsProps {
  contractPaymentId: string;
}

const EditContractPayments = ({
  contractPaymentId,
}: EditContractPaymentsProps) => {
  return (
    <Button
      type="button"
      variant="primary-light"
      size="xs"
      onClick={() => console.log("edit", contractPaymentId)}
    >
      تعديل
    </Button>
  );
};

export default EditContractPayments;
