import { useMemo } from "react";
import { Award, Landmark, Users, Wrench } from "lucide-react";
import { useVendors } from "../../../hooks/useVendors";
import { VendorsColumns } from "../../tables/columns/VindorsColumns";
import GenericTable from "../../tables/table";
import ErrorPage from "../../ui/errorPage";
import LoadingPage from "../../ui/LoadingPage";
import KpiCard from "../../ui/KpiCard";

const VendorsList = () => {
  const { vendors, loading, error } = useVendors();

  const stats = useMemo(() => {
    const total = vendors.length;

    const withSpecialtyCount = vendors.filter(
      (v) =>
        Boolean(v.specialization_id) ||
        (v.users?.user_specializations?.length ?? 0) > 0,
    ).length;

    const bankApprovedCount = vendors.filter(
      (v) => v.bank_account_approved,
    ).length;

    const specialtyCounts = new Map<string, number>();
    vendors.forEach((v) => {
      const name = v.specializations?.name;
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
  }, [vendors]);

  if (loading) {
    return <LoadingPage label="جاري تحميل الموردين..." />;
  }

  if (error) {
    return <ErrorPage error={error.message} label="خطأ في تحميل الموردين" />;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="إجمالي الموردين"
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
        data={vendors}
        columns={VendorsColumns}
        pageSize={10}
        enableSorting
        enablePagination
        enableFiltering
        enableRowSelection
        showGlobalFilter
      />
    </div>
  );
};

export default VendorsList;
