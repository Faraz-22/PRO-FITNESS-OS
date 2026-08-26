export default function PrintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="print-layout min-h-screen bg-white text-black">
      {children}
    </div>
  );
}
