"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams, notFound } from "next/navigation";
import { onSnapshot, doc, collection, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase/config";
import { Avatar } from "@/components/ui/Avatar";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Toast } from "@/components/ui/Toast";
import { motion } from "framer-motion";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import Link from "next/link";
import { BeamsBackground } from "@/components/ui/beams-background";
import { QuestionFlow } from "@/components/QuestionFlow";
import { Button } from "@/components/ui/Button";
import { callN8nWebhook } from "@/lib/n8nApi";

export default function DilemmaPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = searchParams.get("user");
  if (user !== "user1" && user !== "user2") {
    notFound();
  }

  const [dilemma, setDilemma] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [name, setName] = useState("");
  const [intro, setIntro] = useState("");
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({ show: false, message: "", type: "success" });
  const [otherUserReady, setOtherUserReady] = useState(false);
  const [contextQuestions, setContextQuestions] = useState<string[] | null>(null);
  const [contextQuestionsLoading, setContextQuestionsLoading] = useState(false);

  // Estados para respostas de contexto (sempre no topo)
  const [answers, setAnswers] = useState<string[]>([]);
  const [sending, setSending] = useState<number | null>(null);
  const [answered, setAnswered] = useState<boolean[]>([]);

  // Estados para perguntas principais
  const [mainQuestions, setMainQuestions] = useState<string[] | null>(null);
  const [mainAnswers, setMainAnswers] = useState<string[]>([]);
  const [mainStep, setMainStep] = useState(0);
  const [mainLoading, setMainLoading] = useState(false);
  const [mainFinished, setMainFinished] = useState(false);
  const [mainTimer, setMainTimer] = useState(240); // 4 minutos em segundos
  const [mainInterval, setMainInterval] = useState<NodeJS.Timeout | null>(null);

  // Estado para o valor do input da pergunta atual
  const [mainInputValue, setMainInputValue] = useState("");

  // Sincroniza os estados quando contextQuestions mudar
  useEffect(() => {
    if (contextQuestions) {
      setAnswers(contextQuestions.map(() => ""));
      setAnswered(contextQuestions.map(() => false));
    }
  }, [contextQuestions]);

  // Buscar dados do dilema e do usuário
  useEffect(() => {
    if (!id || !user) return;
    setLoading(true);
    const unsubDilemma = onSnapshot(doc(db, "dilemmas", id), (snap) => {
      if (snap.exists()) {
        setDilemma({ id: snap.id, ...snap.data() });
      } else {
        notFound();
      }
      setLoading(false);
    });
    const unsubUser = onSnapshot(doc(db, `dilemmas/${id}/users/${user}`), (snap) => {
      setUserData(snap.exists() ? snap.data() : null);
    });
    // Verificar se o outro usuário já preencheu
    const other = user === "user1" ? "user2" : "user1";
    const unsubOther = onSnapshot(doc(db, `dilemmas/${id}/users/${other}`), (snap) => {
      setOtherUserReady(snap.exists());
    });
    return () => { unsubDilemma(); unsubUser(); unsubOther(); };
  }, [id, user]);

  // Listener para perguntas de contexto do usuário atual
  useEffect(() => {
    if (!id || !user) return;
    const unsub = onSnapshot(doc(db, `dilemmas/${id}/context_questions/${user}`), (snap) => {
      if (snap.exists()) {
        setContextQuestions(snap.data().perguntas || []);
      } else {
        setContextQuestions(null);
      }
    });
    return () => unsub();
  }, [id, user]);

  // Geração das perguntas de contexto (apenas user1)
  useEffect(() => {
    if (!dilemma || !userData || !otherUserReady) return;
    if (user !== "user1") return;
    if (dilemma.context_questions_generated) return;
    if (!dilemma.ready_for_context_questions) return;
    // Chamar n8n para gerar perguntas
    const generateQuestions = async () => {
      setContextQuestionsLoading(true);
      try {
        // Buscar dados dos dois usuários
        const user1Snap = await getDoc(doc(db, `dilemmas/${id}/users/user1`));
        const user2Snap = await getDoc(doc(db, `dilemmas/${id}/users/user2`));
        if (!user1Snap.exists() || !user2Snap.exists()) return;
        const payload = {
          roomId: id,
          dilemmaTitle: dilemma.title,
          user1: user1Snap.data(),
          user2: user2Snap.data(),
        };
        const result = await callN8nWebhook("gen-context-questions", payload);
        // Estrutura esperada: [{ user: "user1", perguntas: [...] }, { user: "user2", perguntas: [...] }]
        for (const q of result) {
          await setDoc(doc(db, `dilemmas/${id}/context_questions/${q.user}`), { perguntas: q.perguntas });
        }
        await setDoc(doc(db, "dilemmas", id), { context_questions_generated: true }, { merge: true });
      } catch (err) {
        setToast({ show: true, message: "Erro ao gerar perguntas de contexto.", type: "error" });
      } finally {
        setContextQuestionsLoading(false);
      }
    };
    generateQuestions();
  }, [dilemma, userData, otherUserReady, id, user]);

  // Detecta quando ambos responderam as perguntas de contexto e dispara geração das perguntas principais
  useEffect(() => {
    if (!id || !dilemma || !dilemma.title) return;
    if (dilemma.status === "generating_main_questions" || dilemma.status === "main_questions_ready" || dilemma.status === "generating_report" || dilemma.status === "finished") return;
    // Só user1 dispara para evitar duplicidade
    if (user !== "user1") return;

    let unsub1: any, unsub2: any;
    const checkAndGenerate = async () => {
      const user1Ref = doc(db, `dilemmas/${id}/context_questions/user1`);
      const user2Ref = doc(db, `dilemmas/${id}/context_questions/user2`);
      unsub1 = onSnapshot(user1Ref, async (snap1) => {
        const data1 = snap1.data();
        unsub2 = onSnapshot(user2Ref, async (snap2) => {
          const data2 = snap2.data();
          if (
            data1?.respostas?.length === 2 &&
            data2?.respostas?.length === 2 &&
            dilemma.status !== "generating_main_questions" &&
            dilemma.status !== "main_questions_ready"
          ) {
            // Atualiza status para evitar múltiplas chamadas
            await setDoc(doc(db, "dilemmas", id), { status: "generating_main_questions" }, { merge: true });
            // Monta payload para n8n
            const user1Snap = await getDoc(doc(db, `dilemmas/${id}/users/user1`));
            const user2Snap = await getDoc(doc(db, `dilemmas/${id}/users/user2`));
            const payload = {
              roomId: id,
              dilemmaTitle: dilemma.title,
              user1: {
                ...user1Snap.data(),
                context: { perguntas: data1.perguntas, respostas: data1.respostas }
              },
              user2: {
                ...user2Snap.data(),
                context: { perguntas: data2.perguntas, respostas: data2.respostas }
              }
            };
            try {
              const result = await callN8nWebhook("gen-principal-questions", payload);
              // Estrutura esperada: { user1: [...], user2: [...] }
              await setDoc(doc(db, `dilemmas/${id}/main_questions/user1`), { perguntas: result.user1 });
              await setDoc(doc(db, `dilemmas/${id}/main_questions/user2`), { perguntas: result.user2 });
              await setDoc(doc(db, "dilemmas", id), { status: "main_questions_ready" }, { merge: true });
            } catch (err) {
              // Em produção, pode logar erro ou mostrar toast
            }
          }
        });
      });
    };
    checkAndGenerate();
    return () => {
      if (unsub1) unsub1();
      if (unsub2) unsub2();
    };
  }, [id, dilemma, user]);

  // Utilitário para chave única no localStorage
  const getLocalKey = () => `dilemma_${id}_${user}_main`;

  // Buscar perguntas principais e respostas do localStorage quando status for main_questions_ready
  useEffect(() => {
    if (!id || !dilemma || dilemma.status !== "main_questions_ready") return;
    setMainLoading(true);
    const unsubQ = onSnapshot(doc(db, `dilemmas/${id}/main_questions/${user}`), (snapQ) => {
      if (snapQ.exists()) {
        const perguntas = snapQ.data().perguntas || [];
        setMainQuestions(perguntas);
        // Buscar respostas e passo do localStorage
        const local = typeof window !== "undefined" ? localStorage.getItem(getLocalKey()) : null;
        let respostas: string[] = [];
        let step = 0;
        if (local) {
          try {
            const parsed = JSON.parse(local);
            respostas = Array.isArray(parsed.respostas) ? parsed.respostas : [];
            step = typeof parsed.step === "number" ? parsed.step : 0;
          } catch {}
        }
        const respostasFull = Array.from({ length: perguntas.length }, (_, i) => respostas[i] || "");
        setMainAnswers(respostasFull);
        setMainStep(step);
        setMainFinished(respostasFull.filter(r => r && r !== "não respondida").length === perguntas.length);
        setMainTimer(240);
        setMainLoading(false);
      } else {
        setMainQuestions(null);
        setMainLoading(false);
      }
    });
    return () => unsubQ();
  }, [id, dilemma, user]);

  // Salvar respostas e passo no localStorage sempre que mainAnswers ou mainStep mudar
  useEffect(() => {
    if (!id || !user || !mainQuestions) return;
    if (typeof window === "undefined") return;
    localStorage.setItem(getLocalKey(), JSON.stringify({ respostas: mainAnswers, step: mainStep }));
  }, [mainAnswers, mainStep, id, user, mainQuestions]);

  // Timer regressivo para cada pergunta principal
  useEffect(() => {
    if (!mainQuestions || mainFinished) return;
    if (mainStep >= mainQuestions.length) return;
    setMainTimer(240);
    if (mainInterval) clearInterval(mainInterval);
    const interval = setInterval(() => {
      setMainTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleMainAnswerTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    setMainInterval(interval);
    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, [mainStep, mainQuestions]);

  // Sincronizar mainInputValue com a resposta da pergunta atual ao trocar de mainStep ou mainAnswers
  useEffect(() => {
    if (!mainQuestions) return;
    setMainInputValue(mainAnswers[mainStep] || "");
    // eslint-disable-next-line
  }, [mainStep, mainQuestions, mainAnswers]);

  // Função para salvar resposta (ou não respondida)
  const handleMainAnswer = async (answer: string) => {
    if (!mainQuestions) return;
    setMainLoading(true);
    const respostas = [...mainAnswers];
    respostas[mainStep] = answer;
    setMainAnswers(respostas);
    setMainLoading(false);
    if (mainStep < mainQuestions.length - 1) {
      setMainStep(mainStep + 1);
    } else {
      setMainFinished(true);
      if (mainInterval) clearInterval(mainInterval);
      // Ao finalizar, salva no Firestore e limpa localStorage
      await setDoc(doc(db, `dilemmas/${id}/main_answers/${user}`), {
        respostas
      }, { merge: true });
      if (typeof window !== "undefined") localStorage.removeItem(getLocalKey());
    }
  };

  // Função chamada quando o tempo acaba
  const handleMainAnswerTimeout = () => {
    handleMainAnswer("não respondida");
  };

  // Barra de progresso e cor do timer
  const getTimerColor = () => {
    if (mainTimer > 120) return "text-black";
    if (mainTimer > 60) return "text-orange-700";
    if (mainTimer > 30) return "text-red-500";
    return "text-red-700 font-bold animate-pulse";
  };

  // Submissão do formulário de entrada
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !intro.trim()) {
      setToast({ show: true, message: "Preencha todos os campos.", type: "error" });
      return;
    }
    setFormLoading(true);
    try {
      await setDoc(doc(db, `dilemmas/${id}/users/${user}`), {
        name,
        intro,
        joinedAt: serverTimestamp(),
      });
      // Se for user2, atualiza status da sala
      if (user === "user2") {
        await setDoc(doc(db, "dilemmas", id), { ready_for_context_questions: true, status: "waiting_for_context_answers" }, { merge: true });
      }
    } catch (err) {
      setToast({ show: true, message: "Erro ao salvar dados. Tente novamente.", type: "error" });
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <BeamsBackground>
        <div className="min-h-screen flex flex-col items-center justify-center">
          <LoadingSpinner size={48} />
        </div>
      </BeamsBackground>
    );
  }

  // Se o usuário ainda não preencheu os dados, mostra o formulário
  if (!userData) {
    return (
      <BeamsBackground>
        <div className="min-h-screen flex flex-col items-center justify-center">
          <Link href="/" className="mb-8 z-20">
            <img
              src="https://adapta-one-generated-images-prod.s3.sa-east-1.amazonaws.com/juan%40adapta.org%2Fe42c6a3b-cfe4-4c80-b0ef-d776bc3d4053%2F1745725344650.png"
              alt="Logo dilemma.ai"
              className="w-20 h-20 object-contain rounded-full shadow-lg border-4 border-white bg-white"
            />
          </Link>
          <div className="w-full max-w-2xl bg-white/90 rounded-3xl shadow-2xl p-8 flex flex-col items-center relative">
            <h2 className="text-2xl font-extrabold text-gray-800 mb-6 text-center">Entrar na sala</h2>
            <form className="w-full flex flex-col gap-4" onSubmit={handleSubmit} autoComplete="off">
              <div>
                <label htmlFor="name" className="block text-sm font-bold text-gray-700 mb-1">Seu nome</label>
                <input
                  id="name"
                  type="text"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:outline-none text-gray-800 bg-white shadow-sm transition"
                  placeholder="Digite seu nome"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  maxLength={32}
                  required
                />
              </div>
              <div>
                <label htmlFor="intro" className="block text-sm font-bold text-gray-700 mb-1">O que eu preciso saber sobre você ou seus pensamentos para te ajudar neste dilema?</label>
                <textarea
                  id="intro"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:outline-none text-gray-800 bg-white shadow-sm transition min-h-[60px] resize-none"
                  placeholder="Conte um pouco sobre você ou sua visão inicial..."
                  value={intro}
                  onChange={e => setIntro(e.target.value)}
                  maxLength={300}
                  required
                />
              </div>
              <Button type="submit" loading={formLoading} className="mt-2 w-full text-lg font-bold shadow-lg" variant="primary">
                Entrar
              </Button>
            </form>
            <Toast
              show={toast.show}
              message={toast.message}
              type={toast.type}
              onClose={() => setToast({ ...toast, show: false })}
            />
          </div>
        </div>
      </BeamsBackground>
    );
  }

  // Se já preencheu, mostra mensagem de aguardo
  if (contextQuestionsLoading) {
    return (
      <BeamsBackground>
        <div className="min-h-screen flex flex-col items-center justify-center">
          <LoadingSpinner size={48} />
          <p className="mt-4 text-blue-700 font-semibold">Gerando perguntas de contexto...</p>
        </div>
      </BeamsBackground>
    );
  }
  if (contextQuestions && dilemma?.status !== "main_questions_ready") {
    // Função para enviar todas as respostas de uma vez
    const handleSendAllAnswers = async () => {
      if (answers.some(a => !a.trim())) {
        setToast({ show: true, message: "Responda todas as perguntas antes de enviar.", type: "error" });
        return;
      }
      setSending(0); // Usado como flag de loading
      try {
        // Atualiza o documento de context_questions/{user} com as respostas
        await setDoc(
          doc(db, `dilemmas/${id}/context_questions/${user}`),
          {
            perguntas: contextQuestions,
            respostas: answers,
          },
          { merge: true }
        );
        setAnswered(answers.map(() => true));
        setToast({ show: true, message: "Respostas enviadas! Aguarde o próximo passo...", type: "success" });
      } catch (err) {
        setToast({ show: true, message: "Erro ao enviar respostas.", type: "error" });
      } finally {
        setSending(null);
      }
    };

    const allFilled = answers.length > 0 && answers.every(a => a.trim().length > 0);
    const allAnswered = answered.length > 0 && answered.every(Boolean);

    // Loading aguardando próxima etapa após envio
    if (allAnswered) {
      return (
        <BeamsBackground>
          <div className="min-h-screen flex flex-col items-center justify-center">
            <LoadingSpinner size={48} />
            <p className="mt-4 text-blue-700 font-semibold">Aguardando o próximo passo...</p>
            <Toast
              show={toast.show}
              message={toast.message}
              type={toast.type}
              onClose={() => setToast({ ...toast, show: false })}
            />
          </div>
        </BeamsBackground>
      );
    }

    return (
      <BeamsBackground>
        <div className="min-h-screen flex flex-col items-center justify-center">
          <div className="w-full max-w-2xl bg-white/90 rounded-3xl shadow-2xl p-8 flex flex-col items-center relative">
            <h2 className="text-2xl font-extrabold text-gray-800 mb-6 text-center">Responda as perguntas de contexto</h2>
            <ul className="w-full flex flex-col gap-8">
              {contextQuestions.map((q, i) => (
                <li key={i} className="w-full">
                  <div className="font-bold text-gray-700 mb-2">{q}</div>
                  <textarea
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:outline-none text-gray-800 bg-white shadow-sm transition min-h-[60px] resize-none"
                    placeholder="Digite sua resposta..."
                    value={answers[i]}
                    onChange={e => {
                      const arr = [...answers];
                      arr[i] = e.target.value;
                      setAnswers(arr);
                    }}
                    maxLength={400}
                    disabled={allAnswered || sending !== null}
                  />
                </li>
              ))}
            </ul>
            <Button
              className="mt-8 w-full font-bold"
              variant="primary"
              type="button"
              loading={sending !== null}
              disabled={!allFilled || allAnswered || sending !== null}
              onClick={handleSendAllAnswers}
            >
              Enviar respostas
            </Button>
            <Toast
              show={toast.show}
              message={toast.message}
              type={toast.type}
              onClose={() => setToast({ ...toast, show: false })}
            />
          </div>
        </div>
      </BeamsBackground>
    );
  }

  // Fluxo das 13 perguntas principais TEM PRIORIDADE
  if (dilemma?.status === "main_questions_ready") {
    if (mainLoading) {
      return (
        <BeamsBackground>
          <div className="min-h-screen flex flex-col items-center justify-center">
            <LoadingSpinner size={48} />
            <p className="mt-4 text-blue-700 font-semibold">Carregando perguntas principais...</p>
          </div>
        </BeamsBackground>
      );
    }
    if (!mainQuestions || mainQuestions.length === 0) {
      return (
        <BeamsBackground>
          <div className="min-h-screen flex flex-col items-center justify-center">
            <p className="text-red-700 font-bold">Erro: Nenhuma pergunta principal encontrada para este usuário.</p>
          </div>
        </BeamsBackground>
      );
    }
    if (mainFinished) {
      return (
        <BeamsBackground>
          <div className="min-h-screen flex flex-col items-center justify-center">
            <LoadingSpinner size={48} />
            <p className="mt-4 text-blue-700 font-semibold">Aguardando o outro participante finalizar...</p>
          </div>
        </BeamsBackground>
      );
    }
    return (
      <BeamsBackground>
        <div className="min-h-screen flex flex-col items-center justify-center">
          <div className="w-full max-w-2xl bg-white/90 rounded-3xl shadow-2xl p-8 flex flex-col items-center relative">
            <div className="w-full flex flex-col items-center mb-6">
              <ProgressBar value={((mainStep + 1) / mainQuestions.length) * 100}>
                <span className="text-base font-bold tracking-wide drop-shadow">
                  {mainStep + 1} / {mainQuestions.length}
                </span>
              </ProgressBar>
              <div className="flex justify-between w-full mt-2">
                <span className="text-xs text-gray-500">Pergunta {mainStep + 1} de {mainQuestions.length}</span>
                <span className={`text-xs ${getTimerColor()}`}>{Math.floor(mainTimer / 60)}:{(mainTimer % 60).toString().padStart(2, "0")}</span>
              </div>
            </div>
            <h2 className="text-xl font-extrabold text-gray-800 mb-4 text-center">{mainQuestions[mainStep]}</h2>
            <form className="w-full flex flex-col gap-4" onSubmit={e => { e.preventDefault(); handleMainAnswer(mainInputValue); }}>
              <textarea
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:outline-none text-gray-800 bg-white shadow-sm transition min-h-[80px] resize-none"
                placeholder="Digite sua resposta..."
                value={mainInputValue}
                onChange={e => setMainInputValue(e.target.value)}
                maxLength={400}
                disabled={mainLoading}
                required
              />
              <div className="flex w-full gap-2">
                {mainStep > 0 && (
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-1/3 font-bold"
                    onClick={() => setMainStep(mainStep - 1)}
                    disabled={mainLoading}
                  >
                    Voltar
                  </Button>
                )}
                <Button type="submit" loading={mainLoading} className="w-full font-bold" variant="primary">
                  {mainStep < mainQuestions.length - 1 ? "Próxima" : "Finalizar"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </BeamsBackground>
    );
  }

  return (
    <BeamsBackground>
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Link href="/" className="mb-8 z-20">
          <img
            src="https://adapta-one-generated-images-prod.s3.sa-east-1.amazonaws.com/juan%40adapta.org%2Fe42c6a3b-cfe4-4c80-b0ef-d776bc3d4053%2F1745725344650.png"
            alt="Logo dilemma.ai"
            className="w-20 h-20 object-contain rounded-full shadow-lg border-4 border-white bg-white"
          />
        </Link>
        <div className="w-full max-w-2xl bg-white/90 rounded-3xl shadow-2xl p-8 flex flex-col items-center relative">
          <h2 className="text-2xl font-extrabold text-gray-800 mb-4 text-center">Aguardando o outro participante...</h2>
          <p className="text-gray-700 text-center mb-2">Assim que ambos preencherem os dados iniciais, as perguntas de contexto serão geradas automaticamente.</p>
          {!otherUserReady && <p className="text-blue-600 text-center font-semibold">Aguardando o outro participante entrar...</p>}
        </div>
      </div>
    </BeamsBackground>
  );
} 