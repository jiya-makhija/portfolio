import { fetchJSON, renderProjects } from './global.js';

const container = document.querySelector('.projects');

if (container) {
  fetchJSON('./lib/projects.json').then(projects => {
    const latestProjects = projects.slice(0, 3);
    renderProjects(latestProjects, container, 'h2');
  });
}