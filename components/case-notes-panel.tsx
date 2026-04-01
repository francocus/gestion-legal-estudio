"use client";

import { useRef, useState } from "react";
import { createNote, deleteNote } from "@/lib/actions/notes";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mic, MicOff, Plus, Trash2, FileText, Loader2 } from "lucide-react";

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface Note {
  id: string;
  content: string;
  type: string;
  createdAt: Date;
}

interface CaseNotesPanelProps {
  caseId: string;
  clientId: string;
  initialNotes: Note[];
}

export function CaseNotesPanel({ caseId, clientId, initialNotes }: CaseNotesPanelProps) {
  const [text, setText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const speechSupported =
    typeof window !== "undefined" &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  const startRecording = () => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "es-AR";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = "";
      for (let index = 0; index < event.results.length; index += 1) {
        transcript += event.results[index][0].transcript;
      }
      setText(transcript);
    };

    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  };

  const handleSave = async (type: "TEXT" | "VOICE") => {
    if (!text.trim()) return;

    setIsSaving(true);
    setError(null);
    const result = await createNote(caseId, clientId, text, type);

    if (!result.success) {
      setError(result.error);
      setIsSaving(false);
      return;
    }

    setText("");
    setIsSaving(false);
  };

  const handleDelete = async (noteId: string) => {
    await deleteNote(noteId, caseId, clientId);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
        <Textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={
            isRecording ? "Escuchando... habla ahora" : "Escribi una nota o usa el grabador de voz..."
          }
          className={`min-h-[100px] resize-none text-sm ${
            isRecording ? "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/10" : ""
          }`}
        />

        <div className="flex items-center justify-between gap-2 flex-wrap">
          {speechSupported && (
            <Button
              type="button"
              variant={isRecording ? "destructive" : "outline"}
              size="sm"
              onClick={isRecording ? stopRecording : startRecording}
              className="flex items-center gap-2"
            >
              {isRecording ? (
                <>
                  <MicOff className="h-4 w-4" />
                  Detener grabacion
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4 text-red-500" />
                  Grabar por voz
                </>
              )}
            </Button>
          )}

          <Button
            type="button"
            size="sm"
            disabled={!text.trim() || isSaving}
            onClick={() => handleSave(isRecording ? "VOICE" : "TEXT")}
            className="flex items-center gap-2 ml-auto"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Guardar nota
          </Button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        )}
      </div>

      {initialNotes.length === 0 ? (
        <div className="text-center py-8 text-gray-400 dark:text-gray-600 border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-xl">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Todavia no hay notas en este expediente.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {initialNotes.map((note) => (
            <div
              key={note.id}
              className="group flex items-start gap-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-lg p-3"
            >
              {note.type === "VOICE" ? (
                <Mic className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
              ) : (
                <FileText className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{note.content}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-1 uppercase tracking-wide">
                  {note.type === "VOICE" ? "Voz - " : "Texto - "}
                  {new Date(note.createdAt).toLocaleDateString("es-AR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(note.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400 shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
