import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const OrdersPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("./projects");
  }, [navigate]);

  return null;
};

export default OrdersPage;
