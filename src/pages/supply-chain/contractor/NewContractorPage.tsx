import { useState } from "react";
import NewContractorForm from "../../../components/supply-chain/form/NewContractorForm";
import MergeContractorsForm from "../../../components/supply-chain/form/MergeContractorsForm";

const NewContractorPage = () => {
  const [activeTab, setActiveTab] = useState("new-contractor");

  const tabs = [
    {
      id: "new-contractor",
      label: "اضافة مقاول جديد",
      content: <NewContractorForm />,
    },
    {
      id: "merge-contractor",
      label: "دمج المقاول",
      content: <MergeContractorsForm />,
    },
  ];
  return (
    <div className="bg-background min-h-screen">
      <div>
        {/* Tabs */}
        <div className="px-6 py-4 border-b bg-white">
          <ul className="flex gap-6 text-sm text-gray-600">
            {tabs.map((tab) => (
              <li key={tab.id}>
                <button
                  className={`pb-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-b-2 border-primary text-primary font-medium"
                      : "hover:text-gray-800"
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {tabs.find((tab) => tab.id === activeTab)?.content}
        </div>
      </div>
    </div>
  );
};

export default NewContractorPage;
