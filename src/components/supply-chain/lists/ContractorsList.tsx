import { useMemo } from "react";
import { Award, Landmark, Users, Wrench } from "lucide-react";
import { useContractors } from "../../../hooks/useContractors";
import { ContractorsColumns } from "../../tables/columns/ContractorsColumns";
import GenericTable from "../../tables/table";
import KpiCard from "../../ui/KpiCard";

const ContractorsList = () => {
  const { contractors } = useContractors();

  const stats = useMemo(() => {
    const total = contractors.length;

    const withSpecialtyCount = contractors.filter(
      (c) =>
        Boolean(c.specialization_id) ||
        (c.users?.user_specializations?.length ?? 0) > 0,
    ).length;

    const bankApprovedCount = contractors.filter(
      (c) => c.bank_account_aproved,
    ).length;

    const specialtyCounts = new Map<string, number>();
    contractors.forEach((c) => {
      const name = c.specializations?.name;
      if (!name) return;
      specialtyCounts.set(name, (specialtyCounts.get(name) ?? 0) + 1);
    });

    const topSpecialty = Array.from(specialtyCounts, ([name, count]) => ({
      name,
      count,
    })).reduce<{ name: string; count: number } | null>(
      (top, current) => (!top || current.count > top.count ? current : top),
      null,
    );

    return { total, withSpecialtyCount, bankApprovedCount, topSpecialty };
  }, [contractors]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="إجمالي المقاولين"
          value={String(stats.total)}
          icon={Users}
          tone="indigo"
        />
        <KpiCard
          label="لديهم تخصص"
          value={`${stats.withSpecialtyCount} من ${stats.total}`}
          icon={Wrench}
          tone="blue"
        />
        <KpiCard
          label="معتمد بنكياً"
          value={`${stats.bankApprovedCount} من ${stats.total}`}
          icon={Landmark}
          tone="green"
        />
        <KpiCard
          label="الأكثر تخصصاً"
          value={
            stats.topSpecialty
              ? `${stats.topSpecialty.name} (${stats.topSpecialty.count})`
              : "لا يوجد"
          }
          icon={Award}
          tone="amber"
        />
      </div>

      <GenericTable
        data={contractors}
        columns={ContractorsColumns}
        pageSize={10}
        enableSorting
        enablePagination
        enableFiltering
        enableRowSelection
        showGlobalFilter
        initialSorting={[{ id: "name", desc: false }]}
      />
    </div>
  );
};

export default ContractorsList;
