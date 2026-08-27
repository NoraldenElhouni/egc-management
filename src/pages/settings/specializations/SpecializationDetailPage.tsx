import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowRight, Briefcase, HardHat, Package } from "lucide-react";
import { useUtils } from "../../../hooks/useUtils";
import { useVendorsQuery } from "../../../hooks/useVendors";
import { useContractorsQuery } from "../../../hooks/useContractors";
import {
  EmployeeSummary,
  useEmployeesBySpecialization,
} from "../../../hooks/useEmployees";
import { matchesSpecialization } from "../../../utils/specializations";
import {
  VendorsWithSpecializations,
  contractorWithSpecializations,
} from "../../../types/extended.type";
import GenericTable from "../../../components/tables/table";
import LoadingPage from "../../../components/ui/LoadingPage";

const roleIds = {
  engineers: "212424d8-219a-4899-a24b-5d5bf05546e8",
  contractors: "20606a44-1f4b-4e0a-af58-abc553b70bc0",
  vendors: "7cfabb14-ee17-48bc-b03f-4199ef32d1e0",
};

const vendorColumns: ColumnDef<VendorsWithSpecializations>[] = [
  {
    accessorKey: "vendor_name",
    header: "اسم المورد",
    cell: ({ row }) => (
      <Link
        to={`/supply-chain/vendors/${row.original.id}`}
        className="font-medium hover:underline"
      >
        {row.original.vendor_name}
      </Link>
    ),
  },
  { accessorKey: "email", header: "البريد الإلكتروني" },
  { accessorKey: "phone_number", header: "رقم الهاتف" },
];

const contractorColumns: ColumnDef<contractorWithSpecializations>[] = [
  {
    id: "name",
    header: "الاسم",
    cell: ({ row }) => (
      <Link
        to={`/supply-chain/contractors/${row.original.id}`}
        className="font-medium hover:underline"
      >
        {row.original.first_name} {row.original.last_name}
      </Link>
    ),
  },
  { accessorKey: "email", header: "البريد الإلكتروني" },
  { accessorKey: "phone_number", header: "رقم الهاتف" },
];

const employeeColumns: ColumnDef<EmployeeSummary>[] = [
  {
    id: "name",
    header: "الاسم",
    cell: ({ row }) => (
      <Link
        to={`/hr/employees/${row.original.id}`}
        className="font-medium hover:underline"
      >
        {row.original.first_name} {row.original.last_name}
      </Link>
    ),
  },
  { accessorKey: "email", header: "البريد الإلكتروني" },
];

const SpecializationDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { specializations } = useUtils();
  const specialization = specializations.find((s) => s.id === id);

  const roleType =
    specialization?.role_id === roleIds.engineers
      ? "engineers"
      : specialization?.role_id === roleIds.contractors
        ? "contractors"
        : specialization?.role_id === roleIds.vendors
          ? "vendors"
          : null;

  const { data: vendors, isLoading: vendorsLoading } = useVendorsQuery();
  const { data: contractors, isLoading: contractorsLoading } =
    useContractorsQuery();
  const { employees, loading: employeesLoading } =
    useEmployeesBySpecialization(id);

  const filteredVendors = useMemo(
    () => (vendors ?? []).filter((v) => id && matchesSpecialization(v, id)),
    [vendors, id],
  );
  const filteredContractors = useMemo(
    () =>
      (contractors ?? []).filter((c) => id && matchesSpecialization(c, id)),
    [contractors, id],
  );

  if (!specialization) return <LoadingPage />;
  if (
    (roleType === "vendors" && vendorsLoading) ||
    (roleType === "contractors" && contractorsLoading) ||
    (roleType === "engineers" && employeesLoading)
  )
    return <LoadingPage />;

  const config = {
    engineers: {
      icon: Briefcase,
      count: employees.length,
      label: "مهندس",
    },
    contractors: {
      icon: HardHat,
      count: filteredContractors.length,
      label: "مقاول",
    },
    vendors: {
      icon: Package,
      count: filteredVendors.length,
      label: "مورد",
    },
  }[roleType ?? "vendors"];

  const Icon = config.icon;

  return (
    <div className="p-6 space-y-4">
      <Link
        to="/settings/specializations"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowRight className="w-4 h-4" />
        رجوع إلى التخصصات
      </Link>

      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
          <Icon className="w-6 h-6 text-gray-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {specialization.name}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {config.count} {config.label}
          </p>
        </div>
      </div>

      {roleType === "vendors" && (
        <GenericTable
          data={filteredVendors}
          columns={vendorColumns}
          enableSorting
          enableFiltering
          showGlobalFilter
        />
      )}
      {roleType === "contractors" && (
        <GenericTable
          data={filteredContractors}
          columns={contractorColumns}
          enableSorting
          enableFiltering
          showGlobalFilter
        />
      )}
      {roleType === "engineers" && (
        <GenericTable
          data={employees}
          columns={employeeColumns}
          enableSorting
          enableFiltering
          showGlobalFilter
        />
      )}
    </div>
  );
};

export default SpecializationDetailPage;
