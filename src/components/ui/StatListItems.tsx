import { formatCurrency } from "../../utils/helpper";

interface StatListItemProps {
  label?: string;
  value: number;
  currency?: string; // Optional currency symbol
  positiveColor?: string; // Tailwind class for positive numbers
  negativeColor?: string; // Tailwind class for negative numbers
  className?: string; // Optional extra classes for the container
  labelClassName?: string; // Optional classes for the label span
  valueClassName?: string; // Optional classes for the value span
}

const StatListItems = ({
  label = "",
  value,
  currency,
  positiveColor = "text-green-600",
  negativeColor = "text-red-600",
  className = "",
  labelClassName = "text-gray-600",
  valueClassName = "font-semibold",
}: StatListItemProps) => {
  const colorClass = value < 0 ? negativeColor : positiveColor;
  return (
    <div className={`flex justify-between items-center ${className}`.trim()}>
      <span className={labelClassName}>{label}</span>
      <span className={`${valueClassName} ${colorClass}`.trim()}>
        {currency ? formatCurrency(value, currency) : value}
      </span>
    </div>
  );
};

export default StatListItems;
