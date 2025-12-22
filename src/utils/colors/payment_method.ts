import { PaymentMethod } from "../../types/global.type";

export const paymentMethodColor = (method: PaymentMethod) => {
  switch (method) {
    case "cash":
      return "bg-green-100 text-green-800";
    case "bank":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};
