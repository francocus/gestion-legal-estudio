import { IaRealComparator } from "@/components/ia-real-comparator"; // OJO EL CAMBIO ACÁ
export default function IaDemoPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* ... dejamos los títulos igual ... */}
      <IaRealComparator /> {/* Y ACÁ LLAMAMOS AL NUEVO COMPONENTE */}
    </div>
  );
}
