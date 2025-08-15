
//-------------- STATE -----------------------------

const appState = {
  shows: [],        // list of shows from /shows
  allEpisodes: [],  // episodes for the selected show
  episodesByShow: [], // key: show.id, value: array of episodes
  searchTerm: "",
};


// ------------DOM refs -------------------
// (assigned in setup after DOM loaded)

let template;
let messageElem;
let rootElem;
let searchInput;
let searchCount;
let showSelect;
let episodeSelect;


// Helper to show a loading/error/info message in the DOM

function showMessage(text = "", isError = false) {
  if (!messageElem) return;
  messageElem.textContent = text;
  messageElem.style.color = isError ? "crimson" : "";
}

// -----------RENDER SHOWS--------------------------
// Function to render all shows

function renderShows(shows) {
  if (!rootElem) return;
  rootElem.innerHTML = "";

  if (!Array.isArray(shows) || shows.length === 0) {
    rootElem.textContent = "No shows available";
    return;
  }
  shows
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(createShowCard) // clickable cards now
    .forEach(card => rootElem.appendChild(card));
}

// ----------- BACK TO SHOWS ----------------------

function showBackToShowsButton() {
  const backButton = document.createElement("button");
  backButton.textContent = "← Back to All Shows";
  backButton.classList.add("back-to-shows-button"); // assign the CSS class

  backButton.addEventListener("click", () => {
    // Clear search count text
    if (searchCount) {
      searchCount.textContent = "";
    }

    // Also clear any show search input
    const showSearchInput = document.getElementById("showSearch");
    if (showSearchInput) {
      showSearchInput.value = "";
    }

    populateShowSelector();
    renderShows(appState.shows);

    if (searchInput) {
      searchInput.disabled = true;
      searchInput.value = ""; // clear search text
    }
  });

  rootElem.prepend(backButton);
}

// -----------FETCH SHOWS--------------------------
// Fetch list of shows and populate the show select

async function fetchShows() {
  if (appState.shows.length > 0) {
    // Already fetched — use cached data
    return appState.shows;
  }
  const response = await fetch("https://api.tvmaze.com/shows");
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  const shows = await response.json();

  appState.shows = Array.isArray(shows) ? shows : [];
  return appState.shows;
}

// ----------------- FETCH EPISODES FOR SHOW --------------------
// Fetch episodes for a show id, store them and render

async function fetchEpisodesForShow(showId) {
  if (appState.episodesByShow[showId]) {
    // Already fetched — use cached episodes
    appState.allEpisodes = appState.episodesByShow[showId];
    populateEpisodeSelector();
    render();
    showBackToShowsButton(); 
    return;
  }

  const endpoint = `https://api.tvmaze.com/shows/${showId}/episodes`;
  const response = await fetch(endpoint);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  const episodes = await response.json();

  // Save in cache
  appState.episodesByShow[showId] = episodes;
  appState.allEpisodes = episodes;
  populateEpisodeSelector();
  render();
  showBackToShowsButton();
  
}

// ---------------POPULATE SHOW SELECTOR ----------------------
// Populate the show dropdown

function populateShowSelector() {
  if (!showSelect) return;
  showSelect.innerHTML = "";

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Select a Show";
  defaultOption.selected = true;
  showSelect.appendChild(defaultOption);

  // Sort and add each show
  const sortedShows = appState.shows
    .slice()
    .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

  // Put a short label for each show. change what to display
  sortedShows.forEach((show) => {
    const option = document.createElement("option");
    option.value = show.id; // use show.id for fetching episodes later
    option.textContent = show.name;
    showSelect.appendChild(option);
  });
}

// -------------- POPULATE EPISODE SELECTOR -----------------------
// Populate the episode dropdown (for current appState.allEpisodes)

function populateEpisodeSelector() {

  if (searchInput) {
    searchInput.disabled = appState.allEpisodes.length === 0;
  }

  if (!episodeSelect) return;
  episodeSelect.innerHTML = "";

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Select an Episode";
  defaultOption.selected = true;
  episodeSelect.appendChild(defaultOption);

  appState.allEpisodes.forEach((ep, i) => {
    const option = document.createElement("option");
    option.value = i;
    const code = `S${String(ep.season).padStart(2, "0")}E${String(ep.number).padStart(2, "0")}`;
    option.textContent = `${code} - ${ep.name}`;
    episodeSelect.appendChild(option);
  });
}

// ------------------ CREATE FILM CARD ----------------------------
// Template-based card creator (template must be assigned in setup)

function createFilmCard(film) {
  const episodeElem = template.content.cloneNode(true);

  const titleElem = episodeElem.querySelector(".title");
  const episodeCode = `S${String(film.season).padStart(2, "0")}E${String(film.number).padStart(2, "0")}`;
  if (titleElem) titleElem.textContent = `${episodeCode} - ${film.name}`;

  const imageElem = episodeElem.querySelector(".image");
  if (imageElem) {
    if (film.image && film.image.medium) {
      imageElem.src = film.image.medium;
      imageElem.alt = film.name || "Episode image";
    } else {
      imageElem.src = "https://via.placeholder.com/210x118?text=No+Image";
      imageElem.alt = "No image available";
    }
  }

  const summaryElem = episodeElem.querySelector(".summary");
  if (summaryElem) summaryElem.innerHTML = film.summary || "No summary available.";

  return episodeElem;
}

// ---------- CREATE SHOW CARD --------------------------

function createShowCard(show) {
  const card = document.createElement("div");
  card.classList.add("show-card"); 

  // Title
  const title = document.createElement("h2");
  title.classList.add("show-title");
  title.textContent = show.name;

  // Click to load episodes
  card.addEventListener("click", () => {
    fetchEpisodesForShow(show.id);
  });

  // Container for image + summary + details
  const contentWrapper = document.createElement("div");
  contentWrapper.classList.add("show-content");

  // Left: image
  const image = document.createElement("img"); 
  image.src = show.image?.medium || "https://via.placeholder.com/210x295?text=No+Image";
  image.alt = show.name;

  // Middle: summary
  const summary = document.createElement("div");
  summary.classList.add("show-summary");
  summary.innerHTML = show.summary || "No summary available";

  // Right: details
  const details = document.createElement("div");
  details.classList.add("show-details");
  details.innerHTML = `
    <p><strong>Rating:</strong> ${show.rating?.average ?? "N/A"}</p>
    <p><strong>Genres:</strong> ${show.genres?.join(", ") || "N/A"}</p>
    <p><strong>Status:</strong> ${show.status || "N/A"}</p>
    <p><strong>Runtime:</strong> ${show.runtime ?? "N/A"} minutes</p>
  `;

  // Build structure
  contentWrapper.appendChild(image);
  contentWrapper.appendChild(summary);
  contentWrapper.appendChild(details);

  card.appendChild(title);
  card.appendChild(contentWrapper);

  return card;
}




// ---------------------- RENDER -----------------------
// Renders episode list based on appState and searchTerm

function render() {
  if (!rootElem) return;
  rootElem.innerHTML = "";

  const episodes = Array.isArray(appState.allEpisodes) ? appState.allEpisodes : [];

  const q = (appState.searchTerm || "").toLowerCase().trim();
  const filtered = episodes.filter((episode) => {
    const name = (episode.name || "").toLowerCase();
    const summary = (episode.summary || "").toLowerCase();
    return name.includes(q) || summary.includes(q);
  });

  if (searchCount) {
    searchCount.textContent = `displaying: ${filtered.length}/${episodes.length}`;
  }

  if (filtered.length === 0) {
    const empty = document.createElement("div");
    empty.textContent = episodes.length === 0 ? "No episodes to show." : "No episodes match your search.";
    rootElem.appendChild(empty);
    return;
  }

  filtered.map(createFilmCard).forEach((elem) => rootElem.appendChild(elem));
}

// ----------- HANDLE SHOW SEARCH ---------------------

document.getElementById("showSearch").addEventListener("input", handleSearchShow);


function handleSearchShow(event) {
  const query = event.target.value.toLowerCase().trim();

  // Filter shows based on name, genres, or summary
  const filteredShows = appState.shows.filter(show => {
    const nameMatch = show.name.toLowerCase().includes(query);
    const genreMatch = show.genres.some(genre => genre.toLowerCase().includes(query));
    const summaryMatch = (show.summary || "").toLowerCase().includes(query);
    return nameMatch || genreMatch || summaryMatch;
  });

  renderShows(filteredShows);
}



// ----------- HANDLE SEARCH EPISODE INPUT --------------------
// Input handlers will be attached in setup (DOM-ready)

function handleSearchInput(event) {
  appState.searchTerm = event.target.value;
  render();
}

// ------------------ SETUP ---------------------------
// Called after DOM loaded

function setup() {

  // assign DOM elements safely after DOMContentLoaded
  template = document.getElementById("episode-template");
  messageElem = document.getElementById("message");
  rootElem = document.getElementById("episode-container");
  searchInput = document.getElementById("mySearch");
  searchCount = document.getElementById("search-count");
  showSelect = document.getElementById("show-select");
  episodeSelect = document.getElementById("episode-select");

  // handlers
  if (searchInput) {
    searchInput.disabled = true;
    searchInput.addEventListener("input", handleSearchInput);
  }

  if (showSelect) {
    showSelect.addEventListener("change", function () {
      const showId = this.value;
      if (!showId) {
        // reset UI if user selects the default empty option
        appState.allEpisodes = [];
        populateEpisodeSelector();
        render();
        return;
      }
      fetchEpisodesForShow(showId);
    });
  }

  if (episodeSelect) {
    episodeSelect.addEventListener("change", function () {
      const selectedIndex = this.value;
      if (selectedIndex === "") return;
      const selectedEpisode = appState.allEpisodes[selectedIndex];
      if (!selectedEpisode) return;

      // Clear container and show only the selected episode; add back button
      rootElem.innerHTML = "";
      document.querySelectorAll('[data-button="scroll-back"]').forEach((b) => b.remove());

      const scrollBack = document.createElement("button");
      scrollBack.setAttribute("data-button", "scroll-back");
      scrollBack.textContent = "Back to All Episodes";
      scrollBack.addEventListener("click", () => render());

      const footer = document.querySelector("footer");
      if (footer) document.body.insertBefore(scrollBack, footer);
      rootElem.appendChild(createFilmCard(selectedEpisode));
    });
  }

  // -------- INITIAL RENDER AND FETCH SHOWS -------------------

  
  fetchShows()
  .then(() => {
    populateShowSelector();
    renderShows(appState.shows); // render shows listing
  })
  .catch(err => {
    showMessage("Failed to load shows", true);
    console.error(err);
  });
}

window.onload = setup;
