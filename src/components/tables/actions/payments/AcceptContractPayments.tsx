import Button from "../../../ui/Button";

interface AcceptContractPaymentsProps {
  contractPaymentId: string;
}

const AcceptContractPayments = ({
  contractPaymentId,
}: AcceptContractPaymentsProps) => {
  return (
    <Button
      type="button"
      variant="success"
      size="xs"
      onClick={() => console.log("accept payment", contractPaymentId)}
    >
      قبول الدفع
    </Button>
  );
};

export default AcceptContractPayments;
