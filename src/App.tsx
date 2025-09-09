import { ThreeRoot } from "./contexts/ThreeContext";
import { NotesProvider } from "./contexts/NotesContext";
import { Board } from "./components/Board";
import { NotesLayer } from "./components/NotesLayer";
import { Toolbar } from "./components/Toolbar";

export default function App() {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        background: "linear-gradient(180deg,#f7f4ed,#efe6d6)",
      }}
    >
      <NotesProvider>
        <ThreeRoot>
          <Board />
          <NotesLayer />
          <Toolbar />
        </ThreeRoot>
      </NotesProvider>
    </div>
  );
}
