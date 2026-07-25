import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useRef, useState } from "react";

import { deleteProductImage, getProductImages, uploadProductImage } from "../../api/catalog";
import { extractErrorMessage } from "../../utils/errors";

export default function ProductImageManager({ slug }) {
  const [isPrimary, setIsPrimary] = useState(false);
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: images, isLoading } = useQuery({
    queryKey: ["product-images", slug],
    queryFn: () => getProductImages(slug),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["product-images", slug] });
    // primary_image shown in the product list/cards is derived from images,
    // so the dashboard list and public catalog both need a refresh too.
    queryClient.invalidateQueries({ queryKey: ["my-products"] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
  };

  const uploadMutation = useMutation({
    mutationFn: (file) => uploadProductImage(slug, file, { isPrimary }),
    onSuccess: () => {
      invalidate();
      setIsPrimary(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProductImage,
    onSuccess: invalidate,
  });

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) uploadMutation.mutate(file);
  };

  return (
    <div className="mt-2 rounded border border-navy/10 bg-cream/60 p-3">
      {isLoading ? (
        <p className="text-xs text-navy/60">Loading images…</p>
      ) : images?.length ? (
        <div className="mb-3 flex flex-wrap gap-2">
          {images.map((image) => (
            <div key={image.id} className="relative">
              <img
                src={image.image}
                alt={image.alt_text}
                className="h-16 w-16 rounded border border-navy/10 object-cover"
              />
              {image.is_primary && (
                <span className="absolute left-0 top-0 rounded-br bg-orange px-1 text-[9px] font-medium text-white">
                  Primary
                </span>
              )}
              <button
                type="button"
                onClick={() => deleteMutation.mutate(image.id)}
                disabled={deleteMutation.isPending}
                title="Delete image"
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-red-600 shadow disabled:opacity-50"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="mb-3 text-xs text-navy/60">No images yet.</p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploadMutation.isPending}
          className="text-xs"
        />
        <label className="flex items-center gap-1 text-xs text-navy/70">
          <input type="checkbox" checked={isPrimary} onChange={(e) => setIsPrimary(e.target.checked)} />
          Set as primary
        </label>
        {uploadMutation.isPending && <span className="text-xs text-navy/60">Uploading…</span>}
      </div>

      {uploadMutation.isError && (
        <p className="mt-1 text-xs text-red-600">{extractErrorMessage(uploadMutation.error)}</p>
      )}
      {deleteMutation.isError && (
        <p className="mt-1 text-xs text-red-600">{extractErrorMessage(deleteMutation.error)}</p>
      )}
    </div>
  );
}
