import { ThreeRoot } from "./contexts/ThreeContext";
import { NotesProvider } from "./contexts/NotesContext";
import { Board } from "./components/Board";
import NotesLayer from "./components/NotesLayer";
import { Toolbar } from "./components/Toolbar";

const App: React.FC = () => {
  return (
    <div className="relative w-full h-screen bg-[linear-gradient(180deg,#f7f4ed,#efe6d6)]">
      <NotesProvider>
        <ThreeRoot>
          <Board />
          <NotesLayer />
          <Toolbar />
        </ThreeRoot>
      </NotesProvider>
    </div>
  );
};

export default App;
