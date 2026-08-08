import { useEffect, useState } from "react";
import { useLogs } from "../../hooks/logs/useLogs";
import { LogsColumns } from "../../components/tables/columns/LogsColumns";
import GenericTable from "../../components/tables/table";
import LoadingPage from "../../components/ui/LoadingPage";
import ErrorPage from "../../components/ui/errorPage";
import Button from "../../components/ui/Button";

const LIMIT = 50;
const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

const LogsPage = () => {
  const [pathInput, setPathInput] = useState("");
  const [path, setPath] = useState("");
  const [method, setMethod] = useState("");
  const [statusCodeInput, setStatusCodeInput] = useState("");
  const [statusCode, setStatusCode] = useState("");
  const [offset, setOffset] = useState(0);

  // Debounce free-text inputs so we don't refetch on every keystroke.
  useEffect(() => {
    const timeout = setTimeout(() => {
      setPath(pathInput.trim());
      setOffset(0);
    }, 400);
    return () => clearTimeout(timeout);
  }, [pathInput]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setStatusCode(statusCodeInput.trim());
      setOffset(0);
    }, 400);
    return () => clearTimeout(timeout);
  }, [statusCodeInput]);

  const handleMethodChange = (value: string) => {
    setMethod(value);
    setOffset(0);
  };

  const { data, isLoading, isError, error, isFetching } = useLogs({
    path: path || undefined,
    method: method || undefined,
    statusCode: statusCode || undefined,
    limit: LIMIT,
    offset,
  });

  if (isLoading) return <LoadingPage label="جاري تحميل السجلات..." />;
  if (isError) return <ErrorPage error={(error as Error).message} />;

  const logs = data?.logs ?? [];
  const canGoPrevious = offset > 0;
  const canGoNext = data?.hasMore ?? false;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">السجلات</h1>

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div className="flex flex-col">
          <label htmlFor="path" className="mb-1 text-sm text-foreground">
            Path
          </label>
          <input
            id="path"
            type="text"
            value={pathInput}
            onChange={(e) => setPathInput(e.target.value)}
            placeholder="/api/v1/..."
            className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="method" className="mb-1 text-sm text-foreground">
            Method
          </label>
          <select
            id="method"
            value={method}
            onChange={(e) => handleMethodChange(e.target.value)}
            className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All</option>
            {METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col">
          <label htmlFor="statusCode" className="mb-1 text-sm text-foreground">
            Status Code
          </label>
          <input
            id="statusCode"
            type="number"
            value={statusCodeInput}
            onChange={(e) => setStatusCodeInput(e.target.value)}
            placeholder="200"
            className="border rounded px-3 py-2 w-28 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {isFetching && (
          <span className="text-sm text-gray-500 pb-2">جاري التحديث...</span>
        )}
      </div>

      <GenericTable
        data={logs}
        columns={LogsColumns}
        emptyMessage="لا توجد سجلات مطابقة."
        pageSize={LIMIT}
      />

      {/* ── Pagination (server-side, limit/offset) ── */}
      <div className="flex items-center justify-between gap-2 mt-4">
        <Button
          variant="secondary"
          size="sm"
          disabled={!canGoPrevious}
          onClick={() => setOffset((prev) => Math.max(0, prev - LIMIT))}
        >
          السابق
        </Button>

        <span className="text-sm text-gray-600">
          {offset + 1} - {offset + logs.length}
        </span>

        <Button
          variant="secondary"
          size="sm"
          disabled={!canGoNext}
          onClick={() => setOffset((prev) => prev + LIMIT)}
        >
          التالي
        </Button>
      </div>
    </div>
  );
};

export default LogsPage;
