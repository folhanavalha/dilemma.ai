import { db } from "./config";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  CollectionReference,
  DocumentReference,
} from "firebase/firestore";

// Referência para coleção de dilemas
export const dilemmasCollection = collection(db, "dilemmas");

// Referência para subcoleção de respostas de um usuário
export function answersSubcollection(dilemmaId: string, user: "user1" | "user2") {
  return collection(db, `dilemmas/${dilemmaId}/answers_${user}`);
}

// Referência para coleção de relatórios
export const reportsCollection = collection(db, "reports");

// Helper para criar um novo dilema
export async function createDilemma(data: any) {
  const docRef = await addDoc(dilemmasCollection, {
    ...data,
    createdAt: serverTimestamp(),
    currentStep: 0,
  });
  return docRef.id;
}

// Helper para buscar um dilema por ID
export async function getDilemmaById(id: string) {
  const docRef = doc(dilemmasCollection, id);
  const snap = await getDoc(docRef);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// Helper para criar resposta de usuário
export async function addUserAnswer(dilemmaId: string, user: "user1" | "user2", data: any) {
  const subCol = answersSubcollection(dilemmaId, user);
  return await addDoc(subCol, {
    ...data,
    createdAt: serverTimestamp(),
  });
}

// Helper para criar relatório
export async function createReport(data: any) {
  return await addDoc(reportsCollection, {
    ...data,
    createdAt: serverTimestamp(),
  });
} 