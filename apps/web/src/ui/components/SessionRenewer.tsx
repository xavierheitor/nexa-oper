/**
 * Componente de Renovação Automática de Sessão
 *
 * Este componente implementa sliding session (sessão deslizante) que renova
 * automaticamente o token JWT enquanto o usuário está ativo.
 *
 * FUNCIONAMENTO:
 * - Monitora atividade do usuário (mouse, teclado, touch)
 * - Renova sessão a cada 5 minutos SE houver atividade
 * - Previne logout inesperado durante uso ativo
 * - Permite logout após inatividade prolongada (8h)
 *
 * BENEFÍCIOS:
 * - Usuário ativo NUNCA é deslogado
 * - Usuário inativo é deslogado após 8h
 * - Renovação silenciosa em background
 * - Sem interrupções no workflow
 * - Segurança mantida com timeout de inatividade
 *
 * USO:
 * - Adicionar no layout raiz da aplicação
 * - Funciona automaticamente em background
 * - Não precisa de configuração adicional
 */

'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useRef } from 'react';

const INACTIVITY_TIMEOUT = 8 * 60 * 60 * 1000; // 8 horas em ms
const RENEWAL_INTERVAL = 5 * 60 * 1000; // 5 minutos em ms

export default function SessionRenewer() {
  const { data: session, update } = useSession();
  const lastActivityRef = useRef<number>(Date.now());
  const renewalTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!session) return; // Não faz nada se não houver sessão

    // Atualiza timestamp de última atividade ao detectar interação do usuário
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };

    // Lista de eventos que indicam atividade do usuário
    const activityEvents = [
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart',
      'click',
    ];

    // Registra listeners para detectar atividade
    activityEvents.forEach(event => {
      window.addEventListener(event, updateActivity, { passive: true });
    });

    // Timer que verifica periodicamente se deve renovar a sessão
    const checkAndRenewSession = () => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivityRef.current;

      // Se houve atividade recente (dentro de 8h), renova a sessão
      if (timeSinceLastActivity < INACTIVITY_TIMEOUT) {
        console.log('[SessionRenewer] ✅ Renovando sessão - Usuário ativo');
        update(); // Renova o token JWT através do NextAuth
      } else {
        console.log('[SessionRenewer] ⚠️ Inatividade detectada - Sessão não renovada');
      }
    };

    // Configura timer para verificar a cada 5 minutos
    renewalTimerRef.current = setInterval(checkAndRenewSession, RENEWAL_INTERVAL);

    // Cleanup ao desmontar
    return () => {
      // Remove listeners de eventos
      activityEvents.forEach(event => {
        window.removeEventListener(event, updateActivity);
      });

      // Limpa timer
      if (renewalTimerRef.current) {
        clearInterval(renewalTimerRef.current);
      }
    };
  }, [session, update]);

  // Componente invisível - apenas lógica
  return null;
}

