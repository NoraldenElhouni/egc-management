import { useState } from "react";
import NewContractorForm from "../../../components/supply-chain/form/NewContractorForm";
import LinkContractorUserForm from "../../../components/supply-chain/form/LinkContractorUserForm";
import MergeContractorsWizard from "../../../components/supply-chain/contractor/merge/MergeContractorsWizard";

const NewContractorPage = () => {
  const [activeTab, setActiveTab] = useState("new-contractor");

  const tabs = [
    {
      id: "new-contractor",
      label: "اضافة مقاول جديد",
      content: <NewContractorForm />,
    },
    {
      id: "link-contractor",
      label: "ربط مقاول بحساب",
      content: <LinkContractorUserForm />,
    },
    {
      id: "merge-contractors",
      label: "دمج مقاولين",
      content: <MergeContractorsWizard />,
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
