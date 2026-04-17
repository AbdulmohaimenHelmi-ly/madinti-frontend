import VendorShellLayout from "@/components/vendor/VendorShellLayout";

export default function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <VendorShellLayout>{children}</VendorShellLayout>;
}
