import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { MessageCircle } from "lucide-react";
import { whatsappLink } from "@/lib/site";
import { trackAnalyticsEvent } from "@/lib/supabase";

const DEFAULT_MESSAGE = "Olá! Quero conhecer os carros e motos da Braza Veículos.";

type WhatsAppContextType = {
  message: string | null;
  carId: number | null;
  setMessage: (msg: string | null, carId?: number | null) => void;
};

const WhatsAppContext = createContext<WhatsAppContextType>({
  message: null,
  carId: null,
  setMessage: () => {},
});

export function WhatsAppProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const [carId, setCarId] = useState<number | null>(null);
  const updateMessage = useCallback((msg: string | null, id: number | null = null) => {
    setMessage(msg);
    setCarId(id);
  }, []);

  useEffect(() => {
    const visitKey = "braza-site-visit-v1";
    if (sessionStorage.getItem(visitKey)) return;
    void trackAnalyticsEvent("site_visit").then((registered) => {
      if (registered) sessionStorage.setItem(visitKey, "1");
    });
  }, []);

  return (
    <WhatsAppContext.Provider value={{ message, carId, setMessage: updateMessage }}>
      {children}
    </WhatsAppContext.Provider>
  );
}

export function useWhatsAppMessage(message: string | null | undefined, carId?: number) {
  const { setMessage } = useContext(WhatsAppContext);

  useEffect(() => {
    if (message) {
      setMessage(message, carId);
      return () => setMessage(null, null);
    }
  }, [message, carId, setMessage]);
}

export function useWhatsAppContext() {
  return useContext(WhatsAppContext);
}

export function WhatsAppFloater() {
  const { message, carId } = useContext(WhatsAppContext);
  const activeMessage = message || DEFAULT_MESSAGE;

  return (
    <a
      href={whatsappLink(activeMessage)}
      onClick={() => {
        if (carId) void trackAnalyticsEvent("whatsapp_click", carId);
      }}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Fale conosco pelo WhatsApp"
      className="fixed bottom-4 right-4 z-50 flex h-[5.5rem] w-[5.5rem] cursor-pointer items-center justify-center rounded-full transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-background sm:bottom-6 sm:right-6 sm:h-24 sm:w-24"
    >
      <span
        className="braza-glow relative flex h-full w-full items-center justify-center rounded-full bg-braza shadow-[0_12px_35px_rgba(216,32,47,0.3)]"
        aria-hidden="true"
      >
        <MessageCircle
          className="relative z-10 h-11 w-11 text-white sm:h-12 sm:w-12"
          strokeWidth={1.8}
          aria-hidden
        />
      </span>
    </a>
  );
}
