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
    // Barra de abas flutuante, em pílula de vidro
    <nav className="pb-flutuante pointer-events-none fixed inset-x-0 bottom-0 z-30 px-4">
      <ul className="vidro-flutuante pointer-events-auto mx-auto flex max-w-md rounded-full p-1">
        {itens.map(({ para, rotulo, Icone }) => (
          <li key={para} className="flex-1">
            <NavLink
              to={para}
              end={para === '/'}
              className={({ isActive }) =>
                `pressionavel flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-full text-[0.6875rem] font-medium ${isActive ? 'bg-cartao-2 text-primaria-texto' : 'text-secundario'}`
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
