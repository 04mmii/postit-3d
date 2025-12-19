import { ThreeRoot } from "./contexts/ThreeContext";
import { NotesProvider } from "./contexts/NotesContext";
import { Board3D } from "./components/Board3D";
import NotesLayer from "./components/NotesLayer";
import { Toolbar } from "./components/Toolbar";

const App: React.FC = () => {
  return (
    <div className="relative w-full h-screen">
      <NotesProvider>
        <ThreeRoot>
          <Board3D />
          <NotesLayer />
          <Toolbar />
        </ThreeRoot>
      </NotesProvider>
    </div>
  );
};

export default App;
