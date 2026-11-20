import type { ReactNode } from 'react';
import { Cabecalho } from '../components/ui';

/**
 * "Sobre": a base científica do app (guia de musculação, hipertrofia, força e nutrição).
 * Cada seção abre e fecha ao tocar (<details>), para a página não ficar enorme no celular.
 */
export default function Sobre() {
  return (
    <>
      <Cabecalho titulo="Sobre" voltar />
      <div className="flex flex-col gap-4 px-4 pb-10">
        <header>
          <p className="text-sm font-semibold uppercase tracking-widest text-primaria-texto">Base científica</p>
          <h2 className="mt-1 text-2xl font-bold leading-tight">Guia científico de musculação: hipertrofia, força e nutrição</h2>
          <p className="mt-3 text-secundario">
            O que mais faz o corpo mudar é treinar com regularidade, progredir a carga, comer proteína suficiente e dormir bem. O resto
            é ajuste fino. Este guia reúne o que as melhores pesquisas dizem sobre treino, nutrição, suplementos e recuperação.
          </p>
          <p className="mt-3 text-sm text-secundario">
            <strong className="text-texto">Como ler as evidências:</strong> quase tudo aqui vem de meta-análises e revisões
            sistemáticas, estudos que juntam os resultados de dezenas de pesquisas. São a forma mais forte de evidência na área. Quando
            algo ainda é incerto, o guia avisa.
          </p>
        </header>

        <Aviso />

        <Secao titulo="Resumo em 10 regras" aberta>
          <ol className="flex list-decimal flex-col gap-2 pl-5">
            <li>Qualquer treino de força é muito melhor que nenhum. O melhor programa é aquele que você consegue manter.</li>
            <li>Faça pelo menos 10 séries por semana para cada grupo muscular.</li>
            <li>Treine cada músculo pelo menos 2 vezes por semana.</li>
            <li>
              Para hipertrofia, cargas leves ou pesadas funcionam, desde que a série termine perto da falha. Para força máxima, use cargas
              pesadas.
            </li>
            <li>Termine as séries a 0–3 repetições da falha (RIR 0–3).</li>
            <li>Descanse pelo menos 60–90 segundos entre as séries.</li>
            <li>Use amplitude completa e dê ênfase à parte alongada do movimento.</li>
            <li>Aumente carga ou repetições aos poucos (sobrecarga progressiva) e registre tudo.</li>
            <li>Coma cerca de 1,6 g de proteína por kg de peso por dia, dividida em pelo menos 4 refeições.</li>
            <li>Durma de 7 a 9 horas. Uma noite sem dormir já reduz a construção de músculo.</li>
          </ol>
        </Secao>

        <Secao titulo="Como o app usa este guia">
          <ul className="flex flex-col gap-3">
            <Item titulo="Divisões prontas">
              2 dias: Full Body A/B. 3 dias: Full Body A/B/C ou ABC. 4 dias: Superiores/Inferiores. 6 dias: Push/Pull/Legs. Nessas
              divisões, cada músculo é treinado cerca de 2x por semana (o ABC treina 1x). A opção de 5 dias é o ABCDE, que treina cada
              músculo 1x por semana: funciona, mas fica abaixo da frequência recomendada.
            </Item>
            <Item titulo="Progressão dupla">
              Quando todas as séries de um exercício chegam ao topo da faixa de repetições, o próximo treino mostra “Tente +2,5 kg”
              (+5 kg em quadríceps, posteriores, glúteos e panturrilha).
            </Item>
            <Item titulo="Registro de tudo">
              Carga e repetições já vêm com o que você fez da última vez, para facilitar a sobrecarga progressiva.
            </Item>
            <Item titulo="1RM e recordes">1RM estimado pela fórmula de Epley; o app comemora quando você bate um recorde.</Item>
            <Item titulo="Séries por grupo muscular">Na tela Progresso, a contagem de séries feitas por músculo em cada semana.</Item>
            <Item titulo="RPE">Campo opcional em cada série (ligue em Ajustes). Veja a tabela RPE × RIR na seção “Proximidade da falha”.</Item>
            <Item titulo="Descanso">
              Definido por exercício no programa. O padrão é 1:30, e 2:30 em exercícios de até 8 repetições; ajuste em Ajustes e na
              edição do programa.
            </Item>
          </ul>
        </Secao>

        <Secao titulo="Princípios fundamentais">
          <p>
            O maior ganho vem de sair do zero para qualquer treino de força feito com regularidade. Os detalhes (séries, repetições,
            descanso) otimizam, mas não substituem a constância.
          </p>
          <ul className="flex flex-col gap-3">
            <Item titulo="Diretriz do ACSM 2026">
              Primeira grande atualização desde 2009, baseada em 137 revisões sistemáticas com mais de 30.000 participantes. Qualquer
              treino de força melhora força, tamanho muscular e função física, e o melhor programa é o que a pessoa mantém.
            </Item>
            <Item titulo="Sobrecarga progressiva">
              O músculo só continua se adaptando se o estímulo aumenta com o tempo: mais carga, mais repetições ou mais séries. Por isso
              registrar cada treino é essencial.
            </Item>
            <Item titulo="Especificidade">
              O corpo melhora naquilo que é treinado. Quem quer força máxima precisa treinar com cargas pesadas; quem quer músculo tem
              mais liberdade de carga.
            </Item>
            <Item titulo="Individualidade">
              Pessoas respondem de formas diferentes ao mesmo treino. As regras deste guia são ponto de partida, ajustadas pelos
              resultados registrados.
            </Item>
          </ul>
        </Secao>

        <Secao titulo="Volume: séries por semana">
          <p>
            Faça no mínimo <strong>10 séries por semana</strong> para cada grupo muscular. Volume é a variável que mais pesa no
            crescimento depois da constância.
          </p>
          <ul className="flex flex-col gap-3">
            <Item titulo="Schoenfeld, Ogborn & Krieger (2017)">
              Relação dose-resposta, com mais hipertrofia até 10 ou mais séries semanais por músculo. Havia poucos dados para volumes
              muito maiores.
            </Item>
            <Item titulo="ACSM 2026">Reforça o mínimo de cerca de 10 séries por grupo muscular por semana.</Item>
            <Item titulo="Acima de ~20 séries">Resultados inconsistentes e mais fadiga. Mais não é sempre melhor.</Item>
          </ul>
          <Tabela
            cabecalho={['Nível', 'Séries por músculo por semana']}
            linhas={[
              ['Mínimo para manter', '3–6'],
              ['Iniciante', '8–12'],
              ['Intermediário', '10–16'],
              ['Avançado', '12–20+, testando a resposta'],
            ]}
          />
          <p className="text-sm text-secundario">
            Como contar: só contam séries de trabalho (perto da falha), não aquecimento. Compostos contam para os músculos principais:
            o supino conta para peito e meia série para tríceps e ombro anterior.
          </p>
        </Secao>

        <Secao titulo="Frequência e divisões de treino">
          <p>
            Treine cada músculo <strong>pelo menos 2 vezes por semana</strong>. Mantendo o volume semanal igual, a frequência exata
            importa pouco: escolha a divisão que cabe na sua rotina.
          </p>
          <ul className="flex flex-col gap-3">
            <Item titulo="Schoenfeld, Ogborn & Krieger (2016)">
              Os principais grupos musculares devem ser treinados pelo menos 2x por semana. Se 3x é melhor que 2x ficou em aberto.
            </Item>
            <Item titulo="Schoenfeld, Grgic & Krieger (2019)">
              Com o volume total igualado, a frequência não faz grande diferença na hipertrofia; ela serve para distribuir o volume.
            </Item>
            <Item titulo="Grgic et al. (2018)">Para força, frequência maior dá um pequeno ganho extra, por praticar mais o movimento.</Item>
          </ul>
          <Tabela
            cabecalho={['Dias', 'Divisão sugerida', 'Cada músculo']}
            linhas={[
              ['2', 'Full Body A / B', '2x'],
              ['3', 'Full Body A / B / C', '3x'],
              ['4', 'Superiores / Inferiores x2', '2x'],
              ['5', 'Upper / Lower + Push / Pull / Legs', '~2x'],
              ['6', 'Push / Pull / Legs x2', '2x'],
            ]}
          />
          <p className="text-sm text-secundario">
            O clássico ABCDE (cada músculo 1x por semana) funciona, mas fica abaixo da frequência recomendada. Se preferir, garanta pelo
            menos 10 séries semanais por músculo.
          </p>
        </Secao>

        <Secao titulo="Carga e faixas de repetição">
          <p>
            Para ganhar músculo, cargas leves e pesadas funcionam igual se a série for até perto da falha. Para força máxima, cargas
            pesadas são superiores.
          </p>
          <ul className="flex flex-col gap-3">
            <Item titulo="Schoenfeld, Grgic, Ogborn & Krieger (2017)">
              21 estudos com séries até a falha: hipertrofia parecida com cargas ≤60% e &gt;60% de 1RM, mas a força máxima cresceu mais
              com cargas pesadas.
            </Item>
            <Item titulo="ACSM 2026">Para força, cargas de pelo menos 80% de 1RM, 2–3 séries por exercício.</Item>
          </ul>
          <Tabela
            cabecalho={['Objetivo', '% de 1RM', 'Reps']}
            linhas={[
              ['Força máxima', '≥80%', '1–6'],
              ['Hipertrofia (mais prática)', '~60–85%', '6–15'],
              ['Hipertrofia (também funciona)', '~30–60%', '15–30, perto da falha'],
              ['Resistência muscular', '<60%', '15+'],
            ]}
          />
          <p>
            Na prática: compostos pesados (agachamento, supino, remada) em 5–10 repetições; isoladores (rosca, elevação lateral, cadeira
            extensora) em 10–20.
          </p>
          <div className="rounded-xl bg-cartao-2 p-3">
            <p className="text-sm text-secundario">1RM estimado (fórmula de Epley)</p>
            <p className="mt-1 font-semibold">1RM = carga × (1 + repetições ÷ 30)</p>
            <p className="mt-1 text-sm text-secundario">
              Exemplo: 80 kg × 8 repetições ≈ 101 kg. A estimativa perde precisão acima de ~10 repetições.
            </p>
          </div>
        </Secao>

        <Secao titulo="Proximidade da falha: RIR e RPE">
          <p>
            Para hipertrofia, termine as séries a <strong>0–3 repetições da falha</strong>. Ir sempre até a falha total não traz mais
            músculo e gera mais fadiga.
          </p>
          <ul className="flex flex-col gap-3">
            <Item titulo="Robinson et al. (2024)">
              Meta-regressão com 55 estudos: a hipertrofia aumenta conforme a série termina mais perto da falha, de forma não linear.
              Para força, isso importa pouco.
            </Item>
            <Item titulo="Refalo, Helms et al. (2023)">Não há prova de que ir até a falha seja melhor do que parar um pouco antes.</Item>
            <Item titulo="Refalo et al. (2024)">
              Em treinados, falha ou repetições em reserva deram hipertrofia parecida em 8 semanas; a falha gerou mais fadiga.
            </Item>
          </ul>
          <Tabela
            cabecalho={['RPE', 'RIR', 'Sensação']}
            linhas={[
              ['10', '0', 'Falha: não sai mais nenhuma'],
              ['9', '1', 'Sairia só mais uma'],
              ['8', '2', 'Sairiam mais duas'],
              ['7', '3', 'Sairiam mais três'],
              ['≤6', '4+', 'Longe da falha: conta pouco para hipertrofia'],
            ]}
          />
          <p className="text-sm text-secundario">
            Compostos pesados a RIR 1–3, por segurança. Isoladores e máquinas podem ir a RIR 0–1, especialmente na última série.
            Iniciantes costumam subestimar quanto ainda aguentam.
          </p>
        </Secao>

        <Secao titulo="Descanso entre séries">
          <p>
            Descanse <strong>pelo menos 60–90 segundos</strong>. Acima de 90 segundos não há diferença clara na hipertrofia; descansar
            mais serve para conseguir repetir o desempenho.
          </p>
          <ul className="flex flex-col gap-3">
            <Item titulo="Singer, Wolf… Schoenfeld (2024)">
              Pequeno benefício em descansar mais de 60 s; nenhuma diferença apreciável acima de 90 s.
            </Item>
          </ul>
          <Tabela
            cabecalho={['Tipo de exercício', 'Descanso']}
            linhas={[
              ['Compostos pesados (agachamento, terra, supino)', '2–3 min'],
              ['Compostos moderados e máquinas', '1,5–2 min'],
              ['Isoladores (rosca, elevação lateral)', '1–1,5 min'],
            ]}
          />
          <p className="text-sm text-secundario">
            Descanso curto demais derruba as repetições das séries seguintes. Superséries de antagonistas (bíceps + tríceps) economizam
            tempo sem esse prejuízo.
          </p>
        </Secao>

        <Secao titulo="Exercícios, amplitude e cadência">
          <p>Use amplitude completa e valorize a parte em que o músculo está alongado. A velocidade da repetição importa pouco.</p>
          <ul className="flex flex-col gap-3">
            <Item titulo="Wolf et al. (2023)">
              Amplitude completa tende a dar melhores resultados em força, tamanho muscular e composição corporal. Parciais na parte
              alongada podem ter um pequeno benefício para hipertrofia (tema ainda debatido).
            </Item>
            <Item titulo="Ênfase no alongamento">
              Stiff/terra romeno, rosca no banco inclinado, tríceps francês, panturrilha com pausa embaixo, agachamento profundo.
            </Item>
            <Item titulo="Schoenfeld, Ogborn & Krieger (2015)">
              Repetições de 0,5 a 8 segundos dão hipertrofia parecida; muito lentas (mais de 10 s) parecem inferiores. Suba com intenção
              e desça controlado (2–3 s), sem quicar.
            </Item>
            <Item titulo="Escolha dos exercícios">
              Cubra todos os grupos, combine compostos e isoladores. Máquinas e halteres são tão bons quanto barra para hipertrofia.
              Mantenha os principais exercícios por algumas semanas para medir o progresso.
            </Item>
          </ul>
        </Secao>

        <Secao titulo="Progressão, periodização e deload">
          <p>Progrida em pequenos passos e registre tudo. Deload é uma ferramenta para quando a fadiga acumula, não uma obrigação.</p>
          <div className="rounded-xl bg-cartao-2 p-3">
            <p className="font-semibold">Progressão dupla</p>
            <ol className="mt-2 flex list-decimal flex-col gap-1 pl-5 text-sm">
              <li>Defina uma faixa de repetições, por exemplo 8–12.</li>
              <li>Mantenha a mesma carga e tente somar repetições a cada treino.</li>
              <li>
                Quando todas as séries chegarem ao topo da faixa, aumente a carga: +2,5 kg em superiores, +5 kg em inferiores, ou o menor
                incremento possível em halteres e máquinas.
              </li>
              <li>Com a carga nova, as repetições caem para perto de 8 e o ciclo recomeça.</li>
            </ol>
          </div>
          <ul className="flex flex-col gap-3">
            <Item titulo="Estagnação">
              Se um exercício não progride em 2–3 treinos seguidos, verifique sono, alimentação e fadiga. Depois, considere trocar por
              uma variação ou reduzir o volume por uma semana.
            </Item>
            <Item titulo="Periodização">
              Linear e ondulatória costumam dar resultados parecidos para hipertrofia. O decisivo é volume suficiente e progressão.
            </Item>
            <Item titulo="Coleman et al. (2024)">
              Uma semana sem treino no meio de 9 semanas não mudou a hipertrofia, mas reduziu um pouco a força de membros inferiores.
              Use deload quando houver sinais de fadiga acumulada; uma versão comum é manter os exercícios e cortar cerca de metade das
              séries por uma semana.
            </Item>
          </ul>
        </Secao>

        <Secao titulo="Cardio junto com musculação">
          <p>
            Cardio não “mata” o ganho de massa nem de força máxima. Pode reduzir um pouco a força explosiva, principalmente na mesma
            sessão.
          </p>
          <ul className="flex flex-col gap-3">
            <Item titulo="Schumann et al. (2022)">
              43 estudos, 1.090 pessoas: o treino combinado não atrapalhou força máxima nem hipertrofia. A força explosiva foi
              prejudicada, mais quando feitos na mesma sessão.
            </Item>
            <Item titulo="Lundberg et al. (2022)">Pequeno efeito negativo nas fibras, mais forte com corrida do que com bicicleta.</Item>
            <Item titulo="Na prática">
              Separe musculação e cardio por algumas horas ou dias. Bicicleta, elíptico e caminhada inclinada interferem menos nas
              pernas. Na mesma sessão, faça a musculação primeiro.
            </Item>
          </ul>
        </Secao>

        <Secao titulo="Calorias: ganhar massa, perder gordura e recomposição">
          <p>O ritmo de mudança do peso é o melhor guia: ganhe devagar para ganhar músculo com pouca gordura e perca devagar para preservar músculo.</p>
          <Tabela
            cabecalho={['Objetivo', 'Ritmo semanal', 'Calorias']}
            linhas={[
              ['Ganhar massa (iniciante/interm.)', '+0,25 a +0,5% do peso', '+10 a 20%'],
              ['Ganhar massa (avançado)', 'Menos que isso', 'Superávit menor'],
              ['Perder gordura', '−0,5 a −1% do peso', 'Déficit ajustado ao ritmo'],
              ['Recomposição', 'Estável', 'Perto da manutenção'],
            ]}
          />
          <ul className="flex flex-col gap-3">
            <Item titulo="Iraki, Fitschen, Espinar & Helms (2019)">
              Superávit de ~10–20%, ganho de ~0,25–0,5% do peso por semana. Acompanhe a média semanal de várias pesagens.
            </Item>
            <Item titulo="Helms, Aragon & Fitschen (2014)">
              Perder ~0,5–1% do peso por semana para manter o máximo de músculo.
            </Item>
            <Item titulo="Recomposição">
              Mais provável em iniciantes, em quem está voltando a treinar e em quem tem mais gordura corporal.
            </Item>
            <Item titulo="Como achar a manutenção">
              Registre o que come por 2 semanas sem mudar nada. Se o peso médio ficou estável, essa é a sua manutenção. Ajuste em passos
              de 100–200 kcal.
            </Item>
          </ul>
        </Secao>

        <Secao titulo="Proteína, carboidratos, gorduras e água">
          <p>
            Coma cerca de <strong>1,6 g de proteína por kg</strong> de peso por dia (até 2,2 g/kg), em pelo menos 4 refeições. O total
            do dia importa muito mais que o horário.
          </p>
          <ul className="flex flex-col gap-3">
            <Item titulo="Morton et al. (2018)">
              49 estudos, 1.863 participantes: acima de ~1,6 g/kg/dia não houve ganho extra de massa magra.
            </Item>
            <Item titulo="Schoenfeld & Aragon (2018)">~0,4 g/kg por refeição em pelo menos 4 refeições.</Item>
            <Item titulo="Schoenfeld, Aragon & Krieger (2013)">
              O total diário foi o fator mais forte; a “janela anabólica” não se confirmou.
            </Item>
            <Item titulo="Em déficit calórico">Helms et al. (2014) sugerem 2,3–3,1 g por kg de massa magra.</Item>
          </ul>
          <Tabela
            cabecalho={['Peso', 'Proteína/dia', 'Por refeição']}
            linhas={[
              ['60 kg', '96–132 g', '~24 g'],
              ['70 kg', '112–154 g', '~28 g'],
              ['80 kg', '128–176 g', '~32 g'],
              ['90 kg', '144–198 g', '~36 g'],
            ]}
          />
          <p className="text-sm text-secundario">
            Gorduras: cerca de 20–35% das calorias (15–30% em dieta). Carboidratos completam o restante e são o principal combustível do
            treino intenso. Água: o suficiente para a urina ficar clara.
          </p>
        </Secao>

        <Secao titulo="Suplementos">
          <p>Poucos têm evidência forte: creatina e cafeína lideram, e whey é só uma forma prática de comer proteína.</p>
          <Tabela
            cabecalho={['Suplemento', 'Evidência', 'Como usar']}
            linhas={[
              ['Creatina monohidratada', 'Forte', '3–5 g por dia, todo dia, qualquer horário'],
              ['Cafeína', 'Forte para desempenho', '3–6 mg/kg ~60 min antes do treino'],
              ['Whey / proteína em pó', 'Funciona como comida', 'Quando for difícil bater a proteína'],
              ['Vitamina D', 'Só se houver deficiência', 'Conforme exame e orientação médica'],
              ['BCAA, glutamina, “queimadores”', 'Fraca ou nenhuma', 'Não recomendado'],
            ]}
          />
          <ul className="flex flex-col gap-3">
            <Item titulo="Creatina: ISSN (Kreider et al., 2017)">
              Mais de 200 estudos: melhora o desempenho em exercícios intensos e é segura em uso curto e longo em pessoas saudáveis.
            </Item>
            <Item titulo="Cafeína: ISSN (Guest et al., 2021)">
              Benefício pequeno a moderado em força e resistência com 3–6 mg/kg. Doses ≥9 mg/kg aumentam efeitos colaterais; evite perto
              da hora de dormir.
            </Item>
          </ul>
          <p className="text-sm font-semibold text-alerta-texto">
            Quem tem doença renal, hipertensão, é menor de idade ou está grávida deve consultar um médico antes de usar suplementos.
          </p>
        </Secao>

        <Secao titulo="Sono e recuperação">
          <p>
            O músculo é construído no descanso: durma <strong>de 7 a 9 horas</strong> por noite.
          </p>
          <ul className="flex flex-col gap-3">
            <Item titulo="Lamon et al. (2021)">
              Uma noite inteira sem dormir reduziu a síntese de proteína muscular em 18%, aumentou o cortisol em 21% e reduziu a
              testosterona em 24%.
            </Item>
            <Item titulo="Na prática">
              Horários regulares; sem cafeína 6–8 h antes de dormir; quarto escuro, silencioso e fresco. Após uma noite ruim, treine com
              volume ou intensidade um pouco menor. O mesmo músculo treinado pesado costuma precisar de ~48 h. Dor muscular tardia não é
              sinal de treino bom nem ruim.
            </Item>
          </ul>
        </Secao>

        <Secao titulo="Públicos específicos">
          <p>Os mesmos princípios valem para todos. Muda o volume inicial, a velocidade da progressão e alguns cuidados.</p>
          <ul className="flex flex-col gap-3">
            <Item titulo="Iniciantes">8–12 séries por músculo; foco em técnica; progressão quase a cada treino.</Item>
            <Item titulo="Avançados">12–20 séries; RIR 0–2; deload quando a fadiga acumula; superávit calórico menor.</Item>
            <Item titulo="Mulheres">
              Roberts, Nuckols & Krieger (2020): hipertrofia e força de pernas aumentaram de forma parecida em homens e mulheres. Mesmo
              treino, sem necessidade de “treino feminino” com cargas leves.
            </Item>
            <Item titulo="Acima de 40–50 anos">
              Continuam ganhando força e músculo. Proteína no topo da faixa (~2 g/kg); mais atenção a aquecimento e recuperação.
            </Item>
            <Item titulo="Quem quer emagrecer">
              Manter o treino pesado durante o déficit; proteína alta; perder 0,5–1% do peso por semana.
            </Item>
          </ul>
          <p className="text-sm font-semibold text-alerta-texto">
            Pessoas com lesões, doenças cardíacas, hipertensão não controlada ou gestantes devem ter liberação médica e acompanhamento
            profissional.
          </p>
        </Secao>

        <Secao titulo="Mitos comuns">
          <Tabela
            cabecalho={['Mito', 'O que a ciência mostra']}
            linhas={[
              ['“Só cresce com peso pesado”', 'Cargas leves crescem igual se a série for perto da falha (Schoenfeld 2017)'],
              ['“Tem que ir até a falha em toda série”', 'Parar a 1–3 reps da falha dá resultado parecido com menos fadiga (Refalo 2023, 2024)'],
              ['“Proteína em até 30 min após o treino”', 'O total do dia é o que mais importa (Schoenfeld 2013)'],
              ['“Só aproveita 20–30 g por refeição”', 'Refeições maiores também são aproveitadas; ~0,4 g/kg em 4+ refeições (Schoenfeld & Aragon 2018)'],
              ['“Cardio mata os ganhos”', 'Não atrapalha hipertrofia nem força máxima (Schumann 2022)'],
              ['“Cada músculo só uma vez por semana”', '2x por semana é melhor quando o volume não é igualado (Schoenfeld 2016)'],
              ['“Mulher que treina pesado fica enorme”', 'Ganham músculo na mesma proporção, com menos massa absoluta (Roberts 2020)'],
              ['“Creatina faz mal aos rins”', 'Segura em pessoas saudáveis em uso curto e longo (ISSN 2017)'],
              ['“Abdominal queima a gordura da barriga”', 'Não existe perda de gordura localizada; depende do déficit calórico total'],
              ['“Descanso curto faz crescer mais”', 'Descansar mais de 60–90 s é igual ou melhor (Singer 2024)'],
              ['“Trocar o treino toda semana”', 'O que funciona é progredir; trocar demais impede medir a evolução'],
            ]}
          />
        </Secao>

        <Secao titulo="Referências">
          <Refs
            titulo="Diretrizes"
            itens={[
              'ACSM (2026). Resistance Training Prescription for Muscle Function, Hypertrophy, and Physical Performance in Healthy Adults: An Overview of Reviews. Medicine & Science in Sports & Exercise.',
              'Kreider et al. (2017). ISSN position stand: safety and efficacy of creatine supplementation.',
              'Guest et al. (2021). ISSN position stand: caffeine and exercise performance.',
            ]}
          />
          <Refs
            titulo="Treino"
            itens={[
              'Schoenfeld, Ogborn & Krieger (2017). Dose-response relationship between weekly resistance training volume and increases in muscle mass. J Sports Sci.',
              'Schoenfeld, Ogborn & Krieger (2016). Effects of Resistance Training Frequency on Measures of Muscle Hypertrophy. Sports Med.',
              'Schoenfeld, Grgic, Ogborn & Krieger (2017). Strength and Hypertrophy Adaptations Between Low- vs. High-Load Resistance Training. J Strength Cond Res.',
              'Refalo et al. (2023). Influence of Resistance Training Proximity-to-Failure on Skeletal Muscle Hypertrophy. Sports Med 53(3).',
              'Robinson et al. (2024). Exploring the dose-response relationship between estimated resistance training proximity to failure, strength gain, and muscle hypertrophy.',
              'Refalo et al. (2024). Similar muscle hypertrophy following eight weeks of resistance training to momentary muscular failure or with repetitions-in-reserve. J Sports Sci.',
              'Singer et al. (2024). Give it a rest: inter-set rest interval duration and muscle hypertrophy. Front Sports Act Living.',
              'Wolf et al. (2023). Partial Vs Full Range of Motion Resistance Training. Int J Strength Cond.',
              'Schoenfeld, Ogborn & Krieger (2015). Effect of Repetition Duration During Resistance Training on Muscle Hypertrophy. Sports Med.',
              'Coleman et al. (2024). Gaining more from doing less? The effects of a one-week deload period. PeerJ.',
              'Schumann et al. (2022). Compatibility of Concurrent Aerobic and Strength Training. Sports Med.',
              'Roberts, Nuckols & Krieger (2020). Sex Differences in Resistance Training. J Strength Cond Res.',
            ]}
          />
          <Refs
            titulo="Nutrição e recuperação"
            itens={[
              'Morton et al. (2018). Protein supplementation and resistance training-induced gains in muscle mass and strength. Br J Sports Med.',
              'Schoenfeld & Aragon (2018). How much protein can the body use in a single meal for muscle-building?. JISSN.',
              'Schoenfeld, Aragon & Krieger (2013). The effect of protein timing on muscle strength and hypertrophy. JISSN.',
              'Helms, Aragon & Fitschen (2014). Evidence-based recommendations for natural bodybuilding contest preparation. JISSN.',
              'Iraki et al. (2019). Nutrition Recommendations for Bodybuilders in the Off-Season. Sports.',
              'Lamon et al. (2021). The effect of acute sleep deprivation on skeletal muscle protein synthesis. Physiol Rep.',
            ]}
          />
          <p className="text-sm text-secundario">
            Para continuar estudando: livro <em>Science and Development of Muscle Hypertrophy</em> (Brad Schoenfeld); site Stronger By
            Science (Greg Nuckols); pesquisadores Brad Schoenfeld, James Krieger, Stuart Phillips, Eric Helms, Menno Henselmans e, no
            Brasil, Paulo Gentil.
          </p>
        </Secao>

        <p className="text-center text-xs text-secundario">Versão {__VERSAO__}</p>
      </div>
    </>
  );
}

function Aviso() {
  return (
    <p className="rounded-xl border border-borda bg-cartao px-4 py-3 text-sm text-secundario">
      Conteúdo informativo. Não substitui orientação de médico, nutricionista ou profissional de educação física.
    </p>
  );
}

function Secao({ titulo, aberta, children }: { titulo: string; aberta?: boolean; children: ReactNode }) {
  return (
    <details open={aberta} className="group rounded-xl bg-cartao">
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 py-3 font-semibold [&::-webkit-details-marker]:hidden">
        <span className="flex-1">{titulo}</span>
        <span aria-hidden="true" className="text-secundario transition-transform group-open:rotate-180">
          ▾
        </span>
      </summary>
      <div className="flex flex-col gap-3 px-4 pb-4 leading-relaxed">{children}</div>
    </details>
  );
}

function Item({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <li className="text-sm">
      <p className="font-semibold">{titulo}</p>
      <p className="text-secundario">{children}</p>
    </li>
  );
}

function Tabela({ cabecalho, linhas }: { cabecalho: string[]; linhas: string[][] }) {
  return (
    <div className="-mx-1 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            {cabecalho.map((c) => (
              <th key={c} className="px-1 py-2 text-left font-normal text-secundario">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhas.map((l, i) => (
            <tr key={i} className="border-t border-borda align-top">
              {l.map((c, j) => (
                <td key={j} className={`px-1 py-2 ${j === 0 ? 'font-medium' : ''}`}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Refs({ titulo, itens }: { titulo: string; itens: string[] }) {
  return (
    <div>
      <p className="font-semibold">{titulo}</p>
      <ul className="mt-1 flex list-disc flex-col gap-1 pl-5 text-sm text-secundario">
        {itens.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
    </div>
  );
}
