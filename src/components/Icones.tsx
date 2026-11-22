import {
  Calendar,
  ChartLine,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleHelp,
  Dumbbell,
  EllipsisVertical,
  Flame,
  House,
  Info,
  LoaderCircle,
  type LucideIcon,
  type LucideProps,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Settings,
  Timer,
  Trash2,
  Trophy,
  X,
} from 'lucide-react';

/**
 * Ícones do app: Lucide, com traço fino e consistente (no espírito dos SF Symbols).
 * Os componentes usam só estes nomes; para trocar a biblioteca, mexa apenas aqui.
 */
function icone(Base: LucideIcon) {
  const Icone = ({ strokeWidth = 1.75, ...p }: LucideProps) => <Base size={24} strokeWidth={strokeWidth} aria-hidden="true" {...p} />;
  Icone.displayName = Base.displayName;
  return Icone;
}

export const IconeInicio = icone(House);
export const IconeHalter = icone(Dumbbell);
export const IconeCalendario = icone(Calendar);
export const IconeGrafico = icone(ChartLine);
export const IconeAjustes = icone(Settings);
export const IconeVoltar = icone(ChevronLeft);
export const IconeAvancar = icone(ChevronRight);
export const IconeX = icone(X);
export const IconeCheck = icone(Check);
export const IconeMais = icone(Plus);
export const IconeCima = icone(ChevronUp);
export const IconeBaixo = icone(ChevronDown);
export const IconeLixo = icone(Trash2);
export const IconeFogo = icone(Flame);
export const IconeTrofeu = icone(Trophy);
export const IconeRelogio = icone(Timer);
export const IconeMenu = icone(EllipsisVertical);
export const IconeInfo = icone(Info);
export const IconeAjuda = icone(CircleHelp);
export const IconeCarregando = icone(LoaderCircle);
export const IconePlay = icone(Play);
export const IconePausa = icone(Pause);
export const IconeRecomecar = icone(RotateCcw);
