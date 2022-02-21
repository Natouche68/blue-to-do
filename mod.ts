// deno-lint-ignore-file no-case-declarations

import * as cliffyColors from "https://deno.land/x/cliffy@v0.20.1/ansi/mod.ts";
import * as cliffyPrompt from "https://deno.land/x/cliffy@v0.20.1/prompt/mod.ts";
import Kia from "https://deno.land/x/kia@0.4.1b/mod.ts";

type Todo = {
  name: string;
  completed: boolean;
};

let changesSaved = true;
let fileDirToEdit = "";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function header() {
  console.clear();

  const data = `
                                                                         
         ____    _                   _                 _                 
        | __ )  | |  _   _    ___   | |_    ___     __| |   ___          
        |  _ \\  | | | | | |  / _ \\  | __|  / _ \\   / _  |  / _ \\         
        | |_) | | | | |_| | |  __/  | |_  | (_) | | (_| | | (_) |        
        |____/  |_|  \\__,_|  \\___|   \\__|  \\___/   \\__,_|  \\___/         
                                                                         
                                                                         `;

  console.log(cliffyColors.colors.bgWhite.blue(data));
  console.log("\n");
}

async function mainMenu() {
  header();
  await sleep(100);

  const actions: string = await cliffyPrompt.Select.prompt({
    message: "What will you do ?",
    options: [
      "➕ Create a new file",
      "📝 Open and edit a file",
      "👀 Show a file",
      "⏪ Exit Blue To-Do",
    ],
  });

  switch (actions) {
    case "➕ Create a new file":
      const fileToCreateInput: string = await cliffyPrompt.Input.prompt(
        "What's the name of the file you will create and edit ? " +
          cliffyColors.colors.gray("(you don't need to type the extension)"),
      );

      fileDirToEdit = fileToCreateInput.endsWith(".bluetodo")
        ? fileToCreateInput
        : fileToCreateInput + ".bluetodo";

      try {
        const blankFile: { todos: Todo[] } = { todos: [] };
        Deno.writeTextFileSync(fileDirToEdit, JSON.stringify(blankFile));

        await editFile(blankFile.todos);
      } catch (error) {
        console.log(
          cliffyColors.colors.red.bold(
            "❌ Sorry, there is a error during the file creation... \nMaybe a file with name exists already.",
          ),
        );
        console.error(error);
      }
      break;

    case "📝 Open and edit a file":
      const fileToEditDir: string = await cliffyPrompt.Input.prompt(
        "Which file will you open and edit ? " +
          cliffyColors.colors.gray("(you don't need to type the extension)"),
      );

      fileDirToEdit = fileToEditDir.endsWith(".bluetodo")
        ? fileToEditDir
        : fileToEditDir + ".bluetodo";

      try {
        const dataFromFileToEdit = Deno.readTextFileSync(fileDirToEdit);
        const todosFromFileToEdit = JSON.parse(dataFromFileToEdit);

        await editFile(todosFromFileToEdit.todos);
      } catch (error) {
        console.log(
          cliffyColors.colors.red.bold(
            "❌ Sorry, there is a error... \nMaybe the file has been renamed, moved, or deleted.",
          ),
        );
        console.error(error);
      }
      break;

    case "👀 Show a file":
      const fileDir: string = await cliffyPrompt.Input.prompt(
        "Which file will you open and see ? " +
          cliffyColors.colors.gray("(you don't need to type the extension)"),
      );

      const fileDirToShow = fileDir.endsWith(".bluetodo")
        ? fileDir
        : fileDir + ".bluetodo";

      try {
        const data = Deno.readTextFileSync(fileDirToShow);
        const todos = JSON.parse(data);

        showFile(todos.todos);
      } catch (error) {
        console.log(
          cliffyColors.colors.red.bold(
            "❌ Sorry, there is a error... \nMaybe the file has been renamed, moved, or deleted.",
          ),
        );
        console.error(error);
      }
      break;

    case "⏪ Exit Blue To-Do":
      console.clear();
      Deno.exit(0);
      break;

    default:
      console.log(
        cliffyColors.colors.red.bold("❌ Sorry, there is a uncaught error..."),
      );
      Deno.exit(1);
  }
}

async function editFile(todos: Todo[]) {
  header();

  const options = [];

  todos.forEach((todo) => {
    options.push(`${todo.completed ? "✅" : "❌"} ${todo.name}`);
  });

  options.push(cliffyPrompt.Select.separator("----------"));
  options.push("➕ Add a todo");
  options.push("💣 Delete todo(s)");
  options.push("💾 Save file");
  options.push("⏪ Return to the main menu");

  const optionsInput: string = await cliffyPrompt.Select.prompt({
    message: "Choose a todo to (un)check it, or select a other option !",
    options,
  });

  switch (optionsInput) {
    case "➕ Add a todo":
      console.log("");

      const todoToAdd: string = await cliffyPrompt.Input.prompt(
        "What's the name of the todo you will add ?",
      );

      todos.push({
        name: todoToAdd,
        completed: false,
      });

      changesSaved = false;
      await editFile(todos);

      break;

    case "💣 Delete todo(s)":
      console.log("");

      const todosThatCanBeDeleted: string[] = [];
      todos.forEach((todo) => {
        todosThatCanBeDeleted.push(
          `${todo.completed ? "✅" : "❌"} ${todo.name}`,
        );
      });

      const todosToDelete: string[] = await cliffyPrompt.Checkbox.prompt({
        message: "Which todo(s) will you delete ?",
        options: todosThatCanBeDeleted,
      });

      todosToDelete.forEach((todoToDelete: string) => {
        let todoToDeleteIndex = 0;

        const todoToDeleteArrayWithoutSpaces = todoToDelete.split(" ");
        todoToDeleteArrayWithoutSpaces.splice(0, 1);
        const selectedTodo = todoToDeleteArrayWithoutSpaces.join(" ");

        todos.forEach((todo, index) => {
          if (todo.name == selectedTodo) {
            todoToDeleteIndex = index;
          }
        });
        todos.splice(todoToDeleteIndex, 1);
      });

      changesSaved = false;
      await editFile(todos);

      break;

    case "💾 Save file":
      const todosToSave = JSON.stringify({
        todos,
      });

      const spinner = new Kia("Saving todos file...");
      spinner.start();
      await sleep(750);

      try {
        Deno.writeTextFileSync(fileDirToEdit, todosToSave);

        spinner.succeed("Todos file saved !");
        changesSaved = true;
      } catch (error) {
        spinner.fail("Sorry, there is a error...");
        console.error(error);
        Deno.exit(1);
      }

      await sleep(1400);
      await editFile(todos);

      break;

    case "⏪ Return to the main menu":
      console.log("");

      if (changesSaved) {
        await mainMenu();
      } else {
        const exitConfirmation: boolean = await cliffyPrompt.Toggle.prompt(
          cliffyColors.colors.red(
            "There are unsaved changes. Will you really exit ?",
          ),
        );

        if (exitConfirmation) {
          await mainMenu();
        } else {
          await editFile(todos);
        }
      }

      break;

    default:
      const selectedTodoArrayWithoutSpaces = optionsInput.split(
        " ",
      );
      selectedTodoArrayWithoutSpaces.splice(0, 1);
      const selectedTodo = selectedTodoArrayWithoutSpaces.join(" ");
      todos.forEach((todo) => {
        if (todo.name == selectedTodo) {
          todo.completed = !todo.completed;
        }
      });

      changesSaved = false;
      await editFile(todos);

      break;
  }
}

function showFile(todos: Todo[]) {
  header();

  todos.forEach((todo) => {
    console.log(`${todo.completed ? "✅" : "❌"} ${todo.name}`);
  });

  console.log("");
}

await mainMenu();
