import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Tabs from "../../../components/ui/Tabs";
import { useUtils } from "../../../hooks/useUtils";
import { supabase } from "../../../lib/supabaseClient";
import Button from "../../../components/ui/Button";
import {
  Search,
  Plus,
  ArrowRight,
  Briefcase,
  HardHat,
  Package,
  Sparkles,
  Loader2,
  CheckCircle2,
} from "lucide-react";

type Specialization = {
  id: string;
  name: string;
  role_id: string;
};

const roleIds = {
  engineers: "212424d8-219a-4899-a24b-5d5bf05546e8",
  contractors: "20606a44-1f4b-4e0a-af58-abc553b70bc0",
  vendors: "7cfabb14-ee17-48bc-b03f-4199ef32d1e0",
};

const roleIcons = {
  engineers: Briefcase,
  contractors: HardHat,
  vendors: Package,
};

const roleColors = {
  engineers: {
    bg: "from-blue-500 to-cyan-600",
    light: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    hover: "hover:bg-blue-50",
  },
  contractors: {
    bg: "from-orange-500 to-red-600",
    light: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-700",
    hover: "hover:bg-orange-50",
  },
  vendors: {
    bg: "from-emerald-500 to-teal-600",
    light: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    hover: "hover:bg-emerald-50",
  },
};

function SpecTab({
  title,
  roleId,
  initialItems,
  roleType,
}: {
  title: string;
  roleId: string;
  initialItems: Specialization[];
  roleType: keyof typeof roleColors;
}) {
  const [items, setItems] = useState<Specialization[]>(initialItems);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState<string>("");
  const [showSuccess, setShowSuccess] = useState(false);

  const colors = roleColors[roleType];
  const Icon = roleIcons[roleType];

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q) return setItems(initialItems);
    setItems(
      initialItems.filter((spec) => spec.name.toLowerCase().includes(q))
    );
  }, [query, initialItems]);

  const addSpecialization = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("specializations")
        .insert([{ name: trimmed, role_id: roleId }])
        .select("id, name, role_id")
        .single();

      if (error) throw error;

      setItems((prev) => [data, ...prev]);
      setName("");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2500);
    } catch (err: unknown) {
      let message = "فشل في إضافة التخصص";
      if (err instanceof Error) message = err.message || message;
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 lg:space-y-3">
      {/* Compact Header */}
      <div className={`${colors.light} rounded-xl p-4 border ${colors.border}`}>
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 bg-gradient-to-br ${colors.bg} rounded-lg flex items-center justify-center shadow`}
          >
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <p className="text-xs text-gray-600 mt-0.5">
              إدارة تخصصات {title} وإضافة تخصصات جديدة
            </p>
          </div>
        </div>
      </div>

      {/* Compact Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`ابحث في تخصصات ${title}...`}
          className="w-full rounded-lg border border-gray-200 px-9 py-2.5 text-sm focus:border-gray-400 focus:outline-none bg-white"
        />
      </div>

      {/* Compact Add Form */}
      <form
        onSubmit={addSpecialization}
        className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
      >
        <div className="flex items-center gap-2 mb-3">
          <div className={`p-1.5 ${colors.light} rounded-md`}>
            <Plus className={`w-4 h-4 ${colors.text}`} />
          </div>
          <h3 className="text-base font-semibold text-gray-900">إضافة تخصص</h3>
        </div>

        {error && (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            {error}
          </div>
        )}

        {showSuccess && (
          <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>تم إضافة التخصص بنجاح!</span>
          </div>
        )}

        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="اسم التخصص..."
            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
            disabled={loading}
          />
          <Button
            type="submit"
            disabled={loading || !name.trim()}
            className={`rounded-lg px-4 py-2 bg-gradient-to-r ${colors.bg} text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-w-[96px] justify-center`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>إضافة</span>
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Compact List Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-gray-400" />
          <h3 className="text-base font-semibold text-gray-900">
            قائمة التخصصات
          </h3>
          <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
            {items.length}
          </span>
        </div>
      </div>

      {/* Compact List */}
      <div className="grid gap-2">
        {items.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <Icon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-600 font-medium mb-0.5">
              لا توجد تخصصات حالياً
            </p>
            <p className="text-xs text-gray-500">
              {query ? "لم يتم العثور على نتائج" : "ابدأ بإضافة تخصص جديد"}
            </p>
          </div>
        ) : (
          items.map((spec) => (
            <Link
              key={spec.id}
              to={`/settings/specializations/${spec.id}`}
              className={`group flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 ${colors.hover} transition hover:border-gray-300 hover:shadow-sm`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 ${colors.light} rounded-md flex items-center justify-center`}
                >
                  <Icon className={`w-4 h-4 ${colors.text}`} />
                </div>
                <span className="font-medium text-gray-900 text-sm">
                  {spec.name}
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition" />
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

const SettingsSpecializationsPage = () => {
  const { specializations } = useUtils();

  const engineers = useMemo(
    () => specializations.filter((s) => s.role_id === roleIds.engineers),
    [specializations]
  );
  const contractors = useMemo(
    () => specializations.filter((s) => s.role_id === roleIds.contractors),
    [specializations]
  );
  const vendors = useMemo(
    () => specializations.filter((s) => s.role_id === roleIds.vendors),
    [specializations]
  );

  const tabs = [
    {
      id: "engineers",
      label: "مهندسين",
      content: (
        <SpecTab
          title="المهندسين"
          roleId={roleIds.engineers}
          initialItems={engineers}
          roleType="engineers"
        />
      ),
    },
    {
      id: "contractors",
      label: "مقاولين",
      content: (
        <SpecTab
          title="المقاولين"
          roleId={roleIds.contractors}
          initialItems={contractors}
          roleType="contractors"
        />
      ),
    },
    {
      id: "vendors",
      label: "موردين",
      content: (
        <SpecTab
          title="الموردين"
          roleId={roleIds.vendors}
          initialItems={vendors}
          roleType="vendors"
        />
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-6 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Compact Page Header */}
        <div className="mb-5">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            إدارة التخصصات
          </h1>
          <p className="text-sm text-gray-600">
            قم بإدارة تخصصات المهندسين والمقاولين والموردين من مكان واحد
          </p>
        </div>

        <Tabs tabs={tabs} defaultTab="engineers" />
      </div>
    </div>
  );
};

export default SettingsSpecializationsPage;
