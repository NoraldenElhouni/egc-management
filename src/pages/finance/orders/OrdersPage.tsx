import { ShoppingCart } from "lucide-react";
import ComingSoonPage from "../../../components/ui/ComingSoonPage";

const OrdersPage = () => {
  return (
    <div className="p-4">
      <ComingSoonPage icon={ShoppingCart} title="الطلبات" />
    </div>
  );
};

export default OrdersPage;
