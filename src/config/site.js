// Central place for brand details. Change here and the whole site updates.
export const site = {
  name: "DriveElite",
  tagline: "Premium car rental. Drive the extraordinary.",
  phone: "+1 (555) 000-0000",
  email: "hello@example.com",
  address: "123 Main Street, Your City",
  // Your uploaded photos live in public/images (see cars.js for the individual cars).
  heroImage: "/images/hero.png",
  showroomImage: "/images/showroom.png",
  // Suggestions shown in the booking form's pickup location field (customers can type their own).
  pickupLocations: ["Main Office", "Airport Terminal", "City Center", "Hotel delivery"],
};

export const navLinks = [
  { label: "Home", to: "/" },
  { label: "Cars", to: "/cars" },
  { label: "Services", to: "/services" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
];
