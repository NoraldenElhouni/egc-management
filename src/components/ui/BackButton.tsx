import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const BackButton = () => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(-1)}
      className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800"
    >
      <span className="hidden sm:inline">عودة</span>
      <ArrowLeft size={16} />
    </button>
  );
};

export default BackButton;
