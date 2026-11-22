/**
 * Manequim 3D executando o exercício (three.js, carregado sob demanda por Demonstracao).
 * Arrastar gira a câmera; a animação para fora da tela e com a aba oculta.
 */
import { useEffect, useRef, useState } from 'react';
import {
  AmbientLight,
  Box3,
  CircleGeometry,
  Color,
  DirectionalLight,
  Mesh,
  MeshStandardMaterial,
  PCFSoftShadowMap,
  PerspectiveCamera,
  Scene,
  Sphere,
  Vector3,
  WebGLRenderer,
} from 'three';
import type { GrupoMuscular } from '../db/tipos';
import { posicoes } from '../lib/esqueleto';
import { duracaoCiclo, poseNoTempo, posesExtremas } from '../lib/execucao';
import type { Execucao } from '../lib/execucoes';
import { corDoTema, type TemaEfetivo } from '../lib/tema';
import { montarEquipamento, type Peca } from './cena3d/equipamentos';
import { type CoresCena, criarManequim, type Manequim } from './cena3d/manequim';
import { IconePausa, IconePlay, IconeRecomecar } from './Icones';
import { Botao } from './ui';

const RAD = Math.PI / 180;

function lerCores(): CoresCena {
  return {
    corpo: corDoTema('--boneco-corpo'),
    destaque: corDoTema('--destaque'),
    estofado: corDoTema('--boneco-estofado'),
    metal: corDoTema('--boneco-metal'),
    peso: corDoTema('--boneco-peso'),
    chao: corDoTema('--boneco-chao'),
  };
}

interface Cena {
  manequim: Manequim;
  pecas: Peca[];
  chao: MeshStandardMaterial;
  desenhar: () => void;
}

export default function Boneco3D({
  execucao,
  grupo,
  tema,
  estatico,
}: {
  execucao: Execucao;
  grupo?: GrupoMuscular;
  tema: TemaEfetivo;
  /** Sem animação: mostra só a pose de início ou de fim. */
  estatico?: 'inicio' | 'fim';
}) {
  const caixa = useRef<HTMLDivElement>(null);
  const cena = useRef<Cena | null>(null);
  const [tocando, setTocando] = useState(true);
  const tocandoRef = useRef(true);
  const recomecar = useRef<() => void>(() => {});
  const retomar = useRef<() => void>(() => {});

  useEffect(() => {
    const el = caixa.current;
    if (!el) return;
    const { receita } = execucao;
    const cores = lerCores();

    const renderer = new WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFSoftShadowMap;
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    el.appendChild(renderer.domElement);

    const scene = new Scene();
    scene.add(new AmbientLight(0xffffff, 1.1));
    const sol = new DirectionalLight(0xffffff, 2.2);
    sol.position.set(1.5, 4, 2.5);
    sol.castShadow = true;
    sol.shadow.mapSize.set(1024, 1024);
    Object.assign(sol.shadow.camera, { left: -2, right: 2, top: 2, bottom: -2, near: 0.5, far: 10 });
    sol.shadow.radius = 4;
    scene.add(sol);
    const fill = new DirectionalLight(0xffffff, 0.6);
    fill.position.set(-2, 1.5, -1.5);
    scene.add(fill);

    const chaoMat = new MeshStandardMaterial({ color: new Color(cores.chao), roughness: 1 });
    const chao = new Mesh(new CircleGeometry(1.9, 48), chaoMat);
    chao.rotation.x = -Math.PI / 2;
    chao.receiveShadow = true;
    scene.add(chao);

    const manequim = criarManequim(cores);
    manequim.destacar(grupo);
    scene.add(manequim.raiz);
    const pecas = receita.cena.map((e) => montarEquipamento(e, manequim, cores));
    for (const p of pecas) if (!p.objeto.parent) scene.add(p.objeto);

    const { inicio, fim } = posesExtremas(receita);
    const posar = (ms: number) => {
      const pose = estatico ? (estatico === 'inicio' ? inicio : fim) : poseNoTempo(receita, ms);
      manequim.aplicarPose(pose);
      manequim.raiz.updateMatrixWorld(true);
      for (const p of pecas) p.atualizar(pose);
    };

    // Câmera mirando o centro do movimento: corpo nas poses de início e fim, mais o equipamento.
    const caixaMov = new Box3();
    for (const p of [inicio, fim]) for (const v of Object.values(posicoes(p))) caixaMov.expandByPoint(new Vector3(...v));
    const caixaTudo = caixaMov.clone();
    for (const ms of [0, duracaoCiclo(receita) / 2]) {
      posar(ms);
      caixaTudo.expandByObject(manequim.raiz);
      for (const p of pecas) caixaTudo.expandByObject(p.objeto);
    }
    const alvo = caixaMov.getCenter(new Vector3()).lerp(caixaTudo.getCenter(new Vector3()), 0.5);
    const raio = caixaTudo.getBoundingSphere(new Sphere()).radius;
    const camera = new PerspectiveCamera(34, 4 / 3, 0.05, 30);
    const orbita = { az: receita.camera.azimute, el: receita.camera.elevacao };
    const posicionarCamera = () => {
      // Distância para a esfera da cena caber no menor dos dois ângulos de visão.
      const vfov = (camera.fov * RAD) / 2;
      const hfov = Math.atan(Math.tan(vfov) * camera.aspect);
      const d = (raio * 0.92) / Math.sin(Math.min(vfov, hfov));
      camera.position.set(
        alvo.x + d * Math.sin(orbita.az * RAD) * Math.cos(orbita.el * RAD),
        alvo.y + d * Math.sin(orbita.el * RAD),
        alvo.z + d * Math.cos(orbita.az * RAD) * Math.cos(orbita.el * RAD),
      );
      camera.lookAt(alvo);
    };
    posicionarCamera();

    const desenhar = () => renderer.render(scene, camera);

    const redimensionar = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      posicionarCamera();
      desenhar();
    };
    const ro = new ResizeObserver(redimensionar);
    ro.observe(el);

    // Laço da animação: só roda tocando, visível na tela e com a aba ativa.
    let visivel = true;
    let quadro = 0;
    let tempo = 0;
    let ultimo = 0;
    const total = duracaoCiclo(receita);
    const passo = (agora: number) => {
      quadro = 0;
      if (ultimo) tempo = (tempo + (agora - ultimo)) % total;
      ultimo = agora;
      posar(tempo);
      desenhar();
      agendar();
    };
    const agendar = () => {
      if (quadro || estatico || !tocandoRef.current || !visivel || document.hidden) {
        if (!quadro) ultimo = 0;
        return;
      }
      quadro = requestAnimationFrame(passo);
    };
    const parar = () => {
      cancelAnimationFrame(quadro);
      quadro = 0;
      ultimo = 0;
    };
    const io = new IntersectionObserver(([e]) => {
      visivel = e.isIntersecting;
      if (visivel) agendar();
      else parar();
    });
    io.observe(el);
    const aba = () => (document.hidden ? parar() : agendar());
    document.addEventListener('visibilitychange', aba);

    // Arrastar para girar.
    let arrasto: { x: number; y: number; az: number; el: number } | null = null;
    const apertar = (e: PointerEvent) => {
      arrasto = { x: e.clientX, y: e.clientY, az: orbita.az, el: orbita.el };
      el.setPointerCapture(e.pointerId);
    };
    const mover = (e: PointerEvent) => {
      if (!arrasto) return;
      orbita.az = arrasto.az - (e.clientX - arrasto.x) * 0.5;
      if (e.pointerType === 'mouse') orbita.el = Math.max(5, Math.min(80, arrasto.el + (e.clientY - arrasto.y) * 0.3));
      posicionarCamera();
      if (!quadro) desenhar();
    };
    const soltar = () => {
      arrasto = null;
    };
    el.addEventListener('pointerdown', apertar);
    el.addEventListener('pointermove', mover);
    el.addEventListener('pointerup', soltar);
    el.addEventListener('pointercancel', soltar);

    recomecar.current = () => {
      orbita.az = receita.camera.azimute;
      orbita.el = receita.camera.elevacao;
      posicionarCamera();
      tempo = 0;
      ultimo = 0;
      posar(0);
      desenhar();
      agendar();
    };

    retomar.current = agendar;
    cena.current = { manequim, pecas, chao: chaoMat, desenhar };
    posar(0);
    redimensionar();
    agendar();

    return () => {
      parar();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener('visibilitychange', aba);
      el.removeEventListener('pointerdown', apertar);
      el.removeEventListener('pointermove', mover);
      el.removeEventListener('pointerup', soltar);
      el.removeEventListener('pointercancel', soltar);
      for (const p of pecas) p.descartar();
      manequim.descartar();
      chao.geometry.dispose();
      chaoMat.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      cena.current = null;
    };
  }, [execucao, grupo, estatico]);

  // Troca de tema: recolore sem remontar a cena.
  // biome-ignore lint/correctness/useExhaustiveDependencies: `tema` é o gatilho; as cores vêm do CSS já atualizado.
  useEffect(() => {
    const c = cena.current;
    if (!c) return;
    const cores = lerCores();
    c.manequim.definirCores(cores);
    for (const p of c.pecas) p.definirCores(cores);
    c.chao.color = new Color(cores.chao);
    c.desenhar();
  }, [tema]);

  function alternar() {
    tocandoRef.current = !tocandoRef.current;
    setTocando(tocandoRef.current);
    if (tocandoRef.current) retomar.current();
  }

  return (
    <div className="relative">
      <div
        ref={caixa}
        role="img"
        aria-label={estatico ? `${estatico === 'inicio' ? 'Início' : 'Fim'} do movimento: ${execucao.descricao}` : execucao.descricao}
        className={`w-full cursor-grab touch-pan-y overflow-hidden rounded-controle active:cursor-grabbing ${estatico ? 'aspect-square' : 'aspect-[4/3]'}`}
      />
      {!estatico && (
        <div className="absolute right-2 bottom-2 flex gap-2">
          <Botao pequeno aria-label={tocando ? 'Pausar animação' : 'Reproduzir animação'} onClick={alternar}>
            {tocando ? <IconePausa /> : <IconePlay />}
          </Botao>
          <Botao pequeno aria-label="Ver de novo do começo" onClick={() => recomecar.current()}>
            <IconeRecomecar />
          </Botao>
        </div>
      )}
    </div>
  );
}
