console.log("IT’S ALIVE!");

const autoLabel = "Automatic";

document.body.insertAdjacentHTML(
  "afterbegin",
  `
  <label class="color-scheme">
    Theme:
    <select>
      <option value="auto">${autoLabel}</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  </label>
  `
);

const select = document.querySelector(".color-scheme select");

function setColorScheme(value) {
  document.documentElement.classList.remove("light", "dark");

  if (value === "light") {
    document.documentElement.classList.add("light");
  } else if (value === "dark") {
    document.documentElement.classList.add("dark");
  }

  localStorage.colorScheme = value;
  select.value = value;
}

if ("colorScheme" in localStorage) {
  setColorScheme(localStorage.colorScheme);
} else {
  setColorScheme("auto");
}

select.addEventListener("input", (event) => {
  setColorScheme(event.target.value);
});

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

const BASE_PATH =
  location.hostname === "localhost" || location.hostname === "127.0.0.1"
    ? "/"
    : "/portfolio/";

let pages = [
  { url: "", title: "Home" },
  { url: "projects/", title: "Projects" },
  { url: "contact/", title: "Contact" },
  { url: "resume/", title: "Resume" },
  { url: "https://github.com/jiya-makhija", title: "GitHub" },
];

let nav = document.createElement("nav");
document.body.prepend(nav);

for (let p of pages) {
  let url = p.url;
  let title = p.title;

  url = !url.startsWith("http") ? BASE_PATH + url : url;

  let a = document.createElement("a");
  a.href = url;
  a.textContent = title;

  a.classList.toggle(
    "current",
    a.host === location.host && a.pathname === location.pathname
  );

  if (a.host !== location.host) {
    a.target = "_blank";
  }

  nav.append(a);
}

export async function fetchJSON(url) {
  try {
    const response = await fetch(url);
    console.log(response);

    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching or parsing JSON data:', error);
  }
}

export function renderProjects(projects, container, headingLevel = 'h2') {
  container.innerHTML = '';

  for (let project of projects) {
    const article = document.createElement('article');

    const heading = document.createElement(headingLevel);
    heading.textContent = project.title;

    const description = document.createElement('p');
    description.textContent = project.description;

    article.append(heading, description);
    container.appendChild(article);
  }
}
