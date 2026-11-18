// Central place for brand details. Change here and the whole site updates.
export const site = {
  name: "BI Taxi West Chester",
  tagline: "Premium car rental. Drive the extraordinary.",
  phone: "(513) 771-4633",
  phoneHref: "tel:+15137714633", // used by every "call" link
  email: "bohmlimo@hotmail.com",
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
