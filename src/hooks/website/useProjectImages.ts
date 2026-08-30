import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import {
  ProjectImageAltFormValues,
  ProjectImageFormValues,
} from "../../types/schema/website/projectImage.schema";

export interface ProjectImage {
  id: string;
  project_id: string;
  alt_ar: string;
  alt_en: string;
  is_cover: boolean;
  sort_order: number;
  storage_path: string;
  created_at: string;
}

const BUCKET = "site-media";

const projectImagesQueryKey = (projectId: string) => [
  "website",
  "project-images",
  projectId,
];

export const getProjectImageUrl = (storagePath: string) =>
  supabase.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl;

const fetchProjectImages = async (
  projectId: string,
): Promise<ProjectImage[]> => {
  const { data, error } = await supabase
    .schema("website")
    .from("project_images")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
};

const createProjectImage = async ({
  projectId,
  slug,
  values,
}: {
  projectId: string;
  slug: string;
  values: ProjectImageFormValues;
}): Promise<ProjectImage> => {
  const { data: lastImage, error: fetchError } = await supabase
    .schema("website")
    .from("project_images")
    .select("sort_order")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);

  const nextSortOrder = lastImage ? lastImage.sort_order + 1 : 0;

  const extMatch = values.file.name.match(/\.(\w+)$/);
  const ext = extMatch ? extMatch[1] : "jpg";
  const path = `projects/${slug}/${Date.now()}_${Math.floor(Math.random() * 1e6)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, values.file, {
      contentType: values.file.type || "image/jpeg",
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) throw new Error(uploadError.message);

  const { data, error } = await supabase
    .schema("website")
    .from("project_images")
    .insert({
      project_id: projectId,
      alt_ar: values.alt_ar,
      alt_en: values.alt_en,
      storage_path: path,
      is_cover: !lastImage,
      sort_order: nextSortOrder,
    })
    .select("*")
    .single();

  if (error) {
    await supabase.storage.from(BUCKET).remove([path]);
    throw new Error(error.message);
  }

  return data;
};

const updateProjectImageAlt = async ({
  id,
  values,
}: {
  id: string;
  values: ProjectImageAltFormValues;
}): Promise<void> => {
  const { error } = await supabase
    .schema("website")
    .from("project_images")
    .update(values)
    .eq("id", id);

  if (error) throw new Error(error.message);
};

const setCoverProjectImage = async ({
  projectId,
  imageId,
}: {
  projectId: string;
  imageId: string;
}): Promise<void> => {
  const { error: unsetError } = await supabase
    .schema("website")
    .from("project_images")
    .update({ is_cover: false })
    .eq("project_id", projectId)
    .neq("id", imageId);

  if (unsetError) throw new Error(unsetError.message);

  const { error } = await supabase
    .schema("website")
    .from("project_images")
    .update({ is_cover: true })
    .eq("id", imageId);

  if (error) throw new Error(error.message);
};

const deleteProjectImage = async (image: ProjectImage): Promise<void> => {
  const { error: storageError } = await supabase.storage
    .from(BUCKET)
    .remove([image.storage_path]);

  if (storageError) throw new Error(storageError.message);

  const { error } = await supabase
    .schema("website")
    .from("project_images")
    .delete()
    .eq("id", image.id);

  if (error) throw new Error(error.message);
};

/** Recomputes sort_order to match each image's position in the array. */
export const withImageSortOrder = (images: ProjectImage[]): ProjectImage[] =>
  images.map((image, index) => ({ ...image, sort_order: index }));

const reorderProjectImages = async (images: ProjectImage[]): Promise<void> => {
  const { error } = await supabase
    .schema("website")
    .from("project_images")
    .upsert(
      images.map((image) => ({
        id: image.id,
        project_id: image.project_id,
        alt_ar: image.alt_ar,
        alt_en: image.alt_en,
        storage_path: image.storage_path,
        is_cover: image.is_cover,
        sort_order: image.sort_order,
      })),
      { onConflict: "id" },
    );

  if (error) throw new Error(error.message);
};

export const useProjectImagesQuery = (projectId: string) =>
  useQuery({
    queryKey: projectImagesQueryKey(projectId),
    queryFn: () => fetchProjectImages(projectId),
    enabled: !!projectId,
  });

export const useCreateProjectImage = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { slug: string; values: ProjectImageFormValues }) =>
      createProjectImage({ projectId, ...input }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: projectImagesQueryKey(projectId),
      });
    },
  });
};

export const useUpdateProjectImageAlt = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProjectImageAlt,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: projectImagesQueryKey(projectId),
      });
    },
  });
};

export const useSetCoverProjectImage = (projectId: string) => {
  const queryClient = useQueryClient();
  const queryKey = projectImagesQueryKey(projectId);
  return useMutation({
    mutationFn: (imageId: string) =>
      setCoverProjectImage({ projectId, imageId }),
    onMutate: async (imageId) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<ProjectImage[]>(queryKey);
      queryClient.setQueryData<ProjectImage[]>(
        queryKey,
        (current) =>
          current?.map((image) => ({
            ...image,
            is_cover: image.id === imageId,
          })),
      );
      return { previous };
    },
    onError: (_err, _imageId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
};

export const useDeleteProjectImage = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteProjectImage,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: projectImagesQueryKey(projectId),
      });
    },
  });
};

export const useReorderProjectImages = (projectId: string) => {
  const queryClient = useQueryClient();
  const queryKey = projectImagesQueryKey(projectId);
  return useMutation({
    mutationFn: reorderProjectImages,
    onMutate: async (nextImages) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<ProjectImage[]>(queryKey);
      queryClient.setQueryData(queryKey, nextImages);
      return { previous };
    },
    onError: (_err, _next, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
};

type UploadProjectImagesInput = {
  projectId: string;
  slug: string;
  titleAr: string;
  titleEn: string;
  files: File[];
  coverIndex: number;
};

const uploadProjectImages = async ({
  projectId,
  slug,
  titleAr,
  titleEn,
  files,
  coverIndex,
}: UploadProjectImagesInput): Promise<void> => {
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const extMatch = file.name.match(/\.(\w+)$/);
    const ext = extMatch ? extMatch[1] : "jpg";
    const path = `projects/${slug}/${Date.now()}_${i}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, {
        contentType: file.type || "image/jpeg",
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) throw new Error(uploadError.message);

    const { error } = await supabase
      .schema("website")
      .from("project_images")
      .insert({
        project_id: projectId,
        alt_ar: `${titleAr} - ${i + 1}`,
        alt_en: `${titleEn} - ${i + 1}`,
        storage_path: path,
        is_cover: i === coverIndex,
        sort_order: i,
      });

    if (error) {
      await supabase.storage.from(BUCKET).remove([path]);
      throw new Error(error.message);
    }
  }
};

export const useUploadProjectImages = () =>
  useMutation({
    mutationFn: uploadProjectImages,
  });
