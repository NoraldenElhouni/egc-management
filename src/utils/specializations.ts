interface SpecializedEntity {
  contractor_specialities?: { speciality_id: string }[] | null;
  vendor_specialities?: { speciality_id: string }[] | null;
  employee_specialities?: { speciality_id: string }[] | null;
}

export function matchesSpecialization<T extends SpecializedEntity>(
  item: T,
  specializationId: string,
): boolean {
  if (item.contractor_specialities?.some((cs) => cs.speciality_id === specializationId)) return true;
  if (item.vendor_specialities?.some((vs) => vs.speciality_id === specializationId)) return true;
  return (
    item.employee_specialities?.some(
      (es) => es.speciality_id === specializationId,
    ) ?? false
  );
}

export function countBySpecialization<T extends SpecializedEntity>(
  items: T[],
): Record<string, number> {
  const counts: Record<string, number> = {};
  items.forEach((item) => {
    const specIds = new Set<string>();
    item.contractor_specialities?.forEach((cs) => specIds.add(cs.speciality_id));
    item.vendor_specialities?.forEach((vs) => specIds.add(vs.speciality_id));
    item.employee_specialities?.forEach((es) => specIds.add(es.speciality_id));
    specIds.forEach((specId) => {
      counts[specId] = (counts[specId] ?? 0) + 1;
    });
  });
  return counts;
}
