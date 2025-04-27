"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { BeamsBackground } from "@/components/ui/beams-background";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Button } from "@/components/ui/Button";
import { db } from "@/firebase/config";
import { doc, getDoc } from "firebase/firestore";

export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState<any>(null);

  // Estado para controlar acordeão de perguntas
  const [openQA, setOpenQA] = useState<{ [key: string]: number | null }>({ user1: null, user2: null });

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError("");
    setReport(null);
    getDoc(doc(db, "reports", id))
      .then((snap) => {
        if (snap.exists()) {
          setReport(snap.data());
        } else {
          setError("Relatório não encontrado.");
        }
      })
      .catch(() => setError("Erro ao buscar relatório."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <BeamsBackground>
        <div className="min-h-screen flex flex-col items-center justify-center">
          <LoadingSpinner size={48} />
          <p className="mt-4 text-blue-700 font-semibold">Carregando relatório...</p>
        </div>
      </BeamsBackground>
    );
  }

  if (error) {
    return (
      <BeamsBackground>
        <div className="min-h-screen flex flex-col items-center justify-center">
          <p className="text-red-700 font-bold">{error}</p>
        </div>
      </BeamsBackground>
    );
  }

  if (!report) {
    return (
      <BeamsBackground>
        <div className="min-h-screen flex flex-col items-center justify-center">
          <p className="text-gray-700 font-semibold">Relatório não encontrado.</p>
        </div>
      </BeamsBackground>
    );
  }

  return (
    <BeamsBackground>
      <div className="min-h-screen flex flex-col items-center justify-center px-2 py-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, type: "spring" }}
          className="w-full max-w-2xl bg-white/95 rounded-3xl shadow-2xl p-8 flex flex-col items-center relative"
        >
          <h2 className="text-3xl font-extrabold text-blue-700 mb-2 text-center drop-shadow">Relatório Final</h2>
          <h3 className="text-lg font-bold text-gray-700 mb-6 text-center">{report.dilemmaTitle}</h3>

          {/* Participantes */}
          <div className="flex flex-col sm:flex-row gap-6 w-full mb-8">
            {[report.user1, report.user2].map((user: any, idx: number) => (
              <motion.div
                key={user.name}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 + idx * 0.1 }}
                className="flex-1 bg-blue-50 rounded-2xl p-4 shadow flex flex-col items-center"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-700 flex items-center justify-center text-white text-2xl font-bold mb-2 shadow-lg">
                  {user.name[0]}
                </div>
                <div className="font-bold text-blue-900 text-lg mb-1">{user.name}</div>
                <div className="text-gray-600 text-sm text-center">{user.intro}</div>
              </motion.div>
            ))}
          </div>

          {/* Análise */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="w-full bg-gray-50 rounded-xl p-6 mb-8 shadow"
          >
            <h4 className="text-xl font-bold text-blue-800 mb-2">Resumo da Análise</h4>
            <p className="text-gray-800 mb-4">{report.analysis.summary}</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <h5 className="font-bold text-green-700 mb-1">Acordos</h5>
                <ul className="list-disc ml-5 text-green-800 text-sm">
                  {report.analysis.agreements.map((a: string, i: number) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>
              <div className="flex-1">
                <h5 className="font-bold text-red-700 mb-1">Conflitos</h5>
                <ul className="list-disc ml-5 text-red-800 text-sm">
                  {report.analysis.conflicts.map((c: string, i: number) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-4">
              <h5 className="font-bold text-blue-700 mb-1">Padrões</h5>
              <ul className="list-disc ml-5 text-blue-800 text-sm">
                {report.analysis.patterns.map((p: string, i: number) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
            <div className="mt-4">
              <h5 className="font-bold text-purple-700 mb-1">Insights</h5>
              <ul className="list-disc ml-5 text-purple-800 text-sm">
                {report.analysis.insights.map((ins: string, i: number) => (
                  <li key={i}>{ins}</li>
                ))}
              </ul>
            </div>
            <div className="mt-6 bg-gradient-to-r from-blue-200 to-blue-100 rounded-lg p-4 shadow-inner">
              <span className="block text-lg font-bold text-blue-900 mb-1">Recomendação Final</span>
              <span className="text-blue-800 font-semibold">{report.analysis.finalRecommendation}</span>
            </div>
          </motion.div>

          {/* Perguntas e respostas em acordeão */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="w-full"
          >
            <h4 className="text-xl font-bold text-gray-800 mb-4">Perguntas & Respostas</h4>
            <div className="flex flex-col gap-6">
              {[report.user1, report.user2].map((user: any, idx: number) => (
                <div key={user.name} className="bg-white rounded-xl shadow p-4">
                  <div className="font-bold text-blue-700 mb-2">{user.name}</div>
                  <ul className="flex flex-col gap-2">
                    {user.mainQuestions.map((q: string, i: number) => (
                      <li key={i} className="border-b last:border-b-0">
                        <button
                          className={`w-full text-left flex items-center justify-between py-3 px-2 focus:outline-none transition-colors ${openQA[user.name] === i ? "bg-blue-50" : "bg-white"}`}
                          aria-expanded={openQA[user.name] === i}
                          aria-controls={`answer-${user.name}-${i}`}
                          onClick={() => setOpenQA((prev) => ({ ...prev, [user.name]: prev[user.name] === i ? null : i }))}
                        >
                          <span className="font-semibold text-gray-700 flex-1">{i + 1}. {q}</span>
                          <motion.span
                            animate={{ rotate: openQA[user.name] === i ? 90 : 0 }}
                            className="ml-2 text-blue-600"
                          >
                            ▶
                          </motion.span>
                        </button>
                        <motion.div
                          id={`answer-${user.name}-${i}`}
                          initial={false}
                          animate={{ height: openQA[user.name] === i ? "auto" : 0, opacity: openQA[user.name] === i ? 1 : 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          {openQA[user.name] === i && (
                            <div className="p-3 text-gray-800 bg-blue-50 rounded-b-xl border-t border-blue-100 animate-fade-in">
                              <span className="block text-sm font-bold text-blue-700 mb-1">Resposta:</span>
                              <span className="text-base">{user.mainAnswers[i]}</span>
                            </div>
                          )}
                        </motion.div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </motion.div>

          <Button className="mt-8 w-full font-bold" variant="primary" onClick={() => window.location.href = "/"}>
            Voltar para o início
          </Button>
        </motion.div>
      </div>
    </BeamsBackground>
  );
} 