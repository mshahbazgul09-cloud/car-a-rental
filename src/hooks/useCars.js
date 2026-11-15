import { useEffect, useState } from "react";
import { cars as mockCars } from "../data/cars.js";
import { getCars } from "../lib/api.js";
import { normalizeCar } from "../utils/carFilters.js";

// Cars come from the API. If the backend is offline the website falls back to the mock list in
// src/data/cars.js, so every page keeps working. Only a successful API response is cached.
let cache = null;
let inflight = null;

function load() {
  if (cache) return Promise.resolve(cache);
  if (!inflight) {
    inflight = getCars()
      .then((list) => (cache = { cars: list.map(normalizeCar), source: "api" }))
      .catch(() => ({ cars: mockCars.map(normalizeCar), source: "mock" }))
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

/** { cars, loading, source: "api" | "mock" | null } */
export default function useCars() {
  const [state, setState] = useState(() => (cache ? { ...cache, loading: false } : { cars: [], source: null, loading: true }));

  useEffect(() => {
    if (cache) return;
    let ignore = false;
    load().then((res) => !ignore && setState({ ...res, loading: false }));
    return () => {
      ignore = true;
    };
  }, []);

  return state;
}
