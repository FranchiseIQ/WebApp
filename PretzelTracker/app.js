let supabaseClient = null;
let pretzelChart = null;
let cachedRows = [];

const statusEl = document.getElementById("statusMessage");
const tableBody = document.getElementById("submissionsBody");
const emptyMessageEl = document.getElementById("emptyMessage");
const formEl = document.getElementById("priceForm");

function setStatus(message, type = "") {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.className = "";
  if (type === "error") {
    statusEl.classList.add("status-error");
  } else if (type === "success") {
    statusEl.classList.add("status-success");
  }
}

function isUsernameValid(name) {
  if (!name) return false;
  const trimmed = name.trim();
  if (trimmed.length < 3 || trimmed.length > 24) return false;

  const lowered = trimmed.toLowerCase();
  const banned = ["fuck", "shit", "bitch", "slur1", "slur2"];
  const blockedSubstrings = ["http", "www", ".com", ".net", ".org", "@"]; 

  if (blockedSubstrings.some((term) => lowered.includes(term))) {
    return false;
  }

  if (banned.some((term) => lowered.includes(term))) {
    return false;
  }

  return true;
}

function initSupabase() {
  if (!window.supabase) {
    setStatus("Supabase library failed to load. Please check your network.", "error");
    return null;
  }

  if (typeof SUPABASE_URL === "undefined" || typeof SUPABASE_ANON_KEY === "undefined") {
    setStatus(
      "Supabase is not configured. Please create supabase-config.js with your project URL and anon key.",
      "error"
    );
    return null;
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    setStatus(
      "Supabase is not configured. Please create supabase-config.js with your project URL and anon key.",
      "error"
    );
    return null;
  }

  try {
    return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (err) {
    console.error("Error initializing Supabase", err);
    setStatus("Unable to initialize Supabase client.", "error");
    return null;
  }
}

function parsePrice(value) {
  if (value === "" || value === null || typeof value === "undefined") return null;
  const num = Number(value);
  if (Number.isNaN(num)) return null;
  return num;
}

async function loadSubmissions() {
  if (!supabaseClient) return;
  setStatus("Loading data...");
  try {
    const { data, error } = await supabaseClient
      .from("pretzel_prices")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      console.error("Error loading submissions", error);
      setStatus("Unable to load submissions.", "error");
      return;
    }

    cachedRows = Array.isArray(data) ? data : [];
    renderTable(cachedRows);
    renderChart(cachedRows);
    setStatus("");
  } catch (err) {
    console.error("Unexpected error loading submissions", err);
    setStatus("Unable to load submissions.", "error");
  }
}

function renderTable(rows) {
  if (!tableBody) return;
  tableBody.innerHTML = "";
  if (!rows || rows.length === 0) {
    emptyMessageEl.textContent = "No submissions yet. Be the first to add a pretzel price.";
    return;
  }

  emptyMessageEl.textContent = "";
  rows.forEach((row) => {
    const tr = document.createElement("tr");

    const usernameCell = document.createElement("td");
    usernameCell.textContent = row.username;
    tr.appendChild(usernameCell);

    const locationCell = document.createElement("td");
    locationCell.textContent = row.location_text;
    tr.appendChild(locationCell);

    const originalCell = document.createElement("td");
    originalCell.textContent = formatPrice(row.price_original);
    tr.appendChild(originalCell);

    const cinnamonCell = document.createElement("td");
    cinnamonCell.textContent = row.price_cinnamon != null ? formatPrice(row.price_cinnamon) : "-";
    tr.appendChild(cinnamonCell);

    const pepperoniCell = document.createElement("td");
    pepperoniCell.textContent = row.price_pepperoni != null ? formatPrice(row.price_pepperoni) : "-";
    tr.appendChild(pepperoniCell);

    const dateCell = document.createElement("td");
    dateCell.textContent = row.created_at ? new Date(row.created_at).toLocaleString() : "";
    tr.appendChild(dateCell);

    tableBody.appendChild(tr);
  });
}

function formatPrice(value) {
  if (value == null || Number.isNaN(value)) return "-";
  const num = Number(value);
  return `$${num.toFixed(2)}`;
}

function buildDailyAverages(rows) {
  const daily = {};
  rows.forEach((row) => {
    if (row.price_original == null) return;
    const date = row.created_at ? new Date(row.created_at) : null;
    if (!date) return;
    const key = date.toISOString().slice(0, 10);
    if (!daily[key]) {
      daily[key] = { total: 0, count: 0 };
    }
    daily[key].total += Number(row.price_original);
    daily[key].count += 1;
  });

  const sortedDates = Object.keys(daily).sort();
  const labels = [];
  const values = [];
  sortedDates.forEach((key) => {
    labels.push(key);
    values.push(daily[key].total / daily[key].count);
  });

  return { labels, values };
}

function renderChart(rows) {
  const ctx = document.getElementById("pretzelChart");
  if (!ctx) return;

  const { labels, values } = buildDailyAverages(rows || []);

  if (pretzelChart) {
    pretzelChart.data.labels = labels;
    pretzelChart.data.datasets[0].data = values;
    pretzelChart.update();
    return;
  }

  pretzelChart = new Chart(ctx.getContext("2d"), {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Average Original Pretzel Price",
          data: values,
          borderColor: "#2563eb",
          backgroundColor: "rgba(37, 99, 235, 0.1)",
          tension: 0.2,
          fill: true,
          pointRadius: 3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: {
            display: true,
            text: "Date",
          },
        },
        y: {
          title: {
            display: true,
            text: "Average Original Pretzel Price (USD)",
          },
          beginAtZero: true,
        },
      },
      plugins: {
        tooltip: {
          enabled: true,
        },
        legend: {
          display: true,
        },
      },
    },
  });
}

async function handleSubmit(event) {
  event.preventDefault();
  if (!supabaseClient) {
    setStatus(
      "Supabase is not configured. Please create supabase-config.js with your project URL and anon key.",
      "error"
    );
    return;
  }

  const username = (document.getElementById("username").value || "").trim();
  const location = (document.getElementById("location").value || "").trim();
  const priceOriginal = parsePrice(document.getElementById("price_original").value);
  const priceCinnamon = parsePrice(document.getElementById("price_cinnamon").value);
  const pricePepperoni = parsePrice(document.getElementById("price_pepperoni").value);
  const notes = (document.getElementById("notes").value || "").trim();

  if (!isUsernameValid(username)) {
    setStatus("Please enter a respectful username between 3 and 24 characters.", "error");
    return;
  }

  if (!location) {
    setStatus("Location is required.", "error");
    return;
  }

  if (priceOriginal === null || priceOriginal <= 0) {
    setStatus("Original pretzel price must be a positive number.", "error");
    return;
  }

  if (priceCinnamon !== null && priceCinnamon < 0) {
    setStatus("Cinnamon price cannot be negative.", "error");
    return;
  }

  if (pricePepperoni !== null && pricePepperoni < 0) {
    setStatus("Pepperoni price cannot be negative.", "error");
    return;
  }

  const newRow = {
    username,
    location_text: location,
    price_original: priceOriginal,
    price_cinnamon: priceCinnamon,
    price_pepperoni: pricePepperoni,
    notes: notes || null,
  };

  try {
    const { data, error } = await supabaseClient
      .from("pretzel_prices")
      .insert([newRow])
      .select();

    if (error) {
      console.error("Error submitting report", error);
      setStatus("Error submitting report. Please try again.", "error");
      return;
    }

    const insertedRow = data && data[0] ? data[0] : null;
    if (insertedRow) {
      cachedRows = [insertedRow, ...cachedRows];
      renderTable(cachedRows);
      renderChart(cachedRows);
    }

    formEl.reset();
    setStatus("Report submitted. Thank you!", "success");
  } catch (err) {
    console.error("Unexpected error submitting report", err);
    setStatus("Error submitting report. Please try again.", "error");
  }
}

function main() {
  supabaseClient = initSupabase();
  if (supabaseClient) {
    loadSubmissions();
  }

  if (formEl) {
    formEl.addEventListener("submit", handleSubmit);
  }
}

document.addEventListener("DOMContentLoaded", main);
