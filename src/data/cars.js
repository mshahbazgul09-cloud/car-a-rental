// MOCK car data. Used when the backend API is offline, and kept in step with backend/app/repositories/memory.py.
// Names, years, prices and features are SAMPLE values: edit them to match your real cars.
// To add a car: put its photo in public/images/cars/ and add an entry here (and in memory.py).
export const currency = "$";

export const cars = [
  {
    id: "car-1",
    name: "Mercedes-Benz",
    model: "S-Class",
    category: "Luxury",
    year: 2024,
    seats: 5,
    transmission: "Automatic",
    fuel: "Petrol",
    pricePerDay: 250,
    image: "/images/cars/mercedes-s-class.png",
    description: "Flagship comfort with a hand-finished interior and effortless power.",
    features: ["Leather seats", "Panoramic roof", "Massage seats", "Premium sound"],
  },
  {
    id: "car-2",
    name: "Audi",
    model: "e-tron GT",
    category: "Electric",
    year: 2024,
    seats: 5,
    transmission: "Automatic",
    fuel: "Electric",
    pricePerDay: 260,
    image: "/images/cars/audi-e-tron-gt.png",
    description: "A silent electric grand tourer with supercar pace and striking lines.",
    features: ["Fast charging", "Matrix LED lights", "Virtual cockpit", "Premium sound"],
  },
  {
    id: "car-3",
    name: "Mercedes-Benz",
    model: "EQS",
    category: "Electric",
    year: 2024,
    seats: 5,
    transmission: "Automatic",
    fuel: "Electric",
    pricePerDay: 280,
    image: "/images/cars/mercedes-eqs.png",
    description: "Electric luxury with a calm, spacious cabin and a long range.",
    features: ["Long range", "Air suspension", "Hyperscreen", "Heated seats"],
  },
];
