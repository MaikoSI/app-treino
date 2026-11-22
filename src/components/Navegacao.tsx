import { NavLink } from 'react-router-dom';
import { IconeAjustes, IconeCalendario, IconeGrafico, IconeHalter, IconeInicio } from './Icones';

const itens = [
  { para: '/', rotulo: 'Início', Icone: IconeInicio },
  { para: '/programas', rotulo: 'Programas', Icone: IconeHalter },
  { para: '/historico', rotulo: 'Histórico', Icone: IconeCalendario },
  { para: '/progresso', rotulo: 'Progresso', Icone: IconeGrafico },
  { para: '/config', rotulo: 'Ajustes', Icone: IconeAjustes },
];

export function Navegacao() {
  return (
    <nav className="pb-seguro fixed inset-x-0 bottom-0 z-30 vidro border-t border-borda/60">
      <ul className="mx-auto flex max-w-lg">
        {itens.map(({ para, rotulo, Icone }) => (
          <li key={para} className="flex-1">
            <NavLink
              to={para}
              end={para === '/'}
              className={({ isActive }) =>
                `flex min-h-14 flex-col items-center justify-center gap-0.5 text-[0.6875rem] font-medium ${isActive ? 'text-primaria-texto' : 'text-secundario'}`
              }
            >
              <Icone />
              {rotulo}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
