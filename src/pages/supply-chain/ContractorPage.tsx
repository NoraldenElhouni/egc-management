import ContractorsList from "../../components/supply-chain/lists/ContractorsList";

const ContractorPage = () => {
  return (
    <div className="bg-background p-6 text-foreground">
      <main>
        <div>
          <ContractorsList />
        </div>
      </main>
    </div>
  );
};

export default ContractorPage;
