import { request } from "../core";
import type { ChatSession, ChatMessage, UploadResponse } from "../types";

export const aiApi = {
  getSessions: () => request<ChatSession[]>("/chat/sessions"),
  
  deleteSession: (id: string) =>
    request<void>(`/chat/sessions/${id}`, { method: "DELETE" }),

  renameSession: (id: string, topic: string) => 
    request<ChatSession>(`/chat/sessions/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ topic }),
    }),

  getHistory: (sessionId: string) =>
    request<ChatMessage[]>(`/chat/${sessionId}/messages`),

  sendMessage: (sessionId: string, message: string, webSearch: boolean = false, model = "gpt-4-turbo") =>
    request<{ 
      response: string; 
      session_id: string;
      usage?: { total_tokens: number };
      tool_call?: { type: string; data: any; } 
    }>("/chat", {
      method: "POST",
      body: JSON.stringify({ session_id: sessionId, message, model, web_search: webSearch }),
    }),

  uploadFile: (file: File, sessionId: string, message = "") => {
    const form = new FormData();
    form.append("file", file);
    form.append("session_id", sessionId);
    form.append("message", message);
    return request<UploadResponse>("/chat/upload", { method: "POST", body: form });
  },

  confirmImport: (filePath: string, mapping: Record<string, string>, sessionId?: string) =>
    request<{ status: string; count: number }>("/chat/import-confirm", {
      method: "POST",
      body: JSON.stringify({ file_path: filePath, mapping, session_id: sessionId }),
    }),
};