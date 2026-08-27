interface SpecializedEntity {
  specialization_id: string | null;
  users: {
    user_specializations: { specialization_id: string }[];
  } | null;
}

export function matchesSpecialization<T extends SpecializedEntity>(
  item: T,
  specializationId: string,
): boolean {
  if (item.specialization_id === specializationId) return true;
  return (
    item.users?.user_specializations?.some(
      (us) => us.specialization_id === specializationId,
    ) ?? false
  );
}

export function countBySpecialization<T extends SpecializedEntity>(
  items: T[],
): Record<string, number> {
  const counts: Record<string, number> = {};
  items.forEach((item) => {
    const specIds = new Set<string>();
    if (item.specialization_id) specIds.add(item.specialization_id);
    item.users?.user_specializations?.forEach((us) =>
      specIds.add(us.specialization_id),
    );
    specIds.forEach((specId) => {
      counts[specId] = (counts[specId] ?? 0) + 1;
    });
  });
  return counts;
}
