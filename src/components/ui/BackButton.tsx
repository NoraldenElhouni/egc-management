import { ArrowLeft, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const BackButton = ({ side = "left" }: { side?: "left" | "right" }) => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(-1)}
      className="inline-flex  items-center gap-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-full p-1 transition-colors "
    >
      {side === "left" ? (
        <>
          <span className="hidden sm:inline">عودة</span>
          <ArrowLeft size={16} />
        </>
      ) : (
        <div className="p-2">
          <ArrowRight size={14} />
        </div>
      )}
    </button>
  );
};

export default BackButton;
