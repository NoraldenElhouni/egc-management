interface EmployeeHeaderProps {
  firstName: string;
  lastName: string;
  jobTitle: string;
  status: string;
  personalPhotoUrl?: string;
  department: string;
}

export function EmployeeHeader({
  firstName,
  lastName,
  jobTitle,
  status,
  personalPhotoUrl,
  department,
}: EmployeeHeaderProps) {
  return (
    <div className="border-b border-border mb-8 pb-8">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-6">
          <div className="h-24 w-24">
            {personalPhotoUrl ? (
              <img
                src={personalPhotoUrl || "/placeholder.svg"}
                alt={`${firstName} ${lastName}`}
              />
            ) : (
              <div className="h-24 w-24 bg-muted flex items-center justify-center rounded-md text-3xl font-semibold text-white">
                {firstName.charAt(0)}
                {lastName.charAt(0)}
              </div>
            )}
          </div>
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              {firstName} {lastName}
            </h1>
            <p className="text-lg text-muted-foreground mb-3">{jobTitle}</p>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="font-sm">{department}</div>
              <div>{status}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
