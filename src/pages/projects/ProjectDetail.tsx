import React, { useState, useEffect } from "react";
import { Users, DollarSign, MapPin, Activity } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { useParams } from "react-router-dom";
import { translateProjectStatus } from "../../utils/translations";

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
  status: string;
  amount: number;
  start_date: string | null;
  end_date: string | null;
  contractor?: Contractor;
}

interface Account {
  balance: number;
  held: number;
  currency: string;
  type: string;
}

interface FinancialData {
  totalExpenses: number;
  totalPaid: number;
  totalIncome: number;
  balance: number;
  held: number;
  available: number;
  pendingPayments: number;
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
              email
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
          .select("amount")
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

        // Fetch accounts for this project
        const { data: accounts, error: accountsError } = await supabase
          .from("accounts")
          .select("balance, held, currency, type")
          .eq("owner_type", "project")
          .eq("owner_id", projectId);

        if (accountsError) throw accountsError;

        // Calculate financial summaries
        const totalExpenses =
          expenses?.reduce(
            (sum, exp) => sum + parseFloat(String(exp.total_amount || 0)),
            0
          ) || 0;
        const totalPaid =
          expenses?.reduce(
            (sum, exp) => sum + parseFloat(String(exp.amount_paid || 0)),
            0
          ) || 0;
        const totalIncome =
          incomes?.reduce(
            (sum, inc) => sum + parseFloat(String(inc.amount || 0)),
            0
          ) || 0;
        const totalBalance =
          accounts?.reduce(
            (sum, acc) => sum + parseFloat(String(acc.balance || 0)),
            0
          ) || 0;
        const totalHeld =
          accounts?.reduce(
            (sum, acc) => sum + parseFloat(String(acc.held || 0)),
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
            balance: totalBalance,
            held: totalHeld,
            available: totalBalance - totalHeld,
            pendingPayments: totalExpenses - totalPaid,
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

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-LY", {
      style: "currency",
      currency: "LYD",
    }).format(amount || 0);
  };

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">أعضاء الفريق</p>
                <p className="text-3xl font-bold text-gray-900">
                  {project.stats.teamSize}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">الرصيد الكلي</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(project.financial.balance)}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">العقود النشطة</p>
                <p className="text-3xl font-bold text-gray-900">
                  {project.stats.activeContracts}
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <Activity className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

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
                <span className="text-gray-600">إجمالي الدخل</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(project.financial.totalIncome)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">إجمالي المصاريف</span>
                <span className="font-semibold text-red-600">
                  {formatCurrency(project.financial.totalExpenses)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">المبلغ المدفوع</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(project.financial.totalPaid)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t">
                <span className="text-gray-600">الرصيد المتاح</span>
                <span className="font-semibold text-blue-600">
                  {formatCurrency(project.financial.available)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">المبلغ المحتجز</span>
                <span className="font-semibold text-orange-600">
                  {formatCurrency(project.financial.held)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">المدفوعات المعلقة</span>
                <span className="font-semibold text-yellow-600">
                  {formatCurrency(project.financial.pendingPayments)}
                </span>
              </div>
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
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                          {member.project_role?.name || "N/A"}
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
                        {formatCurrency(contract.amount)}
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
