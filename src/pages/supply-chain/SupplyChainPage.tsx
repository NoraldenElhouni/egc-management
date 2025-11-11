import { Link } from "react-router-dom";

const SupplyChainPage = () => {
  return (
    <div className="bg-background  text-foreground">
      <header className="flex items-center justify-between gap-4 mb-6"></header>
      <main>
        <h2 className="text-foreground">
          مرحبًا بك في صفحة إدارة سلسلة التوريد
        </h2>
        <div className="flex flex-col w-fit space-y-2">
          <Link to="/supply-chain/contractors">إدارة الطلبات</Link>
          <Link to="/supply-chain/vendors">إدارة الموردين</Link>
        </div>
      </main>
    </div>
  );
};
export default SupplyChainPage;
