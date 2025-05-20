import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
let xScale, yScale, rScale;
let filteredCommits = [];

async function loadData() {
  const data = await d3.csv('loc.csv', (row) => ({
    ...row,
    line: Number(row.line),
    depth: Number(row.depth),
    length: Number(row.length),
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime),
  }));
  return data;
}

function processCommits(data) {
  return d3
    .groups(data, (d) => d.commit)
    .map(([commit, lines]) => {
      let first = lines[0];
      let { author, date, time, timezone, datetime } = first;
      let ret = {
        id: commit,
        url: 'https://github.com/jiya-makhija/portfolio/commit/' + commit,
        author,
        date,
        time,
        timezone,
        datetime,
        hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
        totalLines: lines.length,
      };

      Object.defineProperty(ret, 'lines', {
        value: lines,
        enumerable: false,
        writable: true,
        configurable: true,
      });

      return ret;
    });
}

function renderCommitInfo(data, commits) {
  let dl = d3.select('#stats dl');
  if (dl.empty()) {
    dl = d3.select('#stats').append('dl').attr('class', 'stats');
  } else {
    dl.selectAll('*').remove();
  }
  
  dl.append('dt').text('Commits');
  dl.append('dd').text(commits.length);

  dl.append('dt').text('Files');
  dl.append('dd').text(d3.groups(data, d => d.file).length);

  dl.append('dt').html('Total <abbr title="Lines of Code">LOC</abbr>');
  dl.append('dd').text(data.length);

  dl.append('dt').text('Max Depth');
  dl.append('dd').text(d3.max(data, d => d.depth));

  dl.append('dt').text('Longest Line');
  dl.append('dd').text(d3.max(data, d => d.length));

  dl.append('dt').text('Max Lines in a File');
  dl.append('dd').text(
    d3.max(
      d3.rollups(data, v => d3.max(v, d => d.line), d => d.file),
      d => d[1]
    )
);


}
function updateScatterPlot(data, commits) {
  d3.select('svg').remove();

  const width = 1000;
  const height = 600;
  const margin = { top: 10, right: 10, bottom: 30, left: 40 };

  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  const svg = d3
    .select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

  xScale = d3.scaleTime()
    .domain(d3.extent(commits, d => d.datetime))
    .range([usableArea.left, usableArea.right])
    .nice();

  yScale = d3.scaleLinear()
    .domain([0, 24])
    .range([usableArea.bottom, usableArea.top]);

  const [minLines, maxLines] = d3.extent(commits, d => d.totalLines);
  rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([6, 40]);

  svg.append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));

  svg.append('g')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .call(d3.axisBottom(xScale));

  svg.append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(d3.axisLeft(yScale).tickFormat(d => String(d % 24).padStart(2, '0') + ':00'));

  const sortedCommits = commits.toSorted((a, b) => b.totalLines - a.totalLines);
  const dots = svg.append('g').attr('class', 'dots');

  dots.selectAll('circle')
    .data(sortedCommits)
    .join('circle')
    .attr('cx', d => xScale(d.datetime))
    .attr('cy', d => yScale(d.hourFrac))
    .attr('r', d => rScale(d.totalLines))
    .style('--r', d => rScale(d.totalLines))
    .attr('fill', 'steelblue')
    .style('fill-opacity', 0.7)
    .on('mouseenter', (event, commit) => {
      d3.select(event.currentTarget).style('fill-opacity', 1);
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mouseleave', (event) => {
      d3.select(event.currentTarget).style('fill-opacity', 0.7);
      updateTooltipVisibility(false);
    });

  svg.call(d3.brush().on('start brush end', brushed));
  svg.selectAll('.dots, .overlay ~ *').raise();
}

function filterCommitsByTime(commits, commitMaxTime) {
  return commits.filter(c => c.datetime <= commitMaxTime);
}

let data = await loadData();
let commits = processCommits(data);
renderCommitInfo(data, commits);
updateScatterPlot(data, commits);

function renderTooltipContent(commit) {
  const link = document.getElementById('commit-link');
  const date = document.getElementById('commit-date');
  const time = document.getElementById('commit-time');
  const author = document.getElementById('commit-author');
  const lines = document.getElementById('commit-lines');

  if (Object.keys(commit).length === 0) return;

  link.href = commit.url;
  link.textContent = commit.id;
  date.textContent = commit.datetime.toLocaleDateString('en', { dateStyle: 'full' });
  time.textContent = commit.datetime.toLocaleTimeString('en');
  author.textContent = commit.author;
  lines.textContent = commit.totalLines;
}

function updateTooltipVisibility(isVisible) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.style.left = `${event.clientX}px`;
  tooltip.style.top = `${event.clientY}px`;
}

function renderSelectionCount(selection) {
  const selectedCommits = selection
    ? commits.filter((d) => isCommitSelected(selection, d))
    : [];

  document.getElementById('selection-count').textContent =
    `${selectedCommits.length || 'No'} commits selected`;
}

function renderLanguageBreakdown(selection) {
  const selectedCommits = selection
    ? commits.filter((d) => isCommitSelected(selection, d))
    : [];

  const container = document.getElementById('language-breakdown');
  container.innerHTML = '';

  if (selectedCommits.length === 0) return;

  const lines = selectedCommits.flatMap((d) => d.lines);
  const breakdown = d3.rollup(lines, v => v.length, d => d.type);

  for (const [lang, count] of breakdown) {
    const percent = d3.format('.1~%')(count / lines.length);
    container.innerHTML += `<dt>${lang}</dt><dd>${count} lines (${percent})</dd>`;
  }
}
function brushed(event) {
  const selection = event.selection;

  d3.selectAll('circle').classed('selected', (d) =>
    isCommitSelected(selection, d)
  );

  renderSelectionCount(selection);
  renderLanguageBreakdown(selection);
}

function isCommitSelected(selection, commit) {
  if (!selection) return false;

  const [[x0, y0], [x1, y1]] = selection;

  const cx = xScale(commit.datetime);
  const cy = yScale(commit.hourFrac);

  return cx >= x0 && cx <= x1 && cy >= y0 && cy <= y1;
}

let commitProgress = 100;

let timeScale = d3.scaleTime(
  [d3.min(commits, (d) => d.datetime), d3.max(commits, (d) => d.datetime)],
  [0, 100]
);
let commitMaxTime = timeScale.invert(commitProgress);
const selectedTime = d3.select('#selectedTime');
selectedTime.text(timeScale.invert(commitProgress).toLocaleString());

function renderFiles(filteredCommits) {
  let lines = filteredCommits.flatMap((d) => d.lines);
  let files = d3.groups(lines, (d) => d.file).map(([name, lines]) => ({ name, lines }));

  const dl = d3.select('.files');
  dl.selectAll('div').remove();

  let filesContainer = dl.selectAll('div').data(files).enter().append('div');

  filesContainer.append('dt').style('grid-column', '1').append('code').text(d => d.name);
  filesContainer.append('dd').style('grid-column', '2').text(d => `${d.lines.length} lines`);
}

renderFiles(filteredCommits)
function updateTimeDisplay() {
  commitProgress = +d3.select('#commit-slider').property('value');
  commitMaxTime = timeScale.invert(commitProgress);
  selectedTime.text(commitMaxTime.toLocaleString());

  filteredCommits = filterCommitsByTime(commits, commitMaxTime);
  updateScatterPlot(data, filteredCommits);
  renderCommitInfo(data, filteredCommits);
  renderFiles(filteredCommits);
}
d3.select('#commit-slider').on('input', updateTimeDisplay);