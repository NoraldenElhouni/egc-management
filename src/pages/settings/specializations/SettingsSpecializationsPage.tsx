import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Tabs from "../../../components/ui/Tabs";
import { useUtils } from "../../../hooks/useUtils";
import { supabase } from "../../../lib/supabaseClient"; // adjust path
import Button from "../../../components/ui/Button";

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

function SpecTab({
  title,
  roleId,
  initialItems,
}: {
  title: string;
  roleId: string;
  initialItems: Specialization[];
}) {
  const [items, setItems] = useState<Specialization[]>(initialItems);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

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

      setItems((prev) => [data, ...prev]); // show instantly
      setName("");
    } catch (err: unknown) {
      let message = "Failed to add specialization.";
      if (err instanceof Error) {
        message = err.message || message;
      } else if (typeof err === "string") {
        message = err;
      } else {
        try {
          message = JSON.stringify(err) || message;
        } catch {
          // ignore JSON stringify errors
        }
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Add form */}
      <form onSubmit={addSpecialization} className="rounded-xl border p-3">
        <div className="mb-2 text-sm text-muted-foreground">
          إضافة تخصص جديد إلى {title}
        </div>

        {error && (
          <div className="mb-2 rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="اسم التخصص..."
            className="flex-1 rounded-lg border px-3 py-2"
          />
          <Button
            type="submit"
            disabled={loading || !name.trim()}
            className="rounded-lg border px-4 py-2 hover:bg-muted disabled:opacity-50"
          >
            {loading ? "..." : "إضافة"}
          </Button>
        </div>
      </form>

      {/* List */}
      <div className="grid gap-2">
        {items.length === 0 ? (
          <div className="text-sm text-muted-foreground">لا يوجد تخصصات</div>
        ) : (
          items.map((spec) => (
            <Link
              key={spec.id}
              to={`/settings/specializations/${spec.id}`}
              className="flex items-center justify-between rounded-lg border bg-background px-3 py-2 hover:bg-muted transition"
            >
              <span className="font-medium">{spec.name}</span>
              <span className="text-xs text-muted-foreground">فتح</span>
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
        />
      ),
    },
  ];

  return (
    <div>
      <Tabs tabs={tabs} defaultTab="engineers" />
    </div>
  );
};

export default SettingsSpecializationsPage;
