import { LucideIcon } from "lucide-react";

interface ComingSoonPageProps {
  icon: LucideIcon;
  title: string;
  description?: string;
}

const ComingSoonPage = ({ icon: Icon, title, description }: ComingSoonPageProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
      <div className="bg-gray-50 p-4 rounded-full mb-3">
        <Icon size={32} className="text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500">
        {description ?? "هذه الصفحة قيد الإنشاء وستكون متاحة قريباً."}
      </p>
    </div>
  );
};

export default ComingSoonPage;
