const ErrorPage = ({
  label = "حدث خطأ ما",
  error,
}: {
  label?: string;
  error?: string;
}) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
        <h3 className="text-red-800 font-semibold mb-2">{label}</h3>
        <p className="text-red-600">{error}</p>
      </div>
    </div>
  );
};

export default ErrorPage;
