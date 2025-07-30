
window.onload = setup;

function setup() {
  const allEpisodes = getAllEpisodes();
  makePageForEpisodes(allEpisodes);
}

// Create and return an episode card element
function createEpisodeCard(episode, template) {
  const episodeCard = template.content.cloneNode(true);

  // Title with code (e.g., "Episode Name - S01E02")
  const titleElem = episodeCard.querySelector(".title");
  const episodeCode = `S${episode.season.toString().padStart(2, "0")}E${episode.number.toString().padStart(2, "0")}`;
  titleElem.textContent = `${episode.name} - ${episodeCode}`;

  // Image handling
  const imageElem = episodeCard.querySelector(".image");
  if (episode.image?.medium) {
    imageElem.src = episode.image.medium;
    imageElem.alt = episode.name || "Episode image";
  } else {
    imageElem.src = "https://via.placeholder.com/210x118?text=No+Image";
    imageElem.alt = "No image available";
  }

  // Summary (basic sanitization - safe if TVMaze is trusted)
  const summaryElem = episodeCard.querySelector(".summary");
  summaryElem.innerHTML = episode.summary || "No summary available.";

  return episodeCard;
}

// Renders all episode cards
function makePageForEpisodes(episodeList) {
  const rootElem = document.getElementById("episode-container");
  rootElem.textContent = ""; // Clear existing content

  const template = document.getElementById("episode-template");

  episodeList.forEach((episode) => {
    const episodeCard = createEpisodeCard(episode, template);
    rootElem.appendChild(episodeCard);
  });
  
}


