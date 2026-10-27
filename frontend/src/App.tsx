import { BrowserRouter, Routes, Route, useSearchParams } from 'react-router-dom';
import Portal from './pages/Portal';
import Dashboard from './pages/Dashboard';
import InventarioEquipamentos from './pages/InventarioEquipamentos';
import CadastroEquipamento from './pages/CadastroEquipamento';
import EfetivoAgentes from './pages/EfetivoAgentes';
import CadastroAgente from './pages/CadastroAgente';
import InteligenciaPreditiva from './pages/InteligenciaPreditiva';
import GestaoCrises from './pages/GestaoCrises';

function RootRoute() {
  const [searchParams] = useSearchParams();
  if (searchParams.has('lat') && searchParams.has('lng')) {
    return <Dashboard />;
  }
  return <Portal />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRoute />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/inventario" element={<InventarioEquipamentos />} />
        <Route path="/cadastro-equipamento" element={<CadastroEquipamento />} />
        <Route path="/cadastro-equipamento/:id" element={<CadastroEquipamento />} />
        <Route path="/efetivo" element={<EfetivoAgentes />} />
        <Route path="/efetivo-agentes" element={<EfetivoAgentes />} />
        <Route path="/cadastro-agente" element={<CadastroAgente />} />
        <Route path="/cadastro-agente/:id" element={<CadastroAgente />} />
        <Route path="/inteligencia" element={<InteligenciaPreditiva />} />
        <Route path="/crises" element={<GestaoCrises />} />
        <Route path="/gestao-crises" element={<GestaoCrises />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
