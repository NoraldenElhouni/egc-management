import ContractorsList from "../../components/supply-chain/lists/ContractorsList";
import VindorsList from "../../components/supply-chain/lists/VindorsList";

const SupplyChainPage = () => {
  return (
    <div className="bg-background p-6 text-foreground">
      <main className="space-y-4">
        <div>
          <ContractorsList />
        </div>
        <div>
          <VindorsList />
        </div>
      </main>
    </div>
  );
};
export default SupplyChainPage;
