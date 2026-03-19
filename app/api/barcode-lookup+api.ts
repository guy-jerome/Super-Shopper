const FIELDS =
  "product_name,product_name_en,brands,quantity,image_front_thumb_url";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const barcode = searchParams.get("barcode") ?? "";

  if (!barcode) {
    return Response.json({ status: 0 }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://us.openfoodfacts.org/api/v0/product/${encodeURIComponent(barcode)}.json?fields=${FIELDS}&lc=en`,
      { headers: { "User-Agent": "SuperShopper/1.0 (personal shopping app)" } },
    );
    const data = await res.json();
    return Response.json(data);
  } catch (err: any) {
    return Response.json({ error: err.message, status: 0 }, { status: 502 });
  }
}
