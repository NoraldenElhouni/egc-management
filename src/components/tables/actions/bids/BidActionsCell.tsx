import { useState } from "react";
import { RequestBids } from "../../../../types/contracts.type";
import { supabase } from "../../../../lib/supabaseClient";
import AcceptBidDialog from "../../../dialog/AcceptBidDialog";

interface BidActionsCellProps {
  bid: RequestBids;
  onRefresh?: () => void;
}

const BidActionsCell = ({ bid, onRefresh }: BidActionsCellProps) => {
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [declining, setDeclining] = useState(false);

  if (bid.status !== "pending") return null;

  async function handleDecline() {
    setDeclining(true);
    await supabase
      .from("contractor_bids")
      .update({ status: "rejected", reviewed_at: new Date().toISOString() })
      .eq("id", bid.id);
    setDeclining(false);
    onRefresh?.();
  }

  return (
    <>
      {showAcceptDialog && (
        <AcceptBidDialog
          bid={bid}
          onClose={() => setShowAcceptDialog(false)}
          onSuccess={() => {
            setShowAcceptDialog(false);
            onRefresh?.();
          }}
        />
      )}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => setShowAcceptDialog(true)}
          className="px-3 py-1.5 text-xs font-medium rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors"
        >
          قبول
        </button>
        {/* <Link to={`./${bid.id}/counter/new`}>
          <button className="px-3 py-1.5 text-xs font-medium rounded-md bg-red-50 text-yellow-600 border border-yellow-200 hover:bg-yellow-100 transition-colors">
            عرض مضاد
          </button>
        </Link> */}
        <button
          onClick={handleDecline}
          disabled={declining}
          className="px-3 py-1.5 text-xs font-medium rounded-md bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50"
        >
          {declining ? "..." : "رفض"}
        </button>
      </div>
    </>
  );
};

export default BidActionsCell;
