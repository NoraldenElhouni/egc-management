export function useVindors() {
  // Dummy data for vindors
  const vindors = [
    {
      id: "1",
      name: "Vendor A",
      email: "vendorA@example.com",
      created_at: "2023-01-01",
    },
    {
      id: "1",
      name: "Vendor B",
      email: "vendorB@example.com",
      created_at: "2023-01-01",
    },
    {
      id: "1",
      name: "Vendor C",
      email: "vendorC@example.com",
      created_at: "2023-01-01",
    },
  ];
  return { vindors, loading: false, error: null };
}
