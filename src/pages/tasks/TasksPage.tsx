import { ListTodo } from "lucide-react";

// Part 7 (D1–D11) is being built out screen by screen. This landing page
// is the placeholder /tasks lands on today so the main-menu card is never
// a dead link — replace with the real sidebar (D1) + zone board (D2) as
// they're built.
const TasksPage = () => {
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center text-gray-500"
      dir="rtl"
    >
      <ListTodo size={40} className="text-primary" />
      <h1 className="text-xl font-bold text-gray-800">إدارة المهام</h1>
      <p className="max-w-md text-sm">
        وحدة المهام قيد الإنشاء. سيتم إضافة الشاشات هنا تدريجياً.
      </p>
    </div>
  );
};

export default TasksPage;
