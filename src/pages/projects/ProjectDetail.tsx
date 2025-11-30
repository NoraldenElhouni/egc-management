import { useState, useEffect } from "react";
import { Users, DollarSign, MapPin, Activity } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { useParams } from "react-router-dom";
import { translateProjectStatus } from "../../utils/translations";
import OverviewStatus from "../../components/ui/OverviewStatus";

// Type definitions
interface Client {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string;
  phone_number: string;
}

interface User {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string;
  phone: string | null;
}

interface ProjectRole {
  name: string;
}

interface ProjectAssignment {
  id: string;
  project_id: string;
  user_id: string;
  project_role_id: string;
  assigned_at: string;
  user?: User;
  project_role?: ProjectRole;
}

interface Contractor {
  first_name: string;
  last_name: string | null;
}

interface Contract {
  id: string;
  status: string | null;
  amount: number;
  start_date: string | null;
  end_date: string | null;
  contractor?: Contractor | null;
}

interface Account {
  balance: number;
  held: number;
  currency: string;
  type: string;
  total_transactions: number;
}

interface FinancialData {
  totalExpenses: number;
  totalPaid: number;
  totalIncome: number;
  refunded: number;
  balance: number;
  held: number;
}

interface ProjectStats {
  teamSize: number;
  activeContracts: number;
  completionPercentage: number;
}

interface Project {
  id: string;
  client_id: string;
  code: string;
  name: string;
  address: string | null;
  status: string;
  created_at: string;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  percentage: number | null;
  percentage_taken: number;
  serial_number: number | null;
  client: Client;
  teamMembers: ProjectAssignment[];
  contracts: Contract[];
  accounts: Account[];
  financial: FinancialData;
  stats: ProjectStats;
}

interface UseProjectReturn {
  project: Project | null;
  loading: boolean;
  error: string | null;
}

// Custom hook to fetch project data
const useProject = (projectId: string | null): UseProjectReturn => {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjectDetails = async () => {
      if (!projectId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch main project data with client info
        const { data: projectData, error: projectError } = await supabase
          .from("projects")
          .select(
            `
            *,
            client:clients(
              id,
              first_name,
              last_name,
              email,
              phone_number
            )
          `
          )
          .eq("id", projectId)
          .single();

        if (projectError) throw projectError;

        // Fetch project assignments (team members)
        const { data: assignments, error: assignmentsError } = await supabase
          .from("project_assignments")
          .select(
            `
            *,
            user:user_id(
              id,
              first_name,
              last_name,
              email,
              phone
            ),
            project_role:project_roles(
              name
            )
          `
          )
          .eq("project_id", projectId);

        if (assignmentsError) throw assignmentsError;

        // Fetch financial data - expenses
        const { data: expenses, error: expensesError } = await supabase
          .from("project_expenses")
          .select("total_amount, amount_paid, status")
          .eq("project_id", projectId);

        if (expensesError) throw expensesError;

        // Fetch financial data - incomes
        const { data: incomes, error: incomesError } = await supabase
          .from("project_incomes")
          .select("*")
          .eq("project_id", projectId);

        if (incomesError) throw incomesError;

        // Fetch contracts
        const { data: contracts, error: contractsError } = await supabase
          .from("contracts")
          .select(
            `
            id,
            status,
            amount,
            start_date,
            end_date,
            contractor:assigned_to(
              first_name,
              last_name
            )
          `
          )
          .eq("project_id", projectId);

        if (contractsError) throw contractsError;

        // Fetch project balances per currency (authoritative totals)
        const { data: projectBalances, error: balancesError } = await supabase
          .from("project_balances")
          .select("*")
          .eq("project_id", projectId);

        if (balancesError) throw balancesError;

        // Fetch accounts for this project (informational, no held/transactions)
        const { data: accounts, error: accountsError } = await supabase
          .from("accounts")
          .select("balance, held, currency, type, total_transactions")
          .eq("owner_type", "project")
          .eq("owner_id", projectId);

        if (accountsError) throw accountsError;

        const totalExpenses =
          projectBalances?.find((pb) => pb.currency === "LYD")?.total_expense ||
          0;

        const totalIncome =
          projectBalances?.find((pb) => pb.currency === "LYD")
            ?.total_transactions || 0;

        const balance =
          projectBalances?.find((pb) => pb.currency === "LYD")?.balance || 0;

        const held =
          projectBalances?.find((pb) => pb.currency === "LYD")?.held || 0;

        const totalPaid =
          expenses?.reduce(
            (sum, exp) => sum + parseFloat(String(exp.amount_paid || 0)),
            0
          ) || 0;

        const totalreturned =
          incomes?.reduce(
            (sum, inc) =>
              sum +
              (inc.fund === "refund" ? parseFloat(String(inc.amount ?? 0)) : 0),
            0
          ) || 0;

        // Compile all data
        const compiledProject: Project = {
          ...projectData,
          teamMembers: assignments || [],
          contracts: contracts || [],
          accounts: accounts || [],
          financial: {
            totalExpenses,
            totalPaid,
            totalIncome,
            refunded: totalreturned,
            balance,
            held,
          },
          stats: {
            teamSize: assignments?.length || 0,
            activeContracts:
              contracts?.filter((c) => c.status === "active").length || 0,
            completionPercentage: projectData.percentage || 0,
          },
        };

        setProject(compiledProject);
      } catch (err) {
        console.error("Error fetching project:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchProjectDetails();
  }, [projectId]);

  return { project, loading, error };
};

// Project Details Component
const ProjectDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  if (!id) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-600">No project id found</p>
      </div>
    );
  }
  const { project, loading, error } = useProject(id);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading project details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h3 className="text-red-800 font-semibold mb-2">
            Error Loading Project
          </h3>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-600">No project found</p>
      </div>
    );
  }

  const formatCurrency = (amount: number, currency = "LYD"): string => {
    // Choose a locale based on currency for better formatting defaults
    const localeMap: Record<string, string> = {
      LYD: "en-LY",
      USD: "en-US",
      EUR: "de-DE", // German locale commonly used for EUR formatting
    };
    const locale = localeMap[currency] || "en-US";
    try {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount || 0);
    } catch {
      // Fallback if Intl cannot format given currency
      return `${amount?.toFixed(2)} ${currency}`;
    }
  };

  const groupAccountsByCurrency = (accounts: Account[]) => {
    const byCurrency: Record<string, Record<string, Account[]>> = {};
    accounts.forEach((acc) => {
      if (!byCurrency[acc.currency]) byCurrency[acc.currency] = {};
      if (!byCurrency[acc.currency][acc.type])
        byCurrency[acc.currency][acc.type] = [];
      byCurrency[acc.currency][acc.type].push(acc);
    });
    // Sort to ensure LYD comes first
    const sortedEntries = Object.entries(byCurrency).sort(([a], [b]) => {
      if (a === "LYD") return -1;
      if (b === "LYD") return 1;
      return a.localeCompare(b);
    });
    return Object.fromEntries(sortedEntries);
  };

  const typeLabel = (type: string) =>
    type === "bank" ? "بنك" : type === "cash" ? "نقدي" : type;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  {project.name}
                </h1>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    project.status === "active"
                      ? "bg-green-100 text-green-800"
                      : project.status === "completed"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {translateProjectStatus(project.status)}
                </span>
              </div>
              <p className="text-gray-600 mb-2">الرمز: {project.code}</p>
              {project.description && (
                <p className="text-gray-700 mt-2">{project.description}</p>
              )}
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 mb-1">تاريخ الإنشاء</div>
              <div className="text-gray-900">
                {new Date(project.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>

          {project.address && (
            <div className="flex items-center gap-2 mt-4 text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>{project.address}</span>
            </div>
          )}
        </div>

        {/* Overview Stats */}

        <OverviewStatus
          stats={[
            {
              label: "أعضاء الفريق",
              value: project.stats.teamSize,
              icon: Users,
              iconBgColor: "bg-blue-100",
              iconColor: "text-blue-600",
            },
            {
              label: "الرصيد الحالي",
              value: formatCurrency(project.financial.balance, "LYD"),
              icon: DollarSign,
              iconBgColor: "bg-green-100",
              iconColor: "text-green-600",
            },
            {
              label: "العقود النشطة",
              value: project.stats.activeContracts,
              icon: Activity,
              iconBgColor: "bg-orange-100",
              iconColor: "text-orange-600",
            },
            {
              label: `نسبة الشركة ${project.percentage}%`,
              value: formatCurrency(project.percentage_taken, "LYD"),
              icon: DollarSign,
              iconBgColor: "bg-green-100",
              iconColor: "text-green-600",
            },
          ]}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Client Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              معلومات العميل
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">الاسم</p>
                <p className="text-gray-900 font-medium">
                  {project.client.first_name} {project.client.last_name}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">البريد الإلكتروني</p>
                <p className="text-gray-900">{project.client.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">الهاتف</p>
                <p className="text-gray-900">{project.client.phone_number}</p>
              </div>
            </div>
          </div>

          {/* Financial Overview */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              نظرة عامة مالية
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">اجمالي ايداع</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(project.financial.totalIncome, "LYD")}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">قيم الراجع</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(project.financial.refunded, "LYD")}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">قيم المحجوزة</span>
                <span className="font-semibold text-orange-600">
                  {formatCurrency(project.financial.held, "LYD")}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">اجمالي مصروفات</span>
                <span className="font-semibold text-orange-600">
                  {formatCurrency(project.financial.totalExpenses, "LYD")}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">حصه الشركه</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(project.percentage_taken, "LYD")}
                </span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t">
                <span className="text-gray-600">رصيد الحالي</span>
                <span className="font-semibold text-blue-600">
                  {formatCurrency(project.financial.balance, "LYD")}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">رصيد المتاح</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(
                    project.financial.balance - project.financial.held,
                    "LYD"
                  )}
                </span>
              </div>
              {/* {isBalanced ? null : (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-yellow-800 text-sm">
                    تحذير: إجمالي المعاملات في حسابات LYD لا يتطابق مع مجموع
                    إيداعات العملاء والمرتجعات. يرجى التحقق من البيانات المالية.
                  </p>
                </div>
              )} */}
            </div>
          </div>
        </div>

        {/* Team Members */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            أعضاء الفريق
          </h2>
          {project.teamMembers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                      الاسم
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                      البريد الإلكتروني
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                      رقم الهاتف
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                      الدور في المشروع
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                      تاريخ التعيين
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {project.teamMembers.map((member) => (
                    <tr key={member.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        {member.user?.first_name} {member.user?.last_name}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {member.user?.email}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {member.user?.phone || "لا يوجد رقم هاتف"}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                          {member.project_role?.name === "manager"
                            ? "مدير مشروع"
                            : "عضو فريق"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {new Date(member.assigned_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">لا يوجد أعضاء فريق معينون بعد</p>
          )}
        </div>

        {/* Accounts Breakdown */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">الحسابات</h2>
          {project.accounts && project.accounts.length > 0 ? (
            <div className="space-y-6">
              {Object.entries(groupAccountsByCurrency(project.accounts)).map(
                ([currency, types]) => (
                  <div key={currency} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        عملة: {currency}
                      </h3>
                      <span className="text-sm text-gray-600">
                        إجمالي الرصيد:{" "}
                        {formatCurrency(
                          Object.values(types)
                            .flat()
                            .reduce((s, a) => s + (a.balance || 0), 0),
                          currency
                        )}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(types).map(([type, accounts]) => {
                        const totalBalance = accounts.reduce(
                          (s, a) => s + (a.balance || 0),
                          0
                        );

                        const totalTransactions = accounts.reduce(
                          (s, a) => s + (a.total_transactions || 0),
                          0
                        );
                        return (
                          <div key={type} className="bg-gray-50 rounded p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-gray-800">
                                {typeLabel(type)}
                              </span>
                              <span className="text-xs text-gray-500">
                                عدد الحسابات: {accounts.length}
                              </span>
                            </div>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">
                                  الاجمالي ايداع
                                </span>
                                <span className="font-semibold text-gray-900">
                                  {formatCurrency(totalTransactions, currency)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">الرصيد</span>
                                <span className="font-semibold text-blue-600">
                                  {formatCurrency(totalBalance, currency)}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )
              )}
            </div>
          ) : (
            <p className="text-gray-500">لا توجد حسابات لهذا المشروع</p>
          )}
        </div>

        {/* Active Contracts */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            العقود النشطة
          </h2>
          {project.contracts.length > 0 ? (
            <div className="space-y-4">
              {project.contracts.map((contract) => (
                <div
                  key={contract.id}
                  className="border rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-gray-900">
                        {contract.contractor?.first_name}{" "}
                        {contract.contractor?.last_name}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {contract.start_date &&
                          `Start: ${new Date(contract.start_date).toLocaleDateString()}`}
                        {contract.end_date &&
                          ` - End: ${new Date(contract.end_date).toLocaleDateString()}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(contract.amount, "LYD")}
                      </p>
                      <span
                        className={`inline-block mt-1 px-2 py-1 rounded text-xs font-medium ${
                          contract.status === "active"
                            ? "bg-green-100 text-green-800"
                            : contract.status === "completed"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {contract.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">لا توجد عقود متاحة</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailsPage;
