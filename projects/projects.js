import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON('../lib/projects.json');
const container = document.querySelector('.projects');
renderProjects(projects, container, 'h2');

const title = document.querySelector('.projects-title');
if (title) title.textContent = `${projects.length} Projects`;

import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

let data = [1, 2, 3, 4, 5, 5];

let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
let sliceGenerator = d3.pie();
let arcData = sliceGenerator(data);

let colors = d3.scaleOrdinal(d3.schemeTableau10);

arcData.forEach((d, i) => {
  d3.select('#projects-pie-plot')
    .append('path')
    .attr('d', arcGenerator(d))
    .attr('fill', colors(i));
});