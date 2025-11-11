import { Link } from "react-router-dom";

const ProjectsPage = () => {
  return (
    <div className="bg-background  text-foreground">
      <header className="flex items-center justify-between gap-4 mb-6"></header>
      <main>
        <h2 className="text-foreground">مرحبًا بك في صفحة إدارة المشاريع</h2>
        <div>
          <Link to="/projects/new">إنشاء مشروع جديد</Link>
        </div>
      </main>
    </div>
  );
};

export default ProjectsPage;
