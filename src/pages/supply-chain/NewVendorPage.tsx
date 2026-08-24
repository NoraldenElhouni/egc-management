import { useState } from "react";
import NewVendorForm from "../../components/supply-chain/form/NewVendorForm";
import MergeVendorsForm from "../../components/supply-chain/form/MergeVendorsForm";
import MergeVendorsWizard from "../../components/supply-chain/vendor/merge/MergeVendorsWizard";

const NewVendorPage = () => {
  const [activeTab, setActiveTab] = useState("new-vendor");

  const tabs = [
    {
      id: "new-vendor",
      label: "اضافة مورد جديد",
      content: <NewVendorForm />,
    },
    {
      id: "link-vendor",
      label: "ربط مورد بحساب",
      content: <MergeVendorsForm />,
    },
    {
      id: "merge-vendor",
      label: "دمج الموردين",
      content: <MergeVendorsWizard />,
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

export default NewVendorPage;
