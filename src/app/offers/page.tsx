export default async function OffersPage() {
  let offers: any[] = [];
  let error = "";

  try {
    // placeholder until data layer is stable
    offers = [];
  } catch (err) {
    error = err instanceof Error ? err.message : "Unknown error";
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Offers</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <pre>{JSON.stringify(offers, null, 2)}</pre>
    </div>
  );
}
