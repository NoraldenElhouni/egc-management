interface InfoRowProps {
  label: string;
  value?: React.ReactNode;
  bordered?: boolean;
}

const InfoRow = ({ label, value, bordered = true }: InfoRowProps) => {
  return (
    <div
      className={`
        flex items-center justify-between py-2
        ${bordered ? "border-b border-gray-200" : ""}
      `}
    >
      <span className="text-gray-600 font-medium">{label}</span>

      <div className="text-gray-900 font-semibold text-sm">{value}</div>
    </div>
  );
};

export default InfoRow;
