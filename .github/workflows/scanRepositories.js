// scanRepositories.js
const fs = require('fs');
const axios = require('axios');
const parse = require('node-html-parser');

// Load repository URLs from a JSON file
const repositoriesJson = fs.readFileSync('repositories.json');
const repositories = JSON.parse(repositoriesJson).repositories || [];

const games = [];

async function processRepository(repo) {
  try {
    const response = await axios.get(`https://api.github.com/repos/${repo}/contents`);
    const contents = response.data;

    for (const item of contents) {
      if (item.type === 'dir') {
        const gameName = await getGameName(repo, item.name);
        const gameURL = `https://${repo.split('/')[0]}.github.io/${repo.split('/')[1]}/${item.name}/`;

        games.push({
          gameName,
          gameURL
        });
      }
    }
  } catch (error) {
    console.error(`Error processing repository ${repo}: ${error.message}`);
  }
}

async function getGameName(repo, folder) {
  try {
    const response = await axios.get(`https://${repo.split('/')[0]}.github.io/${repo.split('/')[1]}/${folder}/index.html`);
    const html = response.data;
    const root = parse.parse(html);
    const titleElement = root.querySelector('title');
    return titleElement ? titleElement.text.trim() : folder;
  } catch (error) {
    console.error(`Error getting game name for ${folder} in repository ${repo}: ${error.message}`);
    return folder;
  }
}

async function run() {
  for (const repo of repositories) {
    await processRepository(repo.url);
  }

  const jsonContent = JSON.stringify({ games }, null, 2);
  fs.writeFileSync('games.json', jsonContent);
}

run();
