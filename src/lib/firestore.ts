import { db } from "./firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, where, Timestamp, setDoc, writeBatch } from "firebase/firestore";

export interface Prompt {
    id?: string;
    originalText: string;
    tags: string[];
    meta: {
        action?: string;
        place?: string;
        clothes?: string;
        pose?: string;
        lighting?: string;
        art_style?: string;
        [key: string]: any;
    };
    sampleDescription?: string;
    createdAt: Date;
    userId: string; // New field for user ownership
}

const COLLECTION_NAME = "prompts";

export const FirestoreService = {
    // Add a new prompt
    async addPrompt(prompt: Omit<Prompt, "id">) {
        try {
            const docRef = await addDoc(collection(db, COLLECTION_NAME), {
                ...prompt,
                createdAt: Timestamp.fromDate(prompt.createdAt)
            });
            return docRef.id;
        } catch (e) {
            console.error("Error adding document: ", e);
            throw e;
        }
    },

    // Get all prompts for a specific user
    async getPrompts(userId: string) {
        try {
            const q = query(
                collection(db, COLLECTION_NAME),
                where("userId", "==", userId)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt.toDate()
            }))
                .sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime()) as Prompt[];
        } catch (e) {
            console.error("Error getting documents: ", e);
            return [];
        }
    },

    // Delete a prompt
    async deletePrompt(id: string) {
        try {
            await deleteDoc(doc(db, COLLECTION_NAME, id));
        } catch (e) {
            console.error("Error deleting document: ", e);
            throw e;
        }
    },

    // Update a prompt
    async updatePrompt(id: string, data: Partial<Prompt>) {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await setDoc(docRef, data, { merge: true });
        } catch (e) {
            console.error("Error updating document: ", e);
            throw e;
        }
    },

    // Bulk add prompts (Batching + Deduplication)
    async bulkAddPrompts(prompts: Omit<Prompt, "id">[]) {
        // Firestore batch limit is 500
        const chunkSize = 500;
        const chunks = [];

        for (let i = 0; i < prompts.length; i += chunkSize) {
            chunks.push(prompts.slice(i, i + chunkSize));
        }

        const allIds: string[] = [];

        for (const chunk of chunks) {
            const batch = writeBatch(db);

            chunk.forEach(prompt => {
                // Generate deterministic ID
                const cleanText = prompt.originalText.trim().toLowerCase();
                let hash = 0;
                for (let i = 0; i < cleanText.length; i++) {
                    const char = cleanText.charCodeAt(i);
                    hash = ((hash << 5) - hash) + char;
                    hash = hash & hash;
                }
                const docId = `${prompt.userId}_${Math.abs(hash)}`;

                const docRef = doc(db, COLLECTION_NAME, docId);

                batch.set(docRef, {
                    ...prompt,
                    createdAt: Timestamp.fromDate(prompt.createdAt)
                }, { merge: true });

                allIds.push(docId);
            });

            try {
                await batch.commit();
                console.log(`Committed batch of ${chunk.length}`);
            } catch (e) {
                console.error("Error committing batch: ", e);
                throw e;
            }
        }
        return allIds;
    }
};
