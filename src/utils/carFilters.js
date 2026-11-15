/** API cars use snake_case. The website uses camelCase. This accepts either. */
export function normalizeCar(c) {
  return {
    id: c.id,
    name: c.name,
    model: c.model,
    category: c.category,
    year: c.year,
    seats: c.seats,
    transmission: c.transmission,
    fuel: c.fuel,
    pricePerDay: Number(c.pricePerDay ?? c.price_per_day),
    image: c.image,
    description: c.description || "",
    features: Array.isArray(c.features) ? c.features : [],
  };
}

export const categoriesOf = (cars) => ["All", ...new Set(cars.map((c) => c.category))];

/** Filter + sort. filters: { q, category, maxPrice, sort: "featured" | "price_asc" | "price_desc" } */
export function filterCars(cars, { q = "", category = "All", maxPrice = null, sort = "featured" } = {}) {
  const needle = q.trim().toLowerCase();
  let out = cars.filter((c) => {
    if (needle && !`${c.name} ${c.model} ${c.category}`.toLowerCase().includes(needle)) return false;
    if (category !== "All" && c.category !== category) return false;
    if (maxPrice != null && maxPrice !== "" && c.pricePerDay > Number(maxPrice)) return false;
    return true;
  });
  if (sort === "price_asc") out = [...out].sort((a, b) => a.pricePerDay - b.pricePerDay);
  if (sort === "price_desc") out = [...out].sort((a, b) => b.pricePerDay - a.pricePerDay);
  return out;
}
