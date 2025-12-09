const ProjectPercentageFormSkelton = () => {
  return (
    <div
      className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      dir="rtl"
    >
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="h-64 bg-gray-100 rounded-xl animate-pulse"
        ></div>
      ))}
    </div>
  );
};

export default ProjectPercentageFormSkelton;
