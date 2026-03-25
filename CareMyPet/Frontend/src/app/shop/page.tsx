// "use client";

// import { useMemo, useState } from "react";
// import { ProductCard } from "@/components/shop/ProductCard";
// import { Input } from "@/components/ui/Input";
// import { mockProducts } from "@/utils/mockData";

// export default function ShopPage() {
//   const [q, setQ] = useState("");
//   const [category, setCategory] = useState<string>("All");
//   const [petType, setPetType] = useState<string>("All");
//   const [maxPrice, setMaxPrice] = useState<number>(100);

//   const categories = useMemo(() => ["All", ...Array.from(new Set(mockProducts.map((p) => p.category)))], []);
//   const petTypes = useMemo(() => ["All", ...Array.from(new Set(mockProducts.map((p) => p.petType)))], []);

//   const filtered = useMemo(() => {
//     return mockProducts.filter((p) => {
//       const matchesQ = q.trim() ? p.name.toLowerCase().includes(q.trim().toLowerCase()) : true;
//       const matchesCat = category === "All" ? true : p.category === category;
//       const matchesPet = petType === "All" ? true : p.petType === petType;
//       const matchesPrice = p.price <= maxPrice;
//       return matchesQ && matchesCat && matchesPet && matchesPrice;
//     });
//   }, [category, maxPrice, petType, q]);

//   return (
//     <div className="mx-auto max-w-6xl px-4 py-10">
//       <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
//         <div>
//           <h1 className="text-2xl font-semibold text-ink-900">Pet Marketplace</h1>
//           <p className="mt-1 text-sm text-ink-700">Search, filter, and add items to your cart.</p>
//         </div>
//         <div className="w-full max-w-xl">
//           <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products..." />
//         </div>
//       </div>

//       <div className="mt-6 grid gap-4 rounded-2xl bg-white p-4 shadow-soft md:grid-cols-4">
//         <div>
//           <label className="text-xs font-semibold text-ink-700">Category</label>
//           <select
//             className="mt-2 h-11 w-full rounded-xl border border-ink-200 bg-white px-3 text-sm"
//             value={category}
//             onChange={(e) => setCategory(e.target.value)}
//           >
//             {categories.map((c) => (
//               <option key={c} value={c}>
//                 {c}
//               </option>
//             ))}
//           </select>
//         </div>
//         <div>
//           <label className="text-xs font-semibold text-ink-700">Pet type</label>
//           <select
//             className="mt-2 h-11 w-full rounded-xl border border-ink-200 bg-white px-3 text-sm"
//             value={petType}
//             onChange={(e) => setPetType(e.target.value)}
//           >
//             {petTypes.map((p) => (
//               <option key={p} value={p}>
//                 {p}
//               </option>
//             ))}
//           </select>
//         </div>
//         <div className="md:col-span-2">
//           <label className="text-xs font-semibold text-ink-700">Max price: ${maxPrice}</label>
//           <input
//             type="range"
//             min={5}
//             max={100}
//             value={maxPrice}
//             onChange={(e) => setMaxPrice(Number(e.target.value))}
//             className="mt-4 w-full"
//           />
//         </div>
//       </div>

//       <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
//         {filtered.map((p) => (
//           <ProductCard key={p.id} product={p} />
//         ))}
//       </div>
//     </div>
//   );
// }











"use client";

import { useEffect, useMemo, useState } from "react";
import { ProductCard } from "@/components/shop/ProductCard";
import { Input } from "@/components/ui/Input";
import { productService } from "@/services/productService";
import type { Product } from "@/utils/types";
import { Loader } from "@/components/ui/Loader";

// INR formatter
function formatCurrencyINR(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount);
}

export default function ShopPage() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [petType, setPetType] = useState<string>("All");
  const [maxPrice, setMaxPrice] = useState<number>(5000);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await productService.list();
        setProducts(data);
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(products.map((p) => p.category)))],
    [products]
  );

  const petTypes = useMemo(
    () => ["All", ...Array.from(new Set(products.map((p) => p.petType)))],
    [products]
  );

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesQ = q.trim() ? p.name.toLowerCase().includes(q.trim().toLowerCase()) : true;
      const matchesCat = category === "All" ? true : p.category === category;
      const matchesPet = petType === "All" ? true : p.petType === petType;
      const matchesPrice = p.price <= maxPrice;

      return matchesQ && matchesCat && matchesPet && matchesPrice;
    });
  }, [q, category, petType, maxPrice, products]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Pet Marketplace</h1>
          <p className="mt-1 text-sm text-ink-700">Search, filter, and add items to your cart.</p>
        </div>
        <div className="w-full max-w-xl">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products..." />
        </div>
      </div>

      <div className="mt-6 grid gap-4 rounded-2xl bg-white p-4 shadow-soft md:grid-cols-4">
        <div>
          <label className="text-xs font-semibold text-ink-700">Category</label>
          <select
            className="mt-2 h-11 w-full rounded-xl border border-ink-200 bg-white px-3 text-sm"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-ink-700">Pet type</label>
          <select
            className="mt-2 h-11 w-full rounded-xl border border-ink-200 bg-white px-3 text-sm"
            value={petType}
            onChange={(e) => setPetType(e.target.value)}
          >
            {petTypes.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="text-xs font-semibold text-ink-700">
            Max price: {formatCurrencyINR(maxPrice)}
          </label>
          <input
            type="range"
            min={100}
            max={5000}
            step={100}
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            className="mt-4 w-full"
          />
        </div>
      </div>

      {loading ? (
        <div className="mt-10 flex justify-center">
          <Loader label="Loading products..." />
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
          {filtered.length === 0 ? <p className="text-sm text-ink-600">No products found.</p> : null}
        </div>
      )}
    </div>
  );
}
