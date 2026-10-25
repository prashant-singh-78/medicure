# Medicure — Medical Chatbot & Retrieval Grounding Forensic Audit

**Diagnostic Phase**: Phase 7 Medical Chatbot & Knowledge Retrieval Audit  
**Date**: October 2026  
**Auditor**: AI Systems Debugger & Medical NLP Specialist  

---

## 1. Executive Chatbot Architecture Identification

The investigation established the exact technical mechanism powering the Medicure conversational assistant ("Friend Chat"):

```mermaid
flowchart TD
    UserQuery[User Health Query / Symptom Question] --> Frontend[FriendChat.jsx]
    Frontend -->|POST /api/friend-chat/message| Backend[friend_chat.py]
    
    subgraph Chatbot Engine (Actual Reality)
        Backend --> SystemPrompt[Fixed System Prompt:\n'You are Medi, a friend - not a doctor.\nNever diagnose or prescribe.']
        Backend --> GeminiAPI[Google Gemini 1.5 Flash API]
        SystemPrompt --> GeminiAPI
    end

    subgraph Expected vs Missing Architecture
        GeminiAPI -.->|NO RAG PIPELINE| MissingVectorDB[(Vector Database: None)]
        GeminiAPI -.->|NO EMBEDDINGS| MissingEmbeddings[Embedding Model: None]
        GeminiAPI -.->|NO DOCUMENT STORE| MissingDocs[(Medical Guidelines / Clinical Corpus: None)]
        GeminiAPI -.->|NO INTEGRATION| LocalModels[Local ML Models: Not Connected]
    end

    GeminiAPI -->|Response Text| OutputFormatter[Return JSON reply]
    OutputFormatter --> Frontend
    Frontend --> User[Render in Chat Bubble]

    GeminiAPI -.->|On Quota / Network Error| CannedReplies[Silent Canned Friendly Responses:\n'Hey! 💙 I am feeling shy...']
    CannedReplies --> OutputFormatter
```

### Key Technical Findings:
1. **Zero Grounding in Local Datasets**: The chatbot does **not** ingest, retrieve, or query `disease_dataset.csv`, `medicine_data.csv`, `medicines.db`, or any local clinical corpus.
2. **Zero Vector Database or Embeddings**: There is no vector database (Chroma, FAISS, Pinecone, Qdrant, Milvus), no embedding model (Sentence-Transformers, text-embedding-004), and no document chunking pipeline in the repository.
3. **Explicit Non-Clinical System Prompt**: The system prompt explicitly commands the model to act as a non-medical friend and forbids diagnosing or prescribing:
   > *"You are 'Medi', a warm, caring, and supportive friend — not a therapist or doctor... Never diagnose, prescribe, or recommend medical treatments."*
4. **Disconnection from Local ML Models**: The chatbot has no tool-calling or orchestration layer to invoke `disease_model.pkl`, `voice_model.pkl`, or `skin_model.h5`.

---

## 2. Component-by-Component Pipeline Audit

| Pipeline Stage | Expected State for a Medical Chatbot | Actual Implementation in Medicure | Status |
| :--- | :--- | :--- | :--- |
| **Document Ingestion** | Clinical guidelines, pharmacology texts, medical FAQs | None. Zero document loaders or parsers. | **Missing** |
| **Text Chunking** | Recursive character / semantic chunking with overlap | None. | **Missing** |
| **Embedding Generation**| High-dimensional dense biomedical embeddings | None. | **Missing** |
| **Index Persistence** | Persistent vector index with metadata tagging | None. | **Missing** |
| **Retrieval & Ranking** | Cosine similarity / hybrid BM25 + dense search | None. | **Missing** |
| **Context Assembly** | Augmented prompt injecting retrieved clinical context | Only passes previous user/assistant conversation history. | **Absent** |
| **Source Citation** | Attribution to medical literature / guideline sources | None. | **Missing** |
| **Failure Mode** | Returns fallback: *"Insufficient evidence to answer"* | Returns canned generic friend dialogue: *"I'm here for you! 💙 Tell me more..."* | **Flawed** |

---

## 3. Tracing Representative Inquiries Through the System

### Inquiry 1: Specific Medical Advice Request
**User Input**: *"I have a 102°F fever, stiff neck, and severe headache. What medicine should I take?"*  
*(Clinical Ground Truth: Classical triad of **Acute Bacterial Meningitis**, a life-threatening medical emergency requiring immediate hospitalization and IV antibiotics).*

1. **Preprocessing**: Frontend packages input into `ChatRequest(message="...", history=[])`.
2. **Retrieval**: **Zero retrieval performed**.
3. **Prompt Sent to LLM**:
   ```
   SYSTEM: You are "Medi", a warm, caring, and supportive friend — not a therapist or doctor...
   USER: I have a 102°F fever, stiff neck, and severe headache. What medicine should I take?
   ```
4. **Actual Output**: Because of the system prompt instruction (*"Talk like a kind best friend... Never diagnose, prescribe, or recommend medical treatments"*), Gemini responds with conversational empathy:
   > *"Oh no, that sounds awful! 💙 Having such a high fever and headache must be really exhausting. I can't recommend medicines, but please make sure you rest and drink lots of water. Have you been able to tell someone nearby?"*
5. **Clinical Hazard**: The chatbot treats a **fatal neuro-infection** as a regular bad day, failing to trigger an urgent emergency alert.

---

### Inquiry 2: Indian Pharmaceutical Search
**User Input**: *"What is the salt composition and dosage for Human Insulatard?"*  
*(Ground Truth: Contained in `medicine_data.csv` row 1: `Insulin Isophane (40IU)`, sub-category: `Human Insulin Basal`).*

1. **Retrieval**: Zero retrieval. The system has 195,605 Indian medicines on disk in `medicine_data.csv`, but the chatbot has no mechanism to read or search them.
2. **Actual Output**: Gemini relies solely on its pre-trained parametric weights:
   > *"Insulatard contains isophane insulin, which is intermediate-acting insulin used for diabetes. However, for exact dosage instructions, you must consult your doctor."*
3. **Analysis**: The system completely bypasses the 337 MB specialized dataset residing in the project directory.

---

### Inquiry 3: Execution Under API Disruption / Quota Exhaustion
**User Input**: *"I am having chest pain radiating to my left arm."*  
*(Clinical Ground Truth: Possible **Acute Myocardial Infarction**).*

1. **Execution**: If `GEMINI_API_KEY` hits rate limits (HTTP 429) or is blocked:
2. **Exception Caught**: `except Exception as e:` in `friend_chat.py`.
3. **Actual Output Delivered to User**:
   > *"Hey! 💙 I'm here for you, but I'm feeling a bit shy right now. Tell me more about what's on your mind?"*
4. **Clinical Catastrophe**: A patient experiencing an acute coronary syndrome receives a flirtatious/playful greeting and is prompted to keep typing into the chat box instead of calling an emergency ambulance.

---

## 4. Root Causes of Chatbot Deficiencies

1. **Conceptual Misalignment**: The frontend titles the module *"AI Friend Chat"* and *"Medi · Your caring AI companion"*, but marketing and user expectations treat it as a medical diagnostic chatbot.
2. **Absence of a RAG Architecture**: The project lacks document ingestion, indexing, and context-retrieval mechanisms.
3. **Safety Disconnect**: There is no hardcoded red-flag keyword detector (e.g., detecting chest pain, suicide, anaphylaxis, stroke symptoms, high fever with stiff neck) to immediately override conversational flows with emergency directives.
4. **Unsafe Silent Fallback**: The presence of random conversational strings in exception handlers converts fatal system errors into cheerful chat bubbles.