let sessions = [];

// Get sessions from storage
chrome.storage.local.get(["sessions"]).then((result) => {
  if (result.sessions) {
    sessions = result.sessions;
    renderSessions();
  }
});

function createSession() {
  const name = prompt("Please enter the name of the session");
  if (name === null || name === "") {
    alert("Name can't be empty");
    return;
  }

  if (sessions.some((session) => session.name === name)) {
    alert("Already exists with that name");
    return;
  }

  const session = {
    name: name,
    running: false,
    timer: Date.now(),
    elapsedTime: 0,
    notes: "",
  };

  sessions.push(session);
  renderSessions();
  updateSessionsInStorage();
}

function renderSessions() {
  let sessionsList = document.getElementById("sessions");
  const clearAllButton = document.getElementById("clear-all-btn");

  // Clear the ul element
  while (sessionsList.firstChild) {
    sessionsList.removeChild(sessionsList.firstChild);
  }

  if (sessions.length === 0) {
    clearAllButton.disabled = true;
  } else {
    clearAllButton.disabled = false;
    sessions.forEach((session) => {
      const sessionListItem = createSessionListItem(session);
      sessionsList.appendChild(sessionListItem);
    });
  }
}

function createSessionListItem(session) {
  // Create main list item
  let listItem = document.createElement("li");
  listItem.id = session.name;
  listItem.className = "list-group-item";
  if (session.running) {
    listItem.classList.add("active");
  }

  let generalDiv = document.createElement("div");
  generalDiv.className = "d-flex flex-row justify-content-between";
  listItem.appendChild(generalDiv);

  // Create information div
  let infoDiv = document.createElement("div");
  infoDiv.className = "d-flex flex-row justify-content-between";

  // Create company div
  let companyDiv = document.createElement("div");
  companyDiv.className = "p-2";
  if (session.name.length > 10) {
    companyDiv.textContent = session.name.substring(0, 10) + "...";
  } else {
    companyDiv.textContent = session.name;
  }

  // Create notes button
  let notesButton = document.createElement("button");
  notesButton.id = "notes-button";
  notesButton.type = "button";
  notesButton.className = "btn btn-info";

  // Create an icon element
  let notesIcon = document.createElement("i");
  notesIcon.className = "bi bi-file-text"; // Bootstrap Icons class for the "file-text" icon
  notesButton.appendChild(notesIcon);

  notesButton.addEventListener("click", () => {
    addNoteEditor(session);
  });

  // Create time div
  let timeDiv = document.createElement("div");
  timeDiv.className = "p-2";
  timeDiv.textContent = getFormattedTime(session);
  session.intervalId = setInterval(() => {
    timeDiv.textContent = getFormattedTime(session);
  }, 1000);
  // Append company, notes, and time to information div

  infoDiv.appendChild(companyDiv);
  infoDiv.appendChild(notesButton);
  infoDiv.appendChild(timeDiv);

  // Create actions div
  let actionsDiv = document.createElement("div");
  actionsDiv.className = "btn-group";
  actionsDiv.role = "group";
  actionsDiv.setAttribute("aria-label", "Basic mixed styles example");

  // Create start, pause, and delete buttons
  let startButton = document.createElement("button");
  startButton.type = "button";
  startButton.id = "start-button";
  startButton.className = "btn btn-success";

  // Create an icon element
  let startIcon = document.createElement("i");
  startIcon.className = "bi bi-play-fill"; // Bootstrap Icons class for the "play-fill" icon
  startButton.appendChild(startIcon);

  startButton.addEventListener("click", () => {
    startSession(session);
    updateAllSessions();
  });

  let pauseButton = document.createElement("button");
  pauseButton.type = "button";
  pauseButton.id = "pause-button";
  pauseButton.className = "btn btn-warning";
  pauseButton.disabled = true;

  // Create an icon element
  let pauseIcon = document.createElement("i");
  pauseIcon.className = "bi bi-pause-fill"; // Bootstrap Icons class for the "pause-fill" icon
  pauseButton.appendChild(pauseIcon);

  pauseButton.addEventListener("click", () => {
    pauseSession(session.name);
  });

  let deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.id = "delete-button";
  deleteButton.className = "btn btn-danger";

  // Create an icon element
  let deleteIcon = document.createElement("i");
  deleteIcon.className = "bi bi-trash-fill"; // Bootstrap Icons class for the "trash-fill" icon
  deleteButton.appendChild(deleteIcon);

  deleteButton.addEventListener("click", () => {
    removeSession(listItem, session);
  });
  PageTransitionEvent;

  // Append start, pause, and delete buttons to actions div
  actionsDiv.appendChild(startButton);
  actionsDiv.appendChild(pauseButton);
  actionsDiv.appendChild(deleteButton);

  // Append information and actions divs to main list item
  generalDiv.appendChild(infoDiv);
  generalDiv.appendChild(actionsDiv);

  updateButtonStatus(session, startButton, pauseButton);

  return listItem;
}

function updateSessionsInStorage() {
  chrome.storage.local.set({ sessions: sessions }, function () {
    console.log("Sessions updated");
  });
}

function removeSession(sessionDiv, session) {
  const confirmDelete = confirm(
    "Are you sure you want to delete this session?"
  );
  if (confirmDelete) {
    const index = sessions.findIndex((s) => s === session);
    if (index > -1) {
      sessions.splice(index, 1);
    }

    sessionDiv.parentNode.removeChild(sessionDiv);
    updateSessionsInStorage();
  }
}

function startSession(session) {
  // Pause all other sessions
  sessions.forEach((s) => {
    if (s !== session) {
      pauseSession(s.name);
    }
  });

  session.running = true;
  session.timer = Date.now();

  const listItem = document.getElementById(session.name);
  listItem.classList.add("active");

  updateSessionsInStorage();
}

function getFormattedTime(session) {
  let elapsedSeconds;
  if (session.running) {
    elapsedSeconds =
      Math.floor((Date.now() - session.timer) / 1000) + session.elapsedTime;
  } else {
    elapsedSeconds = session.elapsedTime;
  }
  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function updateButtonStatus(session, startButton, pauseButton) {
  if (session.running) {
    startButton.disabled = true;
    pauseButton.disabled = false;
  } else {
    startButton.disabled = false;
    pauseButton.disabled = true;
  }

  if (startButton.disabled) {
    startButton.className = "btn btn-secondary";
  } else {
    startButton.className = "btn btn-success";
  }
  
  if (pauseButton.disabled) {
    pauseButton.className = "btn btn-secondary";
  } else {
    pauseButton.className = "btn btn-warning";
  }
}

function getSessionButtons(listItem) {
  const startButton = listItem.querySelector("#start-button");
  const pauseButton = listItem.querySelector("#pause-button");
  console.log(listItem);

  return { startButton, pauseButton };
}

function addNoteEditor(session) {
  setNoteButtonsDisabled(true);
  const notes = session.notes; // Get the notes from the session

  // Create a new li element
  const li = document.createElement("li");

  // Create a div as a flex container
  const div = document.createElement("div");
  div.className = "d-flex flex-column";

  const title = document.createElement("h3");
  title.textContent = `Notes for ${session.name}`;
  title.className = "my-2";
  div.appendChild(title);

  const textarea = document.createElement("textarea");
  textarea.className = "form-control my-2"; // Bootstrap classes for styling the textarea
  textarea.value = notes;
  textarea.style.overflow = "hidden";
  textarea.style.resize = "none"; // Prevent manual resize
  textarea.addEventListener("input", autoResize, false);
  div.appendChild(textarea);

  const buttonDiv = document.createElement("div");
  buttonDiv.className = "d-flex flex-row justify-content-center gap-2";

  const saveButton = document.createElement("button");
  saveButton.className = "btn btn-primary my-2 mr-2"; // Added margin-right for spacing
  saveButton.textContent = "Save Notes";
  saveButton.addEventListener("click", () => {
    session.notes = textarea.value; // Set the session's notes to the textarea value
    li.parentNode.removeChild(li); // Remove the li
    setNoteButtonsDisabled(false);
    updateSessionsInStorage();
  });
  buttonDiv.appendChild(saveButton);

  const cancelButton = document.createElement("button");
  cancelButton.className = "btn btn-secondary my-2";
  cancelButton.textContent = "Cancel";
  cancelButton.addEventListener("click", () => {
    setNoteButtonsDisabled(false);
    li.parentNode.removeChild(li);
  });
  buttonDiv.appendChild(cancelButton);

  div.appendChild(buttonDiv);

  li.appendChild(div);

  // Append the new li to the ul
  const ul = document.getElementById("sessions");
  ul.appendChild(li);
  autoResize.call(textarea);
}

function autoResize() {
  this.style.height = "auto";
  this.style.height = this.scrollHeight + "px";
}

function updateAllSessions() {
  const clearAllButton = document.getElementById("clear-all-btn");

  if (sessions.length === 0) {
    clearAllButton.disabled = true;
  } else {
    clearAllButton.disabled = false;
    sessions.forEach((session) => {
      const listItem = document.getElementById(session.name);
      if (listItem) {
        const { startButton, pauseButton } = getSessionButtons(listItem);
        updateButtonStatus(session, startButton, pauseButton);
      }
    });
  }
}

function pauseSession(sessionName) {
  const session = sessions.find((s) => s.name === sessionName);
  if (session) {
    if (session.running) {
      const currentTime = Date.now();
      session.elapsedTime += Math.floor((currentTime - session.timer) / 1000);
      session.timer = currentTime; // Update the timer to the current time
    }
    session.running = false;
    const listItem = document.getElementById(sessionName);
    listItem.classList.remove("active");
    if (listItem) {
      const { startButton, pauseButton } = getSessionButtons(listItem);
      updateButtonStatus(session, startButton, pauseButton);
    }

    updateSessionsInStorage();
  } else {
    console.error(`Could not find session with name ${sessionName}`);
  }
}

function setNoteButtonsDisabled(disabled) {
  // Select all note buttons
  const noteButtons = document.querySelectorAll("#notes-button");

  // Iterate over the note buttons and set the disabled property
  noteButtons.forEach((button) => {
    button.disabled = disabled;
  });
}

document.getElementById("clear-all-btn").addEventListener("click", () => {
  const confirmClear = confirm("Are you sure you want to clear all sessions?");
  if (confirmClear) {
    // Clear all sessions
    sessions = [];
    updateSessionsInStorage();
    renderSessions();

    // Remove all session elements from the DOM
    const sessionContainer = document.getElementById("sessions");
    while (sessionContainer.firstChild) {
      sessionContainer.removeChild(sessionContainer.firstChild);
    }
  }
});

document
  .getElementById("new-session-btn")
  .addEventListener("click", () => createSession());
