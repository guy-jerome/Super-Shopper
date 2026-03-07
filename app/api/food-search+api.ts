const FIELDS =
  "product_name,product_name_en,brands,quantity,image_front_thumb_url,countries_tags";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const page = searchParams.get("page") ?? "1";
  const pageSize = searchParams.get("page_size") ?? "12";

  if (!q) {
    return Response.json({ hits: [] });
  }

  const target =
    `https://search.openfoodfacts.org/search` +
    `?q=${encodeURIComponent(q)}` +
    `&page=${page}` +
    `&page_size=${pageSize}` +
    `&fields=${FIELDS}` +
    `&filter_by=countries_tags%3Aen%3Aunited-states`;

  try {
    const res = await fetch(target, {
      headers: { "User-Agent": "SuperShopper/1.0 (personal shopping app)" },
    });
    const data = await res.json();
    return Response.json(data);
  } catch (err: any) {
    return Response.json({ error: err.message, hits: [] }, { status: 502 });
  }
}
