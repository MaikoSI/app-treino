import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Botao } from './ui';

/**
 * Registra o service worker (funcionamento offline) e avisa quando:
 * - o app ficou pronto para uso offline (primeira instalação);
 * - existe uma versão nova (a pessoa escolhe quando atualizar).
 */
export function AvisoAtualizacao() {
  const {
    offlineReady: [offlinePronto, setOfflinePronto],
    needRefresh: [temNovaVersao, setTemNovaVersao],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registro) {
      // Procura atualização a cada hora enquanto o app estiver aberto.
      if (registro) setInterval(() => void registro.update().catch(() => {}), 60 * 60 * 1000);
    },
  });

  useEffect(() => {
    if (!offlinePronto) return;
    const t = setTimeout(() => setOfflinePronto(false), 4000);
    return () => clearTimeout(t);
  }, [offlinePronto, setOfflinePronto]);

  if (!offlinePronto && !temNovaVersao) return null;

  return (
    <div className="pt-seguro fixed inset-x-0 top-0 z-[70] flex justify-center px-4 pt-2" role="status">
      <div className="flex w-full max-w-lg items-center gap-3 rounded-2xl border border-borda bg-superficie-2 p-3 shadow-lg">
        <p className="flex-1 text-sm">
          {temNovaVersao ? 'Nova versão disponível.' : 'Pronto! O app agora funciona sem internet.'}
        </p>
        {temNovaVersao && (
          <>
            <Botao variante="fantasma" onClick={() => setTemNovaVersao(false)}>
              Depois
            </Botao>
            <Botao variante="primario" onClick={() => updateServiceWorker(true)}>
              Atualizar
            </Botao>
          </>
        )}
      </div>
    </div>
  );
}
