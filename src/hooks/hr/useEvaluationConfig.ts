import { useCallback, useEffect, useState } from "react";
import {
  addCriterion,
  addRatingLevel,
  getCriteria,
  getRatingScale,
  reorderCriteria,
  reorderRatingScale,
  setCriterionActive,
  setRatingLevelActive,
  updateCriterion,
  updateRatingLevel,
} from "../../services/hr/evaluationConfigService";
import type { EvaluationCategory, EvaluationCriteria, RatingScale } from "../../types/hr.type";

/**
 * Criteria + rating scale for one category ('interview' | 'performance'),
 * with CRUD + reorder. Used by both the rating forms (activeOnly: true,
 * the default) and the settings/admin screen (activeOnly: false, so
 * deactivated rows stay visible to be re-activated).
 */
export function useEvaluationConfig(
  category: EvaluationCategory,
  activeOnly = true,
) {
  const [criteria, setCriteria] = useState<EvaluationCriteria[]>([]);
  const [ratingScale, setRatingScale] = useState<RatingScale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        { data: criteriaData, error: criteriaError },
        { data: ratingData, error: ratingError },
      ] = await Promise.all([
        getCriteria(category, { activeOnly }),
        getRatingScale(category, { activeOnly }),
      ]);
      if (criteriaError) throw criteriaError;
      if (ratingError) throw ratingError;
      setCriteria(criteriaData ?? []);
      setRatingScale(ratingData ?? []);
    } catch (e) {
      console.error("Error loading evaluation config:", e);
      setError("فشل في تحميل بنود التقييم");
    } finally {
      setLoading(false);
    }
  }, [category, activeOnly]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const createCriterion = useCallback(
    async (nameAr: string) => {
      const nextSortOrder =
        criteria.reduce((max, c) => Math.max(max, c.sort_order), 0) + 1;
      const { data, error } = await addCriterion(category, nameAr, nextSortOrder);
      if (error || !data) return { success: false };
      setCriteria((prev) => [...prev, data]);
      return { success: true };
    },
    [category, criteria],
  );

  const editCriterion = useCallback(async (id: string, nameAr: string) => {
    const { error } = await updateCriterion(id, { name_ar: nameAr.trim() });
    if (error) return { success: false };
    setCriteria((prev) =>
      prev.map((c) => (c.id === id ? { ...c, name_ar: nameAr.trim() } : c)),
    );
    return { success: true };
  }, []);

  const toggleCriterionActive = useCallback(
    async (id: string, isActive: boolean) => {
      const { error } = await setCriterionActive(id, isActive);
      if (error) return { success: false };
      setCriteria((prev) =>
        prev.map((c) => (c.id === id ? { ...c, is_active: isActive } : c)),
      );
      return { success: true };
    },
    [],
  );

  const reorderCriteriaList = useCallback(
    async (next: EvaluationCriteria[]) => {
      const withOrder = next.map((c, index) => ({ ...c, sort_order: index }));
      setCriteria(withOrder);
      const { error } = await reorderCriteria(
        withOrder.map((c) => ({ id: c.id, sort_order: c.sort_order })),
      );
      if (error) {
        console.error("Error reordering criteria:", error);
        refetch();
      }
    },
    [refetch],
  );

  const createRatingLevel = useCallback(
    async (labelAr: string, score: number) => {
      const nextSortOrder =
        ratingScale.reduce((max, r) => Math.max(max, r.sort_order), 0) + 1;
      const { data, error } = await addRatingLevel(
        category,
        labelAr,
        score,
        nextSortOrder,
      );
      if (error || !data) return { success: false };
      setRatingScale((prev) => [...prev, data]);
      return { success: true };
    },
    [category, ratingScale],
  );

  const editRatingLevel = useCallback(
    async (id: string, labelAr: string, score: number) => {
      const { error } = await updateRatingLevel(id, {
        label_ar: labelAr.trim(),
        score,
      });
      if (error) return { success: false };
      setRatingScale((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, label_ar: labelAr.trim(), score } : r,
        ),
      );
      return { success: true };
    },
    [],
  );

  const toggleRatingLevelActive = useCallback(
    async (id: string, isActive: boolean) => {
      const { error } = await setRatingLevelActive(id, isActive);
      if (error) return { success: false };
      setRatingScale((prev) =>
        prev.map((r) => (r.id === id ? { ...r, is_active: isActive } : r)),
      );
      return { success: true };
    },
    [],
  );

  const reorderRatingScaleList = useCallback(
    async (next: RatingScale[]) => {
      const withOrder = next.map((r, index) => ({ ...r, sort_order: index }));
      setRatingScale(withOrder);
      const { error } = await reorderRatingScale(
        withOrder.map((r) => ({ id: r.id, sort_order: r.sort_order })),
      );
      if (error) {
        console.error("Error reordering rating scale:", error);
        refetch();
      }
    },
    [refetch],
  );

  return {
    criteria,
    ratingScale,
    loading,
    error,
    refetch,
    createCriterion,
    editCriterion,
    toggleCriterionActive,
    reorderCriteriaList,
    createRatingLevel,
    editRatingLevel,
    toggleRatingLevelActive,
    reorderRatingScaleList,
  };
}
