import React from "react";
import { Link } from "react-router-dom";
import Button from "../../../../../components/ui/Button";

const ContractRequestDetailsPage = () => {
  return (
    <div>
      <div>
        <Button>
          <Link to={"./bids"}>bids</Link>
        </Button>
      </div>
    </div>
  );
};

export default ContractRequestDetailsPage;
