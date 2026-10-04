import { usePublicApi } from "./usePublicApi";

const params = new URLSearchParams({
  action: "query",
  generator: "categorymembers",
  gcmtitle: "Category:Frozen food",
  gcmtype: "file",
  gcmlimit: "8",
  prop: "imageinfo",
  iiprop: "url|extmetadata|mime",
  iiurlwidth: "600",
  format: "json",
  origin: "*",
});

const API_URL = `https://commons.wikimedia.org/w/api.php?${params}`;

export function usePackageImages() {
  const request = usePublicApi(API_URL);
  const images = Object.values(request.data?.query?.pages ?? {})
    .filter((page) => page.imageinfo?.[0]?.mime?.startsWith("image/"))
    .sort((a, b) => a.title.localeCompare(b.title))
    .slice(0, 3)
    .map((page, index) => {
      const info = page.imageinfo[0];
      return {
        id: page.pageid,
        title: `Penanganan paket beku ${index + 1}`,
        imageUrl: info.thumburl ?? info.url,
        sourceUrl: info.descriptionurl,
        license: info.extmetadata?.LicenseShortName?.value ?? "Lihat lisensi sumber",
        author: info.extmetadata?.Artist?.value?.replace(/<[^>]*>/g, "").trim() || "Kontributor Wikimedia Commons",
      };
    });

  return { images, isLoading: request.isLoading, isError: request.isError,
    error: request.error, retry: request.retry };
}
