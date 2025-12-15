import VendorsList from "../../components/supply-chain/lists/VindorsList";

const VendorsPage = () => {
  return (
    <div className="bg-background p-6 text-foreground">
      <main>
        <div>
          <VendorsList />
        </div>
      </main>
    </div>
  );
};

export default VendorsPage;
