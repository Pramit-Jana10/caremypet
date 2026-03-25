// import nextDynamic from "next/dynamic";

// const VetDetailPageClient = nextDynamic(
//   () =>
//     import("./client").then((mod) => ({
//       default: mod.VetDetailPageClient,
//     })),
//   {
//     ssr: false,
//   },
// );

// export default function VetDetailPage() {
//   return <VetDetailPageClient />;
// }

export const dynamicParams = true;

import nextDynamic from "next/dynamic";

const VetDetailPageClient = nextDynamic(
  () =>
    import("./client").then((mod) => ({
      default: mod.VetDetailPageClient,
    })),
  {
    ssr: false,
  },
);

export default function VetDetailPage() {
  return <VetDetailPageClient />;
}