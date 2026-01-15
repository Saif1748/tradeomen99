import { request } from "../core";
import type { 
  ChatSession, 
  ChatMessage, 
  UploadResponse, 
  ChatResponse,
  ChatRequest
} from "../types";

export const aiApi = {
  getSessions: () => 
    request<ChatSession[]>("/chat/sessions"),
  
  deleteSession: (id: string) =>
    request<void>(`/chat/sessions/${id}`, { method: "DELETE" }),

  renameSession: (id: string, topic: string) => 
    request<ChatSession>(`/chat/sessions/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ topic }),
    }),

  getHistory: (sessionId: string) =>
    request<ChatMessage[]>(`/chat/${sessionId}/messages`),

  sendMessage: (
    sessionId: string, 
    message: string, 
    webSearch: boolean = false, 
    model: string = "gemini-2.5-flash"
  ) =>
    request<ChatResponse>("/chat", {
      method: "POST",
      body: JSON.stringify({ 
        session_id: sessionId, 
        message, 
        model, 
        web_search: webSearch 
      }),
    }),

  uploadFile: (file: File, sessionId: string, message = "") => {
    const form = new FormData();
    form.append("file", file);
    form.append("session_id", sessionId);
    form.append("message", message);
    
    // Note: When sending FormData, do NOT manually set Content-Type to application/json.
    // The browser automatically sets it to multipart/form-data with the boundary.
    // Ensure your 'request' wrapper in '../core' handles FormData correctly.
    return request<UploadResponse>("/chat/upload", { 
      method: "POST", 
      body: form 
    });
  },

  confirmImport: (
    filePath: string, 
    mapping: Record<string, string>, 
    sessionId?: string
  ) =>
    request<{ status: string; count: number }>("/chat/import-confirm", {
      method: "POST",
      body: JSON.stringify({ 
        file_path: filePath, 
        mapping, 
        session_id: sessionId 
      }),
    }),
};