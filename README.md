# Treino

App de musculação para registrar treinos pelo celular. É um **PWA**: abre no navegador, pode ser instalado na tela inicial como um app e **funciona sem internet**.

Não tem login, nem servidor, nem conta. **Todos os dados ficam só no aparelho de cada pessoa** (no navegador, via IndexedDB). Cada amigo que instalar tem os seus próprios dados, separados.

## O que o app faz

- **Boas-vindas:** você diz quantos dias treina (2 a 6) e o app sugere uma divisão pronta (Full Body, ABC, Superiores/Inferiores, ABCDE, Push/Pull/Legs), que dá para editar.
- **Início:** próximo treino sugerido, meta da semana ("2/4 treinos esta semana") e sequência de semanas cumprindo a meta.
- **Treino em andamento:**
  - carga e repetições já vêm com o que você fez da última vez;
  - descanso começa sozinho ao marcar a série, com vibração no fim e botões ±15s;
  - dica "Tente +2,5 kg" (+5 kg em perna) quando você bate o máximo de reps em todas as séries;
  - comemoração quando bate recorde;
  - calculadora de anilhas;
  - se fechar o app no meio, o treino continua de onde parou.
- **Programas:** criar, editar, duplicar, escolher o ativo, reordenar dias e exercícios.
- **Histórico:** calendário com os dias treinados e o detalhe de cada treino.
- **Progresso:** gráfico de carga máxima e 1RM estimado (fórmula de Epley) por exercício, recordes pessoais e séries por grupo muscular na semana.
- **Ajustes:** meta semanal, descanso padrão, RPE opcional, exportar e importar backup (.json).

## Rodar no computador

Precisa do [Node.js](https://nodejs.org) 22 ou mais novo.

```bash
npm install
npm run dev
```

Abra o endereço que aparecer (normalmente http://localhost:5173).

Outros comandos:

| Comando | O que faz |
|---|---|
| `npm test` | roda os testes (Vitest) |
| `npm run build` | gera a versão final na pasta `dist/` |
| `npm run preview` | serve a pasta `dist/` para testar a versão final (com offline) |

## Testar no celular pela mesma rede Wi-Fi

1. Deixe o computador e o celular **na mesma rede Wi-Fi**.
2. Rode `npm run dev`. O terminal mostra duas linhas, por exemplo:
   ```
   ➜  Local:   http://localhost:5173/
   ➜  Network: http://192.168.0.15:5173/
   ```
3. No celular, abra o endereço da linha **Network**.

Se não abrir, o firewall do computador pode estar bloqueando a porta 5173. Libere essa porta ou desative o firewall temporariamente.

> **Importante:** pela rede local o endereço é `http://` (sem o "s"). Assim dá para usar e testar o app, mas **instalar na tela inicial e o modo offline só funcionam com `https://`**. Para testar a instalação de verdade, publique (próxima seção). É grátis e leva poucos minutos.

## Publicar de graça

O app é só um site estático (a pasta `dist/`), então qualquer hospedagem estática serve. As duas mais simples:

### Opção 1: GitHub Pages

O projeto já vem com o arquivo `.github/workflows/deploy.yml`, que publica sozinho a cada envio para o GitHub.

1. Crie um repositório no [GitHub](https://github.com) e envie o projeto para a branch `main`:
   ```bash
   git remote add origin https://github.com/SEU-USUARIO/SEU-REPO.git
   git push -u origin main
   ```
2. No repositório, vá em **Settings > Pages** e, em **Source**, escolha **GitHub Actions**.
3. Na aba **Actions**, espere o "Publicar no GitHub Pages" ficar verde (1 a 2 minutos). Se ele rodou antes do passo 2 e falhou, clique nele e em **Re-run jobs**.
4. O app fica em `https://SEU-USUARIO.github.io/SEU-REPO/`.

Nada mais precisa ser configurado. O app usa caminhos relativos e rotas com `#`, então funciona dentro da subpasta do repositório.

### Opção 2: Netlify

**Sem instalar nada (arrastar e soltar):**

1. Rode `npm run build`.
2. Entre em [app.netlify.com/drop](https://app.netlify.com/drop) e arraste a pasta `dist/` para a página.
3. Pronto: o Netlify mostra o endereço `https://algum-nome.netlify.app`. Para atualizar depois, repita o processo.

**Ligado ao GitHub (atualiza sozinho):** em [app.netlify.com](https://app.netlify.com), clique em **Add new site > Import an existing project** e escolha o repositório. As configurações já estão no arquivo `netlify.toml`, é só confirmar.

### Atualizações

Quando você publicar uma versão nova, quem já tem o app instalado vê o aviso **"Nova versão disponível"** e escolhe quando tocar em **Atualizar**. Os dados não são afetados.

## Instalar no celular

Abra o endereço publicado (`https://...`) uma vez com internet. Depois de instalado, o app funciona offline.

### Android (Chrome)

1. Abra o endereço no **Chrome**.
2. Toque no menu **⋮** (canto superior direito).
3. Toque em **Instalar app** (ou **Adicionar à tela inicial**).
4. Confirme. O ícone aparece na tela inicial e o app abre em tela cheia, sem a barra do navegador.

### iPhone (Safari)

1. Abra o endereço no **Safari**. Precisa ser o Safari: em outros navegadores, no iPhone, a opção pode não aparecer.
2. Toque no botão **Compartilhar** (o quadrado com a seta para cima).
3. Role a lista e toque em **Adicionar à Tela de Início**.
4. Toque em **Adicionar**.

No iPhone o celular não vibra no fim do descanso (o iOS não permite vibração em apps web). O app também toca um bipe, que só se ouve com o app aberto na tela e o celular fora do modo silencioso.

## Seus dados e backup

- Os treinos ficam **só neste aparelho e neste navegador**. O app instalado e o site aberto no navegador podem ter dados separados (principalmente no iPhone).
- Os dados **se perdem** se você limpar os dados do navegador, desinstalar o app ou trocar de celular.
- Por isso, de vez em quando, vá em **Ajustes > Exportar backup** e guarde o arquivo `.json` fora do celular (Google Drive, e-mail, WhatsApp...).
- Para restaurar (por exemplo, num celular novo), vá em **Ajustes > Importar backup** e escolha o arquivo. O app mostra o que tem no backup e pede confirmação antes de substituir os dados atuais.

## Estrutura do código

```
src/
  db/          banco local (Dexie): tipos, esquema, exercícios iniciais,
               divisões prontas, operações de programas/treinos, backup
  lib/         regras puras e testadas: 1RM, progressão, anilhas,
               próximo treino, meta semanal, gráficos/recordes
  components/  peças de interface reutilizáveis
  pages/       uma tela por arquivo
public/        ícones do app
```

Feito com Vite, React, TypeScript, Tailwind CSS, Dexie.js, React Router, Recharts e vite-plugin-pwa.
