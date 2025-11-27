import Button from "../../../ui/Button";

interface DeleteContractPaymentsProps {
  contractPaymentId: string;
}

const DeleteContractPayments = ({
  contractPaymentId,
}: DeleteContractPaymentsProps) => {
  return (
    <Button
      type="button"
      variant="error"
      size="xs"
      onClick={() => console.log("delete", contractPaymentId)}
    >
      حذف
    </Button>
  );
};

export default DeleteContractPayments;
