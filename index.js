import { fetchJSON, renderProjects, fetchGitHubData } from './global.js';

const container = document.querySelector('.projects');

if (container) {
  fetchJSON('./lib/projects.json').then(projects => {
    const latestProjects = projects.slice(0, 3);
    renderProjects(latestProjects, container, 'h2');
  });
}

const githubData = await fetchGitHubData('jiya-makhija');
const profileStats = document.querySelector('#profile-stats');

if (profileStats) {
    profileStats.innerHTML = `
    <dl class="github-grid">
    <dt>Followers:</dt><dd>${githubData.followers}</dd>
    <dt>Following:</dt><dd>${githubData.following}</dd>
    <dt>Public Repos:</dt><dd>${githubData.public_repos}</dd>
    <dt>Public Gists:</dt><dd>${githubData.public_gists}</dd>
    </dl>
    `;
  }