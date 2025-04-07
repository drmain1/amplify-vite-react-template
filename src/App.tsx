import { useEffect, useState } from "react";
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import OcrFormProcessor from "./components/OcrFormProcessor";
import PatientFormList from "./components/PatientFormList";
import "./components/OcrFormProcessor.css";
import "./components/PatientFormList.css";

const client = generateClient<Schema>();

type ViewType = "todos" | "ocrForm" | "patientForms";

function App() {
  const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);
  const [currentView, setCurrentView] = useState<ViewType>("todos");

  useEffect(() => {
    client.models.Todo.observeQuery().subscribe({
      next: (data) => setTodos([...data.items]),
    });
  }, []);

  function createTodo() {
    client.models.Todo.create({ content: window.prompt("Todo content") });
  }

  return (
    <main>
      <div className="app-header">
        <h1>AWS Amplify with Mistral AI OCR</h1>
        <div className="toggle-buttons">
          <button 
            onClick={() => setCurrentView("todos")}
            className={currentView === "todos" ? "active" : ""}
          >
            Todos
          </button>
          <button 
            onClick={() => setCurrentView("ocrForm")}
            className={currentView === "ocrForm" ? "active" : ""}
          >
            OCR Form
          </button>
          <button 
            onClick={() => setCurrentView("patientForms")}
            className={currentView === "patientForms" ? "active" : ""}
          >
            View Patient Forms
          </button>
        </div>
      </div>

      {currentView === "todos" && (
        <div className="todos-container">
          <h2>My todos</h2>
          <button onClick={createTodo}>+ new</button>
          <ul>
            {todos.map((todo) => (
              <li key={todo.id}>{todo.content}</li>
            ))}
          </ul>
          <div className="info-message">
            🥳 App successfully hosted. Try creating a new todo.
            <br />
            <a href="https://docs.amplify.aws/react/start/quickstart/#make-frontend-updates">
              Review next step of this tutorial.
            </a>
          </div>
        </div>
      )}

      {currentView === "ocrForm" && (
        <OcrFormProcessor />
      )}

      {currentView === "patientForms" && (
        <PatientFormList />
      )}
    </main>
  );
}

export default App;