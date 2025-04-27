import { BeamsBackground } from "@/components/ui/beams-background";
import Link from "next/link";

export default function NotFound() {
  return (
    <BeamsBackground>
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="w-full max-w-md bg-white/90 rounded-3xl shadow-2xl p-8 flex flex-col items-center relative">
          <h1 className="text-4xl font-extrabold text-red-600 mb-4 text-center">Erro 404</h1>
          <p className="text-gray-700 text-center mb-6 text-lg font-semibold">Sala não encontrada ou acesso inválido.</p>
          <Link href="/" className="mt-2 w-full">
            <button className="w-full px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg transition text-lg">Voltar para a home</button>
          </Link>
        </div>
      </div>
    </BeamsBackground>
  );
} 