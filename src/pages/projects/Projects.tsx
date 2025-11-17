import { Link } from "react-router-dom";
import Button from "../../components/ui/Button";
import ProjectsList from "../../components/project/lists/ProjectsList";

const ProjectsPage = () => {
  return (
    <div className="bg-background p-4 text-foreground">
      <main>
        <div>
          <Button variant="primary">
            <Link to="/projects/new">إنشاء مشروع جديد</Link>
          </Button>
        </div>
        <div>
          <ProjectsList />
        </div>
      </main>
    </div>
  );
};

export default ProjectsPage;
