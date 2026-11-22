import { useLiveQuery } from 'dexie-react-hooks';
import { type ReactNode, useState } from 'react';
import { Link } from 'react-router-dom';
import { IconeLixo } from '../components/Icones';
import { Botao, Cabecalho, Carregando, Cartao, Segmentado } from '../components/ui';
import { salvarConfig, useConfig } from '../db/config';
import { excluirPeso, registrarPeso, registrosDePeso } from '../db/pesos';
import type { ObjetivoPeso } from '../db/tipos';
import { dataCurta, kg, lerNumero, num } from '../lib/formato';
import { avaliarRitmo, cafeinaMg, diaDoRegistro, FAIXA_RITMO, mediasSemanais, proteinaDiaria, ritmoSemanal } from '../lib/nutricao';

const ROTULO_OBJETIVO: Record<ObjetivoPeso, string> = { ganhar: 'Ganhar', manter: 'Manter', perder: 'Perder' };

/** Peso corporal (meta semanal pelo guia), proteína e suplementos com evidência forte. */
export default function Corpo() {
  const config = useConfig();
  const registros = useLiveQuery(registrosDePeso, []);
  const [texto, setTexto] = useState('');
  const [verTodos, setVerTodos] = useState(false);

  if (!config || !registros) return <Carregando titulo="Peso e nutrição" voltar />;

  const ultimo = registros.at(-1);
  const hoje = registros.find((r) => r.data === diaDoRegistro());
  const valor = lerNumero(texto);
  const valido = valor >= 20 && valor <= 400;
  const medias = mediasSemanais(registros);
  const ritmo = ritmoSemanal(medias);
  const objetivo = config.objetivoPeso;
  const [min, max] = FAIXA_RITMO[objetivo];
  const pesoRef = ultimo?.kg ?? null;

  async function salvar() {
    if (!valido) return;
    await registrarPeso(valor);
    setTexto('');
  }

  return (
    <>
      <Cabecalho titulo="Peso e nutrição" voltar />
      <div className="flex flex-col gap-4 px-4 pb-10">
        {/* Registro */}
        <Cartao className="flex flex-col gap-3">
          <h2 className="font-semibold">Peso de hoje</h2>
          <div className="flex gap-2">
            <label className="flex-1">
              <span className="sr-only">Peso em kg</span>
              <input
                inputMode="decimal"
                placeholder={hoje ? num(hoje.kg) : ultimo ? num(ultimo.kg) : 'Ex.: 75,4'}
                value={texto}
                onChange={(e) => setTexto(e.target.value.replace(/[^\d.,]/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && salvar()}
                className="h-12 w-full rounded-xl bg-cartao-2 px-4 text-lg font-semibold tabular-nums outline-none focus:ring-2 focus:ring-primaria"
              />
            </label>
            <Botao variante="primario" disabled={!valido} onClick={salvar}>
              {hoje ? 'Atualizar' : 'Registrar'}
            </Botao>
          </div>
          <p className="text-sm text-secundario">
            {hoje ? `Hoje: ${kg(hoje.kg)}. ` : ''}Pese-se em jejum, de preferência várias vezes por semana: o app compara a média de cada
            semana, não pesagens soltas.
          </p>
        </Cartao>

        {/* Meta */}
        <Cartao className="flex flex-col gap-3">
          <h2 className="font-semibold">Objetivo</h2>
          <Segmentado
            rotulo="Objetivo de peso"
            valor={objetivo}
            aoMudar={(o) => salvarConfig({ objetivoPeso: o })}
            opcoes={(['ganhar', 'manter', 'perder'] as const).map((o) => ({ valor: o, rotulo: ROTULO_OBJETIVO[o] }))}
          />
          <p className="text-sm text-secundario">
            Meta do guia: {faixaTexto(min, max)} do peso por semana
            {pesoRef && ` (${faixaKg(min, max, pesoRef)})`}. {DICA_OBJETIVO[objetivo]}
          </p>
          <div className="rounded-xl bg-cartao-2 p-3">
            {ritmo === null ? (
              <p className="text-sm text-secundario">Registre o peso em duas semanas diferentes para ver o ritmo.</p>
            ) : (
              <>
                <p className="text-sm text-secundario">Ritmo atual (média desta semana com registro × a anterior)</p>
                <p className="mt-1 text-3xl font-semibold tabular-nums">
                  {ritmo > 0 ? '+' : ''}
                  {num(ritmo)}% <span className="text-base font-normal text-secundario">por semana</span>
                </p>
                <p className="mt-1 text-sm">{mensagemRitmo(ritmo, objetivo)}</p>
              </>
            )}
          </div>
          {medias.length > 0 && (
            <table className="w-full text-sm tabular-nums">
              <thead>
                <tr className="text-secundario">
                  <th className="py-1 text-left font-normal">Semana de</th>
                  <th className="py-1 text-right font-normal">Média</th>
                  <th className="py-1 text-right font-normal">Pesagens</th>
                </tr>
              </thead>
              <tbody>
                {medias
                  .slice(-6)
                  .reverse()
                  .map((m) => (
                    <tr key={m.semana} className="border-t border-borda">
                      <td className="py-2">{dataCurta(m.semana)}</td>
                      <td className="py-2 text-right font-semibold">{kg(m.media)}</td>
                      <td className="py-2 text-right text-secundario">{m.registros}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
          {registros.length > 0 && (
            <details open={verTodos} onToggle={(e) => setVerTodos(e.currentTarget.open)}>
              <summary className="flex min-h-12 cursor-pointer items-center text-sm font-semibold text-primaria-texto">
                Pesagens ({registros.length})
              </summary>
              <ul className="flex flex-col divide-y divide-borda text-sm tabular-nums">
                {[...registros].reverse().map((r) => (
                  <li key={r.id} className="flex items-center gap-2">
                    <span className="flex-1">{dataCurta(r.data)}</span>
                    <span className="font-semibold">{kg(r.kg)}</span>
                    <button
                      type="button"
                      aria-label={`Excluir pesagem de ${dataCurta(r.data)}`}
                      onClick={() => confirm(`Excluir a pesagem de ${dataCurta(r.data)}?`) && excluirPeso(r.id)}
                      className="flex size-12 items-center justify-center rounded-xl text-secundario active:bg-cartao-2"
                    >
                      <IconeLixo />
                    </button>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </Cartao>

        {/* Proteína */}
        <Cartao className="flex flex-col gap-2">
          <h2 className="font-semibold">Proteína por dia</h2>
          {pesoRef ? <Proteina peso={pesoRef} /> : <p className="text-sm text-secundario">Registre seu peso para calcular.</p>}
          <p className="text-sm text-secundario">
            1,6 g/kg já cobre a maioria das pessoas (Morton 2018); até 2,2 g/kg em dieta ou acima dos 40–50 anos. O total do dia importa
            mais que o horário.
          </p>
        </Cartao>

        {/* Suplementos */}
        <Cartao className="flex flex-col gap-3">
          <h2 className="font-semibold">Suplementos com evidência forte</h2>
          <Suplemento nome="Creatina monohidratada">3 a 5 g por dia, todo dia, em qualquer horário (ISSN 2017).</Suplemento>
          <Suplemento nome="Cafeína">
            {pesoRef ? (
              <>
                {cafeinaMg(pesoRef).minMg} a {cafeinaMg(pesoRef).maxMg} mg{' '}
              </>
            ) : (
              '3 a 6 mg por kg '
            )}
            cerca de 60 min antes do treino (3–6 mg/kg; ISSN 2021). Evite nas 6–8 h antes de dormir. Doses de 9 mg/kg ou mais aumentam os
            efeitos colaterais.
          </Suplemento>
          <p className="text-sm text-secundario">Outros (BCAA, glutamina, “queimadores”) têm evidência fraca ou nenhuma.</p>
          <p className="text-sm font-semibold text-alerta-texto">
            Quem tem doença renal, hipertensão, é menor de idade ou está grávida deve consultar um médico antes de usar suplementos.
          </p>
        </Cartao>

        <p className="text-center text-xs text-secundario">
          Conteúdo informativo. Não substitui orientação de médico, nutricionista ou profissional de educação física.{' '}
          <Link to="/sobre" className="inline-flex min-h-12 items-center font-semibold text-primaria-texto">
            Ver o guia completo
          </Link>
        </p>
      </div>
    </>
  );
}

const DICA_OBJETIVO: Record<ObjetivoPeso, string> = {
  ganhar: 'Ganhar devagar dá mais músculo com pouca gordura (Iraki 2019).',
  manter: 'Peso estável: recomposição, mais provável em iniciantes e em quem volta a treinar.',
  perder: 'Perder devagar preserva músculo; mantenha o treino pesado e a proteína alta (Helms 2014).',
};

const faixaTexto = (a: number, b: number) => `${sinal(a)}${num(a)}% a ${sinal(b)}${num(b)}%`;
const sinal = (n: number) => (n > 0 ? '+' : '');
function faixaKg(a: number, b: number, peso: number) {
  const k = (p: number) => Math.round((p / 100) * peso * 10) / 10;
  return `${sinal(k(a))}${num(k(a))} a ${sinal(k(b))}${num(k(b))} kg`;
}

function mensagemRitmo(ritmo: number, objetivo: ObjetivoPeso): ReactNode {
  const a = avaliarRitmo(ritmo, objetivo);
  if (a === 'dentro') return <strong className="text-primaria-texto">Dentro da meta do guia.</strong>;
  if (objetivo === 'manter') return ritmo > 0 ? 'O peso está subindo.' : 'O peso está caindo.';
  if (objetivo === 'ganhar')
    return a === 'rapido'
      ? 'Mais rápido que a meta: parte do ganho tende a ser gordura. Reduza 100–200 kcal por dia.'
      : 'Mais devagar que a meta. Se continuar por 2 semanas, some 100–200 kcal por dia.';
  return a === 'rapido'
    ? 'Mais rápido que a meta: risco de perder músculo. Some 100–200 kcal por dia.'
    : 'Mais devagar que a meta. Se continuar por 2 semanas, reduza 100–200 kcal por dia.';
}

function Proteina({ peso }: { peso: number }) {
  const p = proteinaDiaria(peso);
  return (
    <>
      <p className="text-3xl font-semibold tabular-nums">
        {p.minG}–{p.maxG} g <span className="text-base font-normal text-secundario">para {kg(peso)}</span>
      </p>
      <p className="text-sm">
        Cerca de <strong>{p.porRefeicaoG} g por refeição</strong>, em pelo menos {p.refeicoes} refeições (~0,4 g/kg).
      </p>
    </>
  );
}

function Suplemento({ nome, children }: { nome: string; children: ReactNode }) {
  return (
    <div className="text-sm">
      <p className="font-semibold">{nome}</p>
      <p className="text-secundario">{children}</p>
    </div>
  );
}
