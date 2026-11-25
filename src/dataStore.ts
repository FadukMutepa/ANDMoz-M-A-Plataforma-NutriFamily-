import { deleteDoc, doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { buildLocalDemoSeed, resetFirebaseWorkspaceToSeed } from './seedData';
import type {
  Activity,
  AppSessionUser,
  Family,
  Goal,
  Multiplier,
  ReportDocument,
} from './types';

export interface DemoStoreState {
  goals: Goal[];
  families: Family[];
  multipliers: Multiplier[];
  activities: Activity[];
  documents: ReportDocument[];
}

const DEMO_STORE_KEY = 'andmoz_nutrifamily_demo_store_v3';

export function loadDemoStore(): DemoStoreState {
  try {
    const raw = localStorage.getItem(DEMO_STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<DemoStoreState>;
      if (
        Array.isArray(parsed.goals) &&
        Array.isArray(parsed.families) &&
        Array.isArray(parsed.multipliers) &&
        Array.isArray(parsed.activities) &&
        Array.isArray(parsed.documents)
      ) {
        return parsed as DemoStoreState;
      }
    }
  } catch {
    // fallback to fresh seed
  }
  const fresh = buildLocalDemoSeed('demo_shared');
  saveDemoStore(fresh);
  return fresh;
}

export function saveDemoStore(state: DemoStoreState): void {
  try {
    localStorage.setItem(DEMO_STORE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage quota errors
  }
}

export function createDemoSessionId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export async function saveGoalRecord(
  user: AppSessionUser,
  payload: Omit<Goal, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>,
  existingId: string | null,
  onDemoChange: (updater: (prev: DemoStoreState) => DemoStoreState) => void
): Promise<void> {
  if (user.authMode === 'demo') {
    onDemoChange((prev) => {
      if (existingId) {
        return {
          ...prev,
          goals: prev.goals.map((g) => (g.id === existingId ? { ...g, ...payload } : g)),
        };
      }
      const newItem: Goal = {
        id: `demo_goal_${createDemoSessionId()}`,
        ownerId: user.uid,
        ...payload,
      };
      return { ...prev, goals: [...prev.goals, newItem] };
    });
    return;
  }

  try {
    if (existingId) {
      await updateDoc(doc(db, 'goals', existingId), {
        ...payload,
        updatedAt: serverTimestamp(),
      });
    } else {
      const docId = `${user.uid}_goal_${Date.now()}`;
      await setDoc(doc(db, 'goals', docId), {
        ownerId: user.uid,
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(
      error,
      existingId ? OperationType.UPDATE : OperationType.CREATE,
      existingId ? `goals/${existingId}` : 'goals'
    );
  }
}

export async function removeGoalRecord(
  user: AppSessionUser,
  goalId: string,
  onDemoChange: (updater: (prev: DemoStoreState) => DemoStoreState) => void
): Promise<void> {
  if (user.authMode === 'demo') {
    onDemoChange((prev) => ({
      ...prev,
      goals: prev.goals.filter((g) => g.id !== goalId),
    }));
    return;
  }
  try {
    await deleteDoc(doc(db, 'goals', goalId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `goals/${goalId}`);
  }
}

export async function saveFamilyRecord(
  user: AppSessionUser,
  payload: Omit<Family, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>,
  existingId: string | null,
  onDemoChange: (updater: (prev: DemoStoreState) => DemoStoreState) => void
): Promise<void> {
  if (user.authMode === 'demo') {
    onDemoChange((prev) => {
      if (existingId) {
        return {
          ...prev,
          families: prev.families.map((f) => (f.id === existingId ? { ...f, ...payload } : f)),
        };
      }
      const newItem: Family = {
        id: `demo_fam_${createDemoSessionId()}`,
        ownerId: user.uid,
        ...payload,
      };
      return { ...prev, families: [newItem, ...prev.families] };
    });
    return;
  }

  try {
    if (existingId) {
      await updateDoc(doc(db, 'families', existingId), {
        ...payload,
        updatedAt: serverTimestamp(),
      });
    } else {
      const docId = `${user.uid}_fam_${Date.now()}`;
      await setDoc(doc(db, 'families', docId), {
        ownerId: user.uid,
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(
      error,
      existingId ? OperationType.UPDATE : OperationType.CREATE,
      existingId ? `families/${existingId}` : 'families'
    );
  }
}

export async function removeFamilyRecord(
  user: AppSessionUser,
  familyId: string,
  onDemoChange: (updater: (prev: DemoStoreState) => DemoStoreState) => void
): Promise<void> {
  if (user.authMode === 'demo') {
    onDemoChange((prev) => ({
      ...prev,
      families: prev.families.filter((f) => f.id !== familyId),
    }));
    return;
  }
  try {
    await deleteDoc(doc(db, 'families', familyId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `families/${familyId}`);
  }
}

export async function saveMultiplierRecord(
  user: AppSessionUser,
  payload: Omit<Multiplier, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>,
  existingId: string | null,
  onDemoChange: (updater: (prev: DemoStoreState) => DemoStoreState) => void
): Promise<void> {
  if (user.authMode === 'demo') {
    onDemoChange((prev) => {
      if (existingId) {
        return {
          ...prev,
          multipliers: prev.multipliers.map((m) =>
            m.id === existingId ? { ...m, ...payload } : m
          ),
        };
      }
      const newItem: Multiplier = {
        id: `demo_mult_${createDemoSessionId()}`,
        ownerId: user.uid,
        ...payload,
      };
      return { ...prev, multipliers: [newItem, ...prev.multipliers] };
    });
    return;
  }

  try {
    if (existingId) {
      await updateDoc(doc(db, 'multipliers', existingId), {
        ...payload,
        updatedAt: serverTimestamp(),
      });
    } else {
      const docId = `${user.uid}_mult_${Date.now()}`;
      await setDoc(doc(db, 'multipliers', docId), {
        ownerId: user.uid,
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(
      error,
      existingId ? OperationType.UPDATE : OperationType.CREATE,
      existingId ? `multipliers/${existingId}` : 'multipliers'
    );
  }
}

export async function removeMultiplierRecord(
  user: AppSessionUser,
  multiplierId: string,
  onDemoChange: (updater: (prev: DemoStoreState) => DemoStoreState) => void
): Promise<void> {
  if (user.authMode === 'demo') {
    onDemoChange((prev) => ({
      ...prev,
      multipliers: prev.multipliers.filter((m) => m.id !== multiplierId),
    }));
    return;
  }
  try {
    await deleteDoc(doc(db, 'multipliers', multiplierId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `multipliers/${multiplierId}`);
  }
}

export async function saveActivityRecord(
  user: AppSessionUser,
  payload: Omit<Activity, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>,
  existingId: string | null,
  onDemoChange: (updater: (prev: DemoStoreState) => DemoStoreState) => void
): Promise<void> {
  if (user.authMode === 'demo') {
    onDemoChange((prev) => {
      if (existingId) {
        return {
          ...prev,
          activities: prev.activities.map((a) =>
            a.id === existingId ? { ...a, ...payload } : a
          ),
        };
      }
      const newItem: Activity = {
        id: `demo_act_${createDemoSessionId()}`,
        ownerId: user.uid,
        ...payload,
      };
      return { ...prev, activities: [newItem, ...prev.activities] };
    });
    return;
  }

  try {
    if (existingId) {
      await updateDoc(doc(db, 'activities', existingId), {
        ...payload,
        updatedAt: serverTimestamp(),
      });
    } else {
      const docId = `${user.uid}_act_${Date.now()}`;
      await setDoc(doc(db, 'activities', docId), {
        ownerId: user.uid,
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(
      error,
      existingId ? OperationType.UPDATE : OperationType.CREATE,
      existingId ? `activities/${existingId}` : 'activities'
    );
  }
}

export async function removeActivityRecord(
  user: AppSessionUser,
  activityId: string,
  onDemoChange: (updater: (prev: DemoStoreState) => DemoStoreState) => void
): Promise<void> {
  if (user.authMode === 'demo') {
    onDemoChange((prev) => ({
      ...prev,
      activities: prev.activities.filter((a) => a.id !== activityId),
    }));
    return;
  }
  try {
    await deleteDoc(doc(db, 'activities', activityId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `activities/${activityId}`);
  }
}

export async function createDocumentRecord(
  user: AppSessionUser,
  payload: Omit<ReportDocument, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>,
  onDemoChange: (updater: (prev: DemoStoreState) => DemoStoreState) => void
): Promise<void> {
  if (user.authMode === 'demo') {
    onDemoChange((prev) => {
      const newItem: ReportDocument = {
        id: `demo_doc_${createDemoSessionId()}`,
        ownerId: user.uid,
        ...payload,
      };
      return { ...prev, documents: [newItem, ...prev.documents] };
    });
    return;
  }

  try {
    const docId = `${user.uid}_doc_${Date.now()}`;
    await setDoc(doc(db, 'documents', docId), {
      ownerId: user.uid,
      ...payload,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'documents');
  }
}

export async function updateDocumentStatus(
  user: AppSessionUser,
  docId: string,
  status: ReportDocument['status'],
  notes: string,
  onDemoChange: (updater: (prev: DemoStoreState) => DemoStoreState) => void
): Promise<void> {
  if (user.authMode === 'demo') {
    onDemoChange((prev) => ({
      ...prev,
      documents: prev.documents.map((d) => (d.id === docId ? { ...d, status, notes } : d)),
    }));
    return;
  }

  try {
    await updateDoc(doc(db, 'documents', docId), {
      status,
      notes,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `documents/${docId}`);
  }
}

export async function removeDocumentRecord(
  user: AppSessionUser,
  docId: string,
  onDemoChange: (updater: (prev: DemoStoreState) => DemoStoreState) => void
): Promise<void> {
  if (user.authMode === 'demo') {
    onDemoChange((prev) => ({
      ...prev,
      documents: prev.documents.filter((d) => d.id !== docId),
    }));
    return;
  }
  try {
    await deleteDoc(doc(db, 'documents', docId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `documents/${docId}`);
  }
}

export async function resetWorkspaceToSeed(
  user: AppSessionUser,
  onDemoChange: (updater: (prev: DemoStoreState) => DemoStoreState) => void
): Promise<void> {
  const freshSeed = buildLocalDemoSeed('demo_shared');
  saveDemoStore(freshSeed);
  onDemoChange(() => freshSeed);

  if (user.authMode === 'firebase') {
    await resetFirebaseWorkspaceToSeed(user.uid);
  }
}
